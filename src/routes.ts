import { Routes } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConversationModule } from './conversation/conversation.module';
import { MessageModule } from './message/message.module';

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
];
