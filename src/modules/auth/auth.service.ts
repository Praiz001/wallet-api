import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { User } from "./entities/auth.entity";
// import { Wallet } from "../wallet/entities/wallet.entity";
import { WalletService } from "../wallet/wallet.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private walletService: WalletService,
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
    await this.walletService.createWalletForUser(user.id);

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

  generateJWT(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }
}
