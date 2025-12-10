import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { ApiKeysService } from "./api-keys.service";
import { CreateApiKeyDto } from "./dto/create-api-key.dto";
import { RolloverApiKeyDto } from "./dto/rollover-api-key.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../auth/entities/auth.entity";

@Controller("keys")
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post("create")
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: User,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.createApiKey(user.id, createApiKeyDto);
  }

  @Post("rollover")
  @UseGuards(JwtAuthGuard)
  async rollover(
    @CurrentUser() user: User,
    @Body() rolloverApiKeyDto: RolloverApiKeyDto,
  ) {
    return this.apiKeysService.rolloverKey(user.id, rolloverApiKeyDto);
  }
}
