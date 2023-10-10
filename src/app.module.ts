import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypedConfigModule } from 'nest-typed-config';
import { RootConfig } from './config';
import { loadConfig } from './utils/load-config';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/global.module';

@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: RootConfig,
      load: loadConfig,
    }),
    AuthModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
