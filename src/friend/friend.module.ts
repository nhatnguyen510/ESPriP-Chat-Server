import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { UserModule } from 'src/user/user.module';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [UserModule, ChatModule],
  controllers: [FriendController],
  providers: [FriendService],
})
export class FriendModule {}
