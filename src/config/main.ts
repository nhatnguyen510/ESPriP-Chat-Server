import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { AppConfig, MailConfig, RedisConfig } from '.';

export class RootConfig {
  @Type(() => AppConfig)
  @ValidateNested()
  public readonly app!: AppConfig;

  @Type(() => RedisConfig)
  @ValidateNested()
  public readonly redis!: RedisConfig;

  @Type(() => MailConfig)
  @ValidateNested()
  public readonly mail!: MailConfig;
}
