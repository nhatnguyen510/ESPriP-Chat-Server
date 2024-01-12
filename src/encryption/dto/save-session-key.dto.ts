import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class SaveSessionKeyDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  conversation_id: string;

  @IsString()
  @IsNotEmpty()
  encrypted_key: string;

  @IsString()
  @IsNotEmpty()
  iv: string;
}
