import { Global, Module } from '@nestjs/common';
import { PrismaService, RedisService } from './service';

@Global()
@Module({
  providers: [PrismaService, RedisService],
  exports: [PrismaService, RedisService],
})
export class CommonModule {}
