import { Injectable } from '@nestjs/common';
import { CreateMessageDto, GetMessagesDto, SeenMessageDto } from './dto';
import { PrismaService } from 'src/common/service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MessageService {
  constructor(
    private prismaService: PrismaService,
    @InjectQueue('message:send')
    private readonly send_message_queue: Queue,
  ) {}

  async createMessage(createMessageDto: CreateMessageDto) {
    const { conversation_id, sender_id, message, iv } = createMessageDto;

    const job = await this.send_message_queue.add('send-message', {
      conversation_id,
      sender_id,
      message,
      iv,
    });

    return {
      message: 'Message sent',
      job_id: job.id,
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
    return await this.prismaService.message
      .findMany({
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
        orderBy: {
          created_at: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit as number,
      })
      .then((messages) => messages.reverse());
  }
}
