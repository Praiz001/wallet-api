/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { User } from "./entities/auth.entity";
import { ApiAuthDocs } from "./docs/auth.swagger";
import { ApiTags } from "@nestjs/swagger";

interface AuthenticatedRequest extends Request {
  user: User;
}
@Controller("auth")
@ApiTags("Authentication")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("google")
  @UseGuards(AuthGuard("google"))
  @ApiAuthDocs.googleAuth()
  async googleAuth(@Req() req: Request) {
    // Initiates Google OAuth flow
    // Passport redirects to Google automatically
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiAuthDocs.googleCallback()
  googleAuthCallback(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const user = req.user;
    const token = this.authService.generateJWT(user);

    // Redirect to frontend with token, or return JSON
    // For API, return JSON:
    return res.json({
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  }
}
