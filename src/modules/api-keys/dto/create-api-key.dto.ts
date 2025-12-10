import { IsString, IsArray, IsIn, ArrayMinSize } from "class-validator";

export class CreateApiKeyDto {
  @IsString()
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(["deposit", "transfer", "read"], { each: true })
  permissions: string[];

  @IsString()
  @IsIn(["1H", "1D", "1M", "1Y"])
  expiry: string;
}
