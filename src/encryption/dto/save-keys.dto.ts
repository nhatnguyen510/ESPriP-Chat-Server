import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class SaveKeysDto {
  @IsString()
  @IsNotEmpty()
  encrypted_private_key: string;

  @IsString()
  @IsNotEmpty()
  public_key: string;

  @IsString()
  @IsNotEmpty()
  iv: string;
}
