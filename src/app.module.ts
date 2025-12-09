import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>("REDIS_HOST", "localhost"),
          port: configService.get<number>("REDIS_PORT", 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: "document-analysis",
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
  ],
})
export class AppModule {}
