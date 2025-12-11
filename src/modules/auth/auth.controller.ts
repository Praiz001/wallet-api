import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { User } from "./entities/auth.entity";
import { ApiAuthDocs } from "./docs/auth.swagger";
import { ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";

interface AuthenticatedRequest extends Request {
  user: User;
}
@Controller("auth")
@ApiTags("Authentication")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get("google")
  // @UseGuards(AuthGuard("google"))
  @ApiAuthDocs.googleAuth()
  googleAuth() {
    const clientId = this.configService.get<string>("GOOGLE_CLIENT_ID");
    if (!clientId) {
      throw new Error("GOOGLE_CLIENT_ID is not configured");
    }
    const callbackUrl =
      this.configService.get<string>("GOOGLE_CALLBACK_URL") ||
      "http://localhost:3000/auth/google/callback";

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=email profile&access_type=offline`;

    return {
      url: googleAuthUrl,
      message: "Visit this URL in your browser to authenticate with Google",
    };
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
