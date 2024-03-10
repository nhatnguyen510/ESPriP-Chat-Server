import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class MailConfig {
  @IsString()
  @IsNotEmpty()
  public readonly service!: string;

  @IsString()
  @IsNotEmpty()
  public readonly host!: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(65535)
  public readonly port!: number;

  @IsBoolean()
  @IsNotEmpty()
  public readonly secure!: boolean;

  @IsString()
  @IsNotEmpty()
  public readonly user!: string;

  @IsString()
  @IsNotEmpty()
  public readonly pass!: string;

  @IsString()
  @IsNotEmpty()
  public readonly from!: string;
}
