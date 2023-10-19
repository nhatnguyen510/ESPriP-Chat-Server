import { Injectable } from '@nestjs/common';
import { CreateMessageDto, GetMessagesDto, SeenMessageDto } from './dto';
import { PrismaService } from 'src/common/service';

@Injectable()
export class MessageService {
  constructor(private prismaService: PrismaService) {}

  async createMessage(createMessageDto: CreateMessageDto) {
    const createdMessage = await this.prismaService.message.create({
      data: {
        conversation: {
          connect: {
            id: createMessageDto.conversation_id,
          },
        },
        sender: {
          connect: {
            id: createMessageDto.sender_id,
          },
        },
        message: createMessageDto.message,
      },
    });

    // update conversation last message
    const updatedConversation = await this.prismaService.conversation.update({
      where: {
        id: createdMessage.conversationId,
      },
      data: {
        lastMessageId: createdMessage.id,
        lastMessageAt: createdMessage.createdAt,
      },
    });

    return { savedMessage: createdMessage, updatedConversation };
  }

  async seenMessage(seenMessageDto: SeenMessageDto) {
    return await this.prismaService.message.updateMany({
      where: {
        conversationId: seenMessageDto.conversation_id,
        senderId: {
          not: seenMessageDto.user_id,
        },
      },
      data: {
        seen: true,
      },
    });
  }

  async getMessages(getMessagesDto: GetMessagesDto) {
    return await this.prismaService.message.findMany({
      where: {
        conversationId: getMessagesDto.conversation_id,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: getMessagesDto.limit as number,
      skip: (getMessagesDto.page - 1) * getMessagesDto.limit,
    });
  }
}
