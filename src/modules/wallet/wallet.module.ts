import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { WalletService } from "./wallet.service";
import { WalletController } from "./wallet.controller";
import { PaystackService } from "./paystack.service";
import { Wallet } from "./entities/wallet.entity";
import { Transaction } from "./entities/transaction.entity";
import { AuthModule } from "../auth/auth.module";
import { ApiKeysModule } from "../api-keys/api-keys.module";
import { CombinedAuthGuard } from "../../common/guard/combined-auth.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction]),
    HttpModule,
    forwardRef(() => AuthModule),
    ApiKeysModule,
  ],
  controllers: [WalletController],
  providers: [WalletService, PaystackService, CombinedAuthGuard],
  exports: [WalletService, TypeOrmModule],
})
export class WalletModule {}
