import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto';
import { MongoIdValidationPipe } from 'src/utils/pipes';
import { MessageGuard } from 'src/message/guard/message.guard';
import { GetCurrentUser } from 'src/auth/decorator';

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
  async getAllConversationByUserId(@GetCurrentUser('id') id: string) {
    return this.conversationService.getAllConversationByUserId(id);
  }

  @Get(':id')
  @UsePipes(new MongoIdValidationPipe())
  @UseGuards(MessageGuard)
  async getConversationById(@Param('id') id: string) {
    return this.conversationService.getConversationById(id);
  }
}
