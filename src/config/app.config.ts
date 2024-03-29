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
import { EncryptionConfig } from './';

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

class ThrottleOptions {
  @IsNumber()
  @Min(0)
  public readonly limit!: number;

  @IsNumber()
  @Min(0)
  public readonly ttl!: number;
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

  @Type(() => ThrottleOptions)
  @ValidateNested()
  public readonly throttle!: ThrottleOptions;

  @Type(() => EncryptionConfig)
  @ValidateNested()
  public readonly encryption!: EncryptionConfig;

  @IsString()
  @IsNotEmpty()
  public readonly clientUrl!: string;
}
