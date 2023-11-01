import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/service';
import { CreateConversationDto } from './dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ConversationService {
  constructor(
    private prismaService: PrismaService,
    private userService: UserService,
  ) {}

  async createConversation(createConversationDto: CreateConversationDto) {
    const { sender_id, receiver_id } = createConversationDto;
    // check if sender and receiver are existed in the database
    const sender = await this.userService.findOne(sender_id);

    if (!sender) {
      throw new BadRequestException('Sender not found');
    }

    const receiver = await this.userService.findOne(receiver_id);

    if (!receiver) {
      throw new BadRequestException('Receiver not found');
    }

    // check if conversation already exists
    const conversation = await this.prismaService.conversation.findFirst({
      where: {
        participants: {
          every: {
            id: {
              in: [sender_id, receiver_id],
            },
          },
        },
      },
    });

    if (conversation) {
      throw new BadRequestException('Conversation already exists');
    }

    return this.prismaService.conversation.create({
      data: {
        participants: {
          connect: [{ id: sender_id }, { id: receiver_id }],
        },
      },
    });
  }

  async getConversationById(id: string) {
    const conversation = await this.prismaService.conversation.findUnique({
      where: {
        id,
      },
    });

    if (!conversation) {
      throw new BadRequestException('Conversation not found');
    }

    const lastMessage = await this.getLastMessageByConversationId(id);

    return {
      ...conversation,
      last_message: lastMessage,
    };
  }

  async getAllConversationByUserId(userId: string) {
    const conversations = await this.prismaService.conversation.findMany({
      where: {
        participants: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (!conversations) {
      throw new BadRequestException('Conversations not found');
    }

    const promises = conversations.map(async (conversation) => {
      const lastMessage = await this.getLastMessageByConversationId(
        conversation.id,
      );

      return {
        ...conversation,
        last_message: lastMessage,
      };
    });

    return Promise.all(promises);
  }

  async getLastMessageByConversationId(conversation_id: string) {
    return await this.prismaService.message.findFirst({
      where: {
        conversation_id,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }
}
