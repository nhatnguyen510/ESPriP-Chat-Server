import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisConfig } from 'src/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly _client: Redis;
  private logger = new Logger();

  constructor(private readonly config: RedisConfig) {
    this._client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
    });

    this._client.on('error', (err) => {
      this.logger.error(err);

      this._client.quit();
    });
  }

  async onModuleDestroy() {
    await this._client.quit();
  }

  public get client() {
    return this._client;
  }
}
