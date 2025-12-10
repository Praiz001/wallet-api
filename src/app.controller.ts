import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AppDocs } from "./app.swagger";

@ApiTags("Health")
@Controller()
export class AppController {
  @Get()
  @AppDocs.welcome()
  getWelcome() {
    return {
      message: "Welcome to Wallet API",
      docs: "Please check /docs for API documentation",
      version: "1.0.0",
    };
  }

  @Get("health")
  @AppDocs.health()
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "Wallet Service API",
    };
  }
}
