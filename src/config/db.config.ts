import { IsNotEmpty, IsString } from 'class-validator';

export class DbConfig {
  @IsString()
  @IsNotEmpty()
  public readonly host!: string;

  @IsString()
  @IsNotEmpty()
  public readonly username!: string;

  @IsString()
  @IsNotEmpty()
  public readonly password!: string;

  @IsString()
  @IsNotEmpty()
  public readonly database!: string;
}
