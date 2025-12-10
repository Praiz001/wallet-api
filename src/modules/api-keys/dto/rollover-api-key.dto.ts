import { IsString, IsIn, IsNotEmpty } from "class-validator";

export class RolloverApiKeyDto {
  @IsString()
  @IsNotEmpty()
  expired_key: string;

  @IsString()
  @IsIn(["1H", "1D", "1M", "1Y"])
  expiry: string;
}
