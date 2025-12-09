import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { User } from "./entities/auth.entity";
import { Wallet } from "../wallet/entities/wallet.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async findOrCreateUser(googleProfile: {
    google_id: string;
    email: string;
    name: string;
  }): Promise<User> {
    // Find existing user by Google ID
    let user = await this.userRepository.findOne({
      where: { google_id: googleProfile.google_id },
      relations: ["wallet"],
    });

    if (user) {
      return user;
    }

    // Create new user
    user = await this.userRepository.save({
      email: googleProfile.email,
      google_id: googleProfile.google_id,
    });

    // Automatically create wallet for new user
    await this.createWalletForUser(user.id);

    // Reload user with wallet
    const userWithWallet = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ["wallet"],
    });

    if (!userWithWallet) {
      throw new InternalServerErrorException(
        "Failed to reload user after wallet creation",
      );
    }

    return userWithWallet;
  }

  private async createWalletForUser(userId: string): Promise<Wallet> {
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

  generateJWT(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }
}
// {
//       secret: this.configService.get<string>("JWT_SECRET")!,
//       expiresIn: this.configService.get<string>("JWT_EXPIRES_IN", "7d"),
//     }
