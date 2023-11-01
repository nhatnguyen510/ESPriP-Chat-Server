import { Injectable } from '@nestjs/common';
import { CreateMessageDto, GetMessagesDto, SeenMessageDto } from './dto';
import { PrismaService } from 'src/common/service';

@Injectable()
export class MessageService {
  constructor(private prismaService: PrismaService) {}

  async createMessage(createMessageDto: CreateMessageDto) {
    const { conversation_id, sender_id, message } = createMessageDto;
    const createdMessage = await this.prismaService.message.create({
      data: {
        conversation: {
          connect: {
            id: conversation_id,
          },
        },
        sender: {
          connect: {
            id: sender_id,
          },
        },
        message,
      },
    });

    // update conversation last message
    const updatedConversation = await this.prismaService.conversation.update({
      where: {
        id: createdMessage.conversation_id,
      },
      data: {
        last_message_id: createdMessage.id,
        last_message_at: createdMessage.created_at,
      },
    });

    return {
      savedMessage: createdMessage,
      updatedConversation: {
        ...updatedConversation,
        last_message: createdMessage,
      },
    };
  }

  async seenMessage(seenMessageDto: SeenMessageDto) {
    const { conversation_id } = seenMessageDto;
    return await this.prismaService.message.updateMany({
      where: {
        conversation_id,
        sender_id: {
          not: seenMessageDto.user_id,
        },
      },
      data: {
        seen: true,
      },
    });
  }

  async getMessages(getMessagesDto: GetMessagesDto) {
    const { conversation_id, limit, page } = getMessagesDto;
    return await this.prismaService.message.findMany({
      where: {
        conversation_id,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      take: limit as number,
      skip: (page - 1) * limit,
    });
  }
}
