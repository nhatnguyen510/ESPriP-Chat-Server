import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { AuthModule } from 'src/auth/auth.module';
import { ConversationModule } from 'src/conversation/conversation.module';
import { MessageGuard } from './guard/message.guard';
import { BullModule } from '@nestjs/bullmq';
import { MessageSendProcessor } from './queues/message.processor';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    AuthModule,
    ConversationModule,
    BullModule.registerQueue({
      name: 'message:send',
      prefix: 'chat',
    }),
    ChatModule,
  ],
  controllers: [MessageController],
  providers: [MessageService, MessageGuard, MessageSendProcessor],
})
export class MessageModule {}
