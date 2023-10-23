import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto, GetMessagesDto, SeenMessageDto } from './dto';
import { MessageGuard } from './guard/message.guard';
import { GetCurrentUser } from 'src/auth/decorator';

@UseGuards(MessageGuard)
@Controller()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  create(
    @GetCurrentUser('id') id: string,
    @Param('id') conversationId: string,
    @Body() message: string,
  ) {
    const createMessageDto: CreateMessageDto = {
      sender_id: id,
      conversation_id: conversationId,
      message,
    };
    return this.messageService.createMessage(createMessageDto);
  }

  @Get()
  getMessages(
    @GetCurrentUser('id') id: string,
    @Param('id') conversationId: string,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    const getMessagesDto: GetMessagesDto = {
      user_id: id,
      conversation_id: conversationId,
      page,
      limit,
    };
    return this.messageService.getMessages(getMessagesDto);
  }

  @Patch('/seen')
  seen(@GetCurrentUser('id') id: string, @Param('id') conversationId: string) {
    const seenMessageDto: SeenMessageDto = {
      user_id: id,
      conversation_id: conversationId,
    };
    return this.messageService.seenMessage(seenMessageDto);
  }
}
