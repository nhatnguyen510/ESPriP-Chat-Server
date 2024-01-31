import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class UpdateSessionKeyDto {
  @IsMongoId()
  @IsNotEmpty()
  encryption_id: string;

  @IsString()
  @IsNotEmpty()
  encrypted_key: string;

  @IsString()
  @IsNotEmpty()
  iv: string;
}
