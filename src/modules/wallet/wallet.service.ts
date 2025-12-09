import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
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

    // Only process successful charges
    if (event !== "charge.success" || data.status !== "success") {
      return { status: true };
    }

    const reference = data.reference;
    const amountInKobo = data.amount;
    const amountInNaira = amountInKobo / 100;

    // IDEMPOTENCY CHECK WITH LOCKING
    return await this.dataSource.transaction(async (manager) => {
      // Find transaction with lock (must be inside transaction)
      const transaction = await manager.findOne(Transaction, {
        where: { reference },
        lock: { mode: "pessimistic_write" },
      });

      if (!transaction) {
        // Unknown reference, log and ignore
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
        amountInNaira,
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
}
