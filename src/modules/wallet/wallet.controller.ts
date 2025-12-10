import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  HttpCode,
  UseGuards,
  Query,
} from "@nestjs/common";
import type { Request } from "express";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../auth/entities/auth.entity";
import { RequirePermissions } from "../api-keys/decorator/permissions.decorator";
import { CombinedAuthGuard } from "src/common/guard/combined-auth.guard";

@Controller("wallet")
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post("deposit")
  @UseGuards(CombinedAuthGuard)
  @RequirePermissions("deposit")
  async deposit(@CurrentUser() user: User, @Body() body: { amount: number }) {
    return this.walletService.initiateDeposit(user.id, body.amount);
  }

  @Post("transfer")
  @UseGuards(CombinedAuthGuard)
  @RequirePermissions("transfer")
  async transfer(
    @CurrentUser() user: User,
    @Body() body: { wallet_number: string; amount: number },
  ) {
    return this.walletService.transferFunds(
      user.id,
      body.wallet_number,
      body.amount,
    );
  }

  @Get("balance")
  @UseGuards(CombinedAuthGuard)
  @RequirePermissions("read")
  async getBalance(@CurrentUser() user: User) {
    return this.walletService.getBalance(user.id);
  }

  @Get("transactions")
  @UseGuards(JwtAuthGuard)
  async getTransactions(
    @CurrentUser() user: User,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.walletService.getTransactions(
      user.id,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Post("paystack/webhook")
  @HttpCode(200)
  async webhook(@Req() req: Request) {
    const signature = req.headers["x-paystack-signature"] as string;

    try {
      return await this.walletService.handleWebhook(req.body, signature);
    } catch (error) {
      console.error("Webhook error:", error);
      //return 200 to stop Paystack retries
      return { status: true };
    }
  }

  @Get("deposit/:reference/status")
  @UseGuards(CombinedAuthGuard)
  @RequirePermissions("read")
  async getDepositStatus(@Param("reference") reference: string) {
    return this.walletService.getDepositStatus(reference);
  }
}
