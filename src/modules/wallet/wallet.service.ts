import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, MoreThanOrEqual } from "typeorm";
import { Wallet } from "./entities/wallet.entity";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "./entities/transaction.entity";
import { PaystackService } from "./paystack.service";
import * as crypto from "crypto";

interface PaystackWebhookData {
  reference: string;
  amount: number;
  status: string;
  [key: string]: any;
}

interface PaystackWebhookPayload {
  event: string;
  data: PaystackWebhookData;
}
@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private paystackService: PaystackService,
    private dataSource: DataSource,
  ) {}

  async initiateDeposit(userId: string, amount: number) {
    // Validate amount
    if (amount <= 0) {
      throw new BadRequestException("Amount must be greater than 0");
    }

    // Get user wallet
    const wallet = await this.walletRepository.findOne({
      where: { user_id: userId },
      relations: ["user"],
    });

    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }

    // Generate unique reference
    const reference = `DEP_${userId}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    // Create pending transaction
    await this.transactionRepository.save({
      wallet_id: wallet.id,
      type: TransactionType.DEPOSIT,
      amount,
      status: TransactionStatus.PENDING,
      reference,
    });

    // Initialize Paystack transaction
    const paystackResponse = await this.paystackService.initializeTransaction(
      wallet.user.email,
      amount,
      reference,
    );

    return {
      reference,
      authorization_url: paystackResponse.authorization_url,
    };
  }

  async handleWebhook(payload: PaystackWebhookPayload, signature: string) {
    // VERIFY PAYSTACK SIGNATURE
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(JSON.stringify(payload))
      .digest("hex");

    if (hash !== signature) {
      throw new Error("Invalid Paystack signature");
    }

    const { event, data } = payload;

    // process successful charges
    if (event !== "charge.success" || data.status !== "success") {
      return { status: true };
    }

    const reference = data.reference;
    const amountInKobo = data.amount;
    // const amountInNaira = amountInKobo / 100;

    // IDEMPOTENCY CHECK WITH LOCKING
    return await this.dataSource.transaction(async (manager) => {
      // Find transaction with lock
      const transaction = await manager.findOne(Transaction, {
        where: { reference },
        lock: { mode: "pessimistic_write" },
      });

      if (!transaction) {
        // unknown reference
        console.log(`Unknown reference: ${reference}`);
        return { status: true };
      }

      if (transaction.status === TransactionStatus.SUCCESS) {
        // Already processed, return success (idempotent)
        console.log(`Duplicate webhook for: ${reference}`);
        return { status: true };
      }

      // UPDATE TRANSACTION AND WALLET ATOMICALLY
      // Update transaction status
      await manager.update(
        Transaction,
        { id: transaction.id },
        { status: TransactionStatus.SUCCESS },
      );

      // Credit wallet balance
      await manager.increment(
        Wallet,
        { id: transaction.wallet_id },
        "balance",
        amountInKobo,
      );

      console.log(`Successfully processed deposit: ${reference}`);
      return { status: true };
    });
  }

  async getDepositStatus(reference: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { reference, type: TransactionType.DEPOSIT },
    });

    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    return {
      reference: transaction.reference,
      status: transaction.status,
      amount: transaction.amount,
    };
  }

  async transferFunds(
    senderUserId: string,
    recipientWalletNumber: string,
    amount: number,
  ) {
    // Validate amount
    if (amount <= 0) {
      throw new BadRequestException("Amount must be greater than 0");
    }

    // Find sender wallet
    const senderWallet = await this.walletRepository.findOne({
      where: { user_id: senderUserId },
    });

    if (!senderWallet) {
      throw new NotFoundException("Sender wallet not found");
    }

    // Find recipient wallet
    const recipientWallet = await this.walletRepository.findOne({
      where: { wallet_number: recipientWalletNumber },
    });

    if (!recipientWallet) {
      throw new NotFoundException("Recipient wallet not found");
    }

    // Prevent self-transfer
    if (senderWallet.id === recipientWallet.id) {
      throw new BadRequestException("Cannot transfer to yourself");
    }

    // check balance that is sufficient
    if (senderWallet.balance < amount) {
      throw new BadRequestException("Insufficient balance");
    }

    // ATOMIC TRANSACTION WITH RACE CONDITION PREVENTION
    return await this.dataSource.transaction(async (manager) => {
      // Deduct from sender WITH CONDITIONAL CHECK (prevents race condition)
      const deductResult = await manager.decrement(
        Wallet,
        {
          id: senderWallet.id,
          balance: MoreThanOrEqual(amount),
        },
        "balance",
        amount,
      );

      // If no rows affected, balance was insufficient (race condition detected)
      if (deductResult.affected === 0) {
        throw new BadRequestException(
          "Insufficient balance (concurrent check)",
        );
      }

      // Credit recipient
      await manager.increment(
        Wallet,
        { id: recipientWallet.id },
        "balance",
        amount,
      );
      // Generate unique references
      const timestamp = Date.now();
      const random = crypto.randomBytes(4).toString("hex");

      // Record transfer-out transaction
      await manager.save(Transaction, {
        wallet_id: senderWallet.id,
        type: TransactionType.TRANSFER_OUT,
        amount: -amount, //-ve for debit
        status: TransactionStatus.SUCCESS,
        reference: `TRF_OUT_${timestamp}_${random}`,
        metadata: {
          recipient_wallet_number: recipientWalletNumber,
          recipient_wallet_id: recipientWallet.id,
        },
      });

      // Record transfer-in transaction
      await manager.save(Transaction, {
        wallet_id: recipientWallet.id,
        type: TransactionType.TRANSFER_IN,
        amount, // +ve for deposit
        status: TransactionStatus.SUCCESS,
        reference: `TRF_IN_${timestamp}_${random}`,
        metadata: {
          sender_wallet_number: senderWallet.wallet_number,
          sender_wallet_id: senderWallet.id,
        },
      });

      return {
        status: "success",
        message: "Transfer completed",
      };
    });
  }

  async getBalance(userId: string) {
    const wallet = await this.walletRepository.findOne({
      where: { user_id: userId },
    });

    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }

    return { balance: parseFloat(wallet.balance.toString()) };
  }

  async getTransactions(userId: string, limit = 50, offset = 0) {
    const wallet = await this.walletRepository.findOne({
      where: { user_id: userId },
    });

    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }

    const transactions = await this.transactionRepository.find({
      where: { wallet_id: wallet.id },
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    });

    return transactions;
  }
  async createWalletForUser(userId: string): Promise<Wallet> {
    // Generate unique wallet number with retry logic
    let walletNumber: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      walletNumber = this.generateWalletNumber();
      const existing = await this.walletRepository.findOne({
        where: { wallet_number: walletNumber },
      });

      if (!existing) {
        break; // Found unique number
      }

      attempts++;
      if (attempts >= maxAttempts) {
        throw new InternalServerErrorException(
          "Failed to generate unique wallet number",
        );
      }
    } while (attempts < maxAttempts);

    return this.walletRepository.save({
      user_id: userId,
      wallet_number: walletNumber,
      balance: 0,
    });
  }

  private generateWalletNumber(): string {
    // Generate 13-digit wallet number
    // Using timestamp + random for better uniqueness
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0"); // 6 random digits
    const combined = (timestamp + random).padStart(13, "0").slice(0, 13);
    return combined;
  }
}
