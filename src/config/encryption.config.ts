import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class EncryptionConfig {
  @IsString()
  @IsNotEmpty()
  public readonly prime!: string;

  @IsString()
  @IsNotEmpty()
  public readonly generator!: string;

  @IsString()
  @IsNotEmpty()
  public readonly master_key_salt!: string;
}
