import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/service';
import { CreateConversationDto } from './dto';

@Injectable()
export class ConversationService {
  constructor(private prismaService: PrismaService) {}

  async createConversation(createConversationDto: CreateConversationDto) {
    // check if sender and receiver are existed in the database
    const sender = await this.prismaService.user.findUnique({
      where: {
        id: createConversationDto.senderId,
      },
    });

    if (!sender) {
      throw new BadRequestException('Sender not found');
    }

    const receiver = await this.prismaService.user.findUnique({
      where: {
        id: createConversationDto.receiverId,
      },
    });

    if (!receiver) {
      throw new BadRequestException('Receiver not found');
    }

    // check if conversation already exists
    const conversation = await this.prismaService.conversation.findFirst({
      where: {
        participants: {
          every: {
            id: {
              in: [
                createConversationDto.senderId,
                createConversationDto.receiverId,
              ],
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
          connect: [
            { id: createConversationDto.senderId },
            { id: createConversationDto.receiverId },
          ],
        },
      },
    });
  }

  async getConversationById(id: string) {
    return this.prismaService.conversation.findUnique({
      where: {
        id,
      },
    });
  }

  async getAllConversationByUserId(userId: string) {
    return this.prismaService.conversation.findMany({
      where: {
        participants: {
          some: {
            id: userId,
          },
        },
      },
    });
  }
}
