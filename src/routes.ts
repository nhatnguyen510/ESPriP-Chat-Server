import { Routes } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConversationModule } from './conversation/conversation.module';
import { MessageModule } from './message/message.module';
import { FriendModule } from './friend/friend.module';
import { EncryptionModule } from './encryption/encryption.module';

export const routes: Routes = [
  {
    path: '/',
    module: AppModule,
  },
  {
    path: '/auth',
    module: AuthModule,
  },
  {
    path: '/user',
    module: UserModule,
  },
  {
    path: '/conversation',
    module: ConversationModule,
    children: [
      {
        path: '/:id/message',
        module: MessageModule,
      },
    ],
  },
  {
    path: '/friends',
    module: FriendModule,
  },
  {
    path: '/encryption',
    module: EncryptionModule,
  },
];
