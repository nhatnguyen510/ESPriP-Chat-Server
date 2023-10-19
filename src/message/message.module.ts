import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { AuthModule } from 'src/auth/auth.module';
import { ConversationModule } from 'src/conversation/conversation.module';
import { MessageGuard } from './guard/message.guard';

@Module({
  imports: [AuthModule, ConversationModule],
  controllers: [MessageController],
  providers: [MessageService, MessageGuard],
})
export class MessageModule {}
