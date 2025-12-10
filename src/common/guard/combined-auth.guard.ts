import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../modules/auth/guards/jwt-auth.guard";
import { ApiKeyGuard } from "../../modules/api-keys/guards/api-key.guard";

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(
    private jwtAuthGuard: JwtAuthGuard,
    private apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Try JWT first
    const authHeader = request.headers.authorization;
    if (
      authHeader &&
      typeof authHeader === "string" &&
      authHeader.startsWith("Bearer ")
    ) {
      try {
        const result = await this.jwtAuthGuard.canActivate(context);
        return result as boolean;
      } catch (error: unknown) {
        // JWT failed, continue to API key check
        console.error("JWT auth failed:", error);
      }
    }

    // Try API Key
    const apiKey = request.headers["x-api-key"];
    if (apiKey && typeof apiKey === "string") {
      try {
        const result = await this.apiKeyGuard.canActivate(context);
        return result;
      } catch (error: unknown) {
        console.error("API key auth failed:", error);
        throw new UnauthorizedException("Invalid API key");
      }
    }

    throw new UnauthorizedException("No valid authentication provided");
  }
}
