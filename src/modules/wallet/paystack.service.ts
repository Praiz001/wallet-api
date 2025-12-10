import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

interface PaystackInitializeResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaystackVerifyResponse {
  status: string;
  reference: string;
  amount: number;
  [key: string]: any;
}

@Injectable()
export class PaystackService {
  private readonly secretKey: string;
  private readonly baseUrl = "https://api.paystack.co";

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.secretKey = this.configService.get<string>("PAYSTACK_SECRET_KEY")!;
  }

  async initializeTransaction(
    email: string,
    amount: number,
    reference: string,
    callbackUrl?: string,
  ): Promise<PaystackInitializeResponse> {
    const response = await firstValueFrom(
      this.httpService.post<{ data: PaystackInitializeResponse }>(
        `${this.baseUrl}/transaction/initialize`,
        {
          email,
          amount: amount, //in kobo
          // amount: amount * 100, //naira
          reference,
          callback_url:
            callbackUrl || this.configService.get<string>("FRONTEND_URL"),
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        },
      ),
    );

    return response.data.data;
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const response = await firstValueFrom(
      this.httpService.get<{ data: PaystackVerifyResponse }>(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      ),
    );

    return response.data.data;
  }
}
