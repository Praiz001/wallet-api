import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  HttpCode,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../auth/entities/auth.entity";

@Controller("wallet")
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post("deposit")
  @UseGuards(JwtAuthGuard)
  async deposit(@CurrentUser() user: User, @Body() body: { amount: number }) {
    return this.walletService.initiateDeposit(user.id, body.amount);
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
  @UseGuards(JwtAuthGuard)
  async getDepositStatus(@Param("reference") reference: string) {
    return this.walletService.getDepositStatus(reference);
  }
}
