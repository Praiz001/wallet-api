import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { ApiKeysService } from "./api-keys.service";
import { CreateApiKeyDto } from "./dto/create-api-key.dto";
import { RolloverApiKeyDto } from "./dto/rollover-api-key.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../auth/entities/auth.entity";
import { ApiTags } from "@nestjs/swagger";
import { ApiKeysDocs } from "./docs/auth-key.swagger";

@ApiTags("API Keys")
@Controller("keys")
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post("create")
  @UseGuards(JwtAuthGuard)
  @ApiKeysDocs.create()
  async create(
    @CurrentUser() user: User,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.createApiKey(user.id, createApiKeyDto);
  }

  @Post("rollover")
  @UseGuards(JwtAuthGuard)
  @ApiKeysDocs.rollover()
  async rollover(
    @CurrentUser() user: User,
    @Body() rolloverApiKeyDto: RolloverApiKeyDto,
  ) {
    return this.apiKeysService.rolloverKey(user.id, rolloverApiKeyDto);
  }

  @Post("revoke")
  @UseGuards(JwtAuthGuard)
  @ApiKeysDocs.revoke()
  async revoke(@CurrentUser() user: User, @Body() body: { api_key: string }) {
    return this.apiKeysService.revokeKey(user.id, body.api_key);
  }
}
