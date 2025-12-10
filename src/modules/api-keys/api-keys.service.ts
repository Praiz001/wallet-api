import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { ApiKey } from "./entities/api-key.entity";
import { CreateApiKeyDto } from "./dto/create-api-key.dto";
import { RolloverApiKeyDto } from "./dto/rollover-api-key.dto";

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async createApiKey(userId: string, dto: CreateApiKeyDto) {
    // check active key count (max 5)
    const activeCount = await this.apiKeyRepository.count({
      where: {
        user_id: userId,
        revoked: false,
        expires_at: MoreThan(new Date()),
      },
    });

    if (activeCount >= 5) {
      throw new BadRequestException("Maximum 5 active API keys allowed");
    }

    // parse expiry and convert to expires_at
    const expiresAt = this.parseExpiry(dto.expiry);

    // generate key
    const randomBytes = crypto.randomBytes(16).toString("hex");
    const rawKey = `sk_live_${randomBytes}`;

    // Hash key
    const keyHash = await bcrypt.hash(rawKey, 10);

    // Save to db
    await this.apiKeyRepository.save({
      user_id: userId,
      key_hash: keyHash,
      name: dto.name,
      permissions: dto.permissions,
      expires_at: expiresAt,
      revoked: false,
    });

    // return raw key only once (cannot be retrieved later)
    return {
      api_key: rawKey,
      expires_at: expiresAt,
    };
  }

  async rolloverKey(userId: string, dto: RolloverApiKeyDto) {
    // Find expired key
    const oldKey = await this.apiKeyRepository.findOne({
      where: {
        id: dto.expired_key_id,
        user_id: userId,
      },
    });

    if (!oldKey) {
      throw new NotFoundException("API key not found");
    }

    // Verify key is expired
    if (oldKey.expires_at > new Date()) {
      throw new BadRequestException("Key is not expired yet");
    }

    // Create new key with same permissions
    return this.createApiKey(userId, {
      name: oldKey.name,
      permissions: oldKey.permissions,
      expiry: dto.expiry,
    });
  }

  async validateKey(
    rawKey: string,
    requiredPermissions: string[] = [],
  ): Promise<ApiKey | null> {
    // Find all active API keys (not revoked, not expired)
    const apiKeys = await this.apiKeyRepository.find({
      where: {
        revoked: false,
        expires_at: MoreThan(new Date()),
      },
      relations: ["user"],
    });

    // Check each key hash
    for (const apiKey of apiKeys) {
      const isMatch = await bcrypt.compare(rawKey, apiKey.key_hash);

      if (isMatch) {
        // Check permissions if required
        if (requiredPermissions.length > 0) {
          const hasPermissions = requiredPermissions.every((perm) =>
            apiKey.permissions.includes(perm),
          );

          if (!hasPermissions) {
            throw new ForbiddenException("Insufficient permissions");
          }
        }

        return apiKey;
      }
    }

    return null;
  }

  private parseExpiry(expiry: string): Date {
    const now = new Date();
    const value = parseInt(expiry.slice(0, -1));
    const unit = expiry.slice(-1);

    switch (unit) {
      case "H":
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case "D":
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      case "M":
        return new Date(now.setMonth(now.getMonth() + value));
      case "Y":
        return new Date(now.setFullYear(now.getFullYear() + value));
      default:
        throw new BadRequestException("Invalid expiry format");
    }
  }
}
