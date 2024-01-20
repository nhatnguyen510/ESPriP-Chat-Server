import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateKeysDto {
  @IsString()
  @IsNotEmpty()
  public_key: string;

  @IsString()
  @IsNotEmpty()
  encrypted_private_key: string;

  @IsString()
  @IsNotEmpty()
  iv: string;
}
