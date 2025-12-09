import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { WalletService } from "./wallet.service";
import { WalletController } from "./wallet.controller";
import { PaystackService } from "./paystack.service";
import { Wallet } from "./entities/wallet.entity";
import { Transaction } from "./entities/transaction.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, Transaction]), HttpModule],
  controllers: [WalletController],
  providers: [WalletService, PaystackService],
  exports: [WalletService, TypeOrmModule],
})
export class WalletModule {}
