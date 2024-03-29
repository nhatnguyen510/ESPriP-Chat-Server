import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/global.module';
import { ConfigModule } from './config/config.module';
import { UserModule } from './user/user.module';
import { ConversationModule } from './conversation/conversation.module';
import { MessageModule } from './message/message.module';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { FriendModule } from './friend/friend.module';
import { routes } from './routes';
import { BullModule } from '@nestjs/bullmq';
import { AppConfig, RedisConfig } from './config';
import { ChatModule } from './chat/chat.module';
import { EncryptionModule } from './encryption/encryption.module';
import { MailModule } from './mail/mail.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    CommonModule,
    UserModule,
    ConversationModule,
    MessageModule,
    FriendModule,
    ChatModule,
    EncryptionModule,
    RouterModule.register(routes),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [RedisConfig],
      useFactory: (redisConfig: RedisConfig) => ({
        connection: {
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password,
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [AppConfig],
      useFactory: (appConfig: AppConfig) => {
        console.log(appConfig.throttle.limit, appConfig.throttle.ttl);

        return {
          throttlers: [
            {
              ttl: appConfig.throttle.ttl,
              limit: appConfig.throttle.limit,
            },
          ],
        };
      },
    }),
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
