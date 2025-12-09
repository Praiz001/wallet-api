import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, StrategyOptions, Profile } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";
import { User } from "../entities/auth.entity";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>("GOOGLE_CLIENT_ID"),
      clientSecret: configService.get<string>("GOOGLE_CLIENT_SECRET"),
      callbackURL: configService.get<string>("GOOGLE_CALLBACK_URL"),
      scope: ["email", "profile"],
    } as StrategyOptions);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    const { id, emails, displayName } = profile;
    if (!emails || emails.length === 0 || !emails[0]?.value) {
      throw new Error("Email is required but not provided by Google");
    }

    const user = await this.authService.findOrCreateUser({
      google_id: id,
      email: emails[0]?.value,
      name: displayName,
    });

    return user;
  }
}
