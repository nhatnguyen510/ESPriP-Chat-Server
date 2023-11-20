import { Injectable } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CustomSocket } from './chat.type';
import { ChatService } from './chat.service';

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

  @SubscribeMessage('events')
  sendData(@MessageBody() message: any) {
    console.log('message in gateway: ', message);
    this.server.emit('EmitData', message);
  }

  @SubscribeMessage('identity')
  async identity(@MessageBody() data: number): Promise<number> {
    return data;
  }
}
