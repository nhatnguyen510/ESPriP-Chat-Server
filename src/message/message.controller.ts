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
import { JwtAuthGuard } from 'src/auth/guard';
import { User } from '@prisma/client';
import { MessageGuard } from './guard/message.guard';

@UseGuards(JwtAuthGuard, MessageGuard)
@Controller()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  create(
    @Request() req: { user: User },
    @Param('id') conversationId: string,
    @Body() message: string,
  ) {
    const createMessageDto: CreateMessageDto = {
      sender_id: req.user.id,
      conversation_id: conversationId,
      message,
    };
    return this.messageService.createMessage(createMessageDto);
  }

  @Get()
  getMessages(
    @Request() req: { user: User },
    @Param('id') conversationId: string,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    const getMessagesDto: GetMessagesDto = {
      user_id: req.user.id,
      conversation_id: conversationId,
      page,
      limit,
    };
    return this.messageService.getMessages(getMessagesDto);
  }

  @Patch('/seen')
  seen(@Request() req: { user: User }, @Param('id') conversationId: string) {
    const seenMessageDto: SeenMessageDto = {
      user_id: req.user.id,
      conversation_id: conversationId,
    };
    return this.messageService.seenMessage(seenMessageDto);
  }
}
