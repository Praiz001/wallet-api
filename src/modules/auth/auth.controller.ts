import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { User } from "./entities/auth.entity";

interface AuthenticatedRequest extends Request {
  user: User;
}
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("google")
  @UseGuards(AuthGuard("google"))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async googleAuth(@Req() req: Request) {
    // Initiates Google OAuth flow
    // Passport redirects to Google automatically
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
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
