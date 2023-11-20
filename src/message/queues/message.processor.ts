import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmitEvent } from 'src/chat/chat.enum';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChatService } from 'src/chat/chat.service';
import { PrismaService } from 'src/common/service';
import { RedisNameSpace } from 'src/enum';

@Processor('message:send', {
  concurrency: 2,
})
export class MessageSendProcessor extends WorkerHost {
  private logger = new Logger();

  constructor(
    private prismaService: PrismaService,
    private chatGateway: ChatGateway,
    private chatService: ChatService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>, token?: string): Promise<any> {
    const { data } = job;
    const { conversation_id, sender_id, message } = data;

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

  @OnWorkerEvent('progress')
  onQueueProgress(job: Job) {
    this.logger.log(`Job is in progress: ${job.id}`);
  }

  @OnWorkerEvent('active')
  onQueueActive(job: Job) {
    this.logger.log(`Job has been started: ${job.id}`);
  }

  @OnWorkerEvent('completed')
  async onQueueComplete(job: Job, result: any) {
    this.logger.log(`Job has been finished: ${job.id}`);
    const userSocketId = await this.chatService.getSocketIdFromRedis(
      RedisNameSpace.Online,
      result.savedMessage.sender_id,
    );
    this.chatGateway.server
      .to(userSocketId)
      .emit(EmitEvent.MessageSent, result);
  }

  @OnWorkerEvent('failed')
  onQueueFailed(job: Job, err: any) {
    this.logger.log(`Job has been failed: ${job.id}`);
    this.logger.log({ err });
  }

  @OnWorkerEvent('error')
  onQueueError(err: any) {
    this.logger.log(`Job has got error: `);
    this.logger.log({ err });
  }

  async delay(job: unknown) {
    return await new Promise((resolve) =>
      setTimeout(() => resolve(job), 10000),
    );
  }
}