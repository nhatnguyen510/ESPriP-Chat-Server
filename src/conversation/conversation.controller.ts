import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Request,
  UsePipes,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto';
import { JwtAuthGuard } from 'src/auth/guard';
import { User } from '@prisma/client';
import { MongoIdValidationPipe } from 'src/utils/pipes';
import { MessageGuard } from 'src/message/guard/message.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class ConversationController {
  constructor(private conversationService: ConversationService) {}

  @Post()
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
  ) {
    return this.conversationService.createConversation(createConversationDto);
  }

  @Get()
  async getAllConversationByUserId(@Request() req: { user: User }) {
    return this.conversationService.getAllConversationByUserId(req.user.id);
  }

  @Get(':id')
  @UsePipes(new MongoIdValidationPipe())
  @UseGuards(MessageGuard)
  async getConversationById(@Param('id') id: string) {
    return this.conversationService.getConversationById(id);
  }
}
