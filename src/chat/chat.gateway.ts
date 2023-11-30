import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { CustomSocket } from './chat.type';
import { ChatService } from './chat.service';
import { ListenEvent } from './chat.enum';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: CustomSocket): Promise<void> {
    console.log('client: ', client['user']);
    console.log('connected: ', client.id);
    await this.chatService.connect(this.server, client);
  }
  async handleDisconnect(client: CustomSocket): Promise<void> {
    console.log('disconnected: ', client['user']);
    console.log('disconnected: ', client.id);
    await this.chatService.disconnect(this.server, client);
  }

  @SubscribeMessage(ListenEvent.MarkMessageAsSeen)
  async messageSeen(
    @MessageBody() data: any,
    @ConnectedSocket() client: CustomSocket,
  ): Promise<void> {
    await this.chatService.markMessageAsSeen(this.server, client, data);
  }

  @SubscribeMessage('identity')
  async identity(@MessageBody() data: number): Promise<number> {
    return data;
  }
}
