import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { AppEnv } from 'src/enum';

class CorsOptions {
  @IsArray()
  @ArrayMinSize(1)
  @Transform(({ value }) => value.map((v: string) => new RegExp(v)), {
    toClassOnly: true,
  })
  public readonly origins!: string[];
}

class JwtOptions {
  @IsString()
  @IsNotEmpty()
  public readonly expiresIn!: number | string;

  @IsString()
  @IsNotEmpty()
  public readonly secret!: string;

  @IsString()
  @IsNotEmpty()
  public readonly refreshExpiresIn!: number | string;

  @IsString()
  @IsNotEmpty()
  public readonly refreshSecret!: string;
}

export class AppConfig {
  @IsIn(Object.values(AppEnv))
  public readonly env!: AppEnv;

  @IsBoolean()
  readonly debug!: boolean;

  @IsNumber()
  @Min(10)
  @Max(65535)
  public readonly port!: number;

  @Type(() => CorsOptions)
  @ValidateNested()
  public readonly cors!: CorsOptions;

  @Type(() => JwtOptions)
  @ValidateNested()
  public readonly jwt!: JwtOptions;
}
