import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { MessageService } from './message.service';
import {
  CreateMessageDto,
  GetMessagesDto,
  SeenMessageDto,
  UpdateMessageDto,
} from './dto';
import { MessageGuard } from './guard/message.guard';
import { GetCurrentUser } from 'src/auth/decorator';

@UseGuards(MessageGuard)
@Controller()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  createMessage(
    @GetCurrentUser('id') id: string,
    @Param('id') conversationId: string,
    @Body() { message, iv }: CreateMessageDto,
  ) {
    const createMessageDto: CreateMessageDto = {
      sender_id: id,
      conversation_id: conversationId,
      message,
      iv,
    };
    return this.messageService.createMessage(createMessageDto);
  }

  @Get()
  getMessages(
    @GetCurrentUser('id') user_id: string,
    @Param('id') conversation_id: string,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    const getMessagesDto: GetMessagesDto = {
      user_id,
      conversation_id,
      page,
      limit,
    };
    return this.messageService.getMessages(getMessagesDto);
  }

  @Post('/seen')
  seen(
    @GetCurrentUser('id') user_id: string,
    @Param('id') conversation_id: string,
  ) {
    const seenMessageDto: SeenMessageDto = {
      user_id,
      conversation_id,
    };
    return this.messageService.seenMessage(seenMessageDto);
  }
}
