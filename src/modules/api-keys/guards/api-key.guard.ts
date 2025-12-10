import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ApiKeysService } from "../api-keys.service";
import type { Request } from "express";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private apiKeysService: ApiKeysService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers["x-api-key"];

    if (!apiKey || typeof apiKey !== "string") {
      throw new UnauthorizedException("API key is required");
    }

    // get required permissions from decorator
    const requiredPermissions =
      this.reflector.get<string[]>("permissions", context.getHandler()) || [];

    // Validate API key
    const validatedKey = await this.apiKeysService.validateKey(
      apiKey,
      requiredPermissions,
    );

    if (!validatedKey) {
      throw new UnauthorizedException("Invalid or expired API key");
    }

    // Attach user to request (from API key's user)
    request.user = validatedKey.user;

    return true;
  }
}
