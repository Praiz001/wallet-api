import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { ApiKeysModule } from "./modules/api-keys/api-keys.module";
import { WalletModule } from "./modules/wallet/wallet.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbHost = configService.get<string>("DB_HOST") ?? "localhost";
        const dbPort = configService.get<number>("DB_PORT") ?? 5432;
        const dbUsername = configService.getOrThrow<string>("DB_USERNAME");
        const dbPassword = configService.getOrThrow<string>("DB_PASSWORD");
        const dbName = configService.getOrThrow<string>("DB_NAME");
        const nodeEnv = configService.get<string>("NODE_ENV") ?? "development";

        return {
          type: "postgres" as const,
          host: dbHost,
          port: dbPort,
          username: dbUsername,
          password: dbPassword,
          database: dbName,
          autoLoadEntities: true,
          synchronize: nodeEnv !== "production",
          logging: nodeEnv === "development",
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    ApiKeysModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
