import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { User } from "../../modules/auth/entities/auth.entity";

interface AuthenticatedRequest extends Request {
  user: User;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
