import { IsString, IsUUID, IsIn } from "class-validator";

export class RolloverApiKeyDto {
  @IsUUID()
  expired_key_id: string;

  @IsString()
  @IsIn(["1H", "1D", "1M", "1Y"])
  expiry: string;
}
