import { User } from '@prisma/client';
import { Socket } from 'socket.io';

export interface CustomSocket extends Socket {
  user: User;
}

export type SocketId = string;
export type UserId = string;
export type OnlineFriends = Record<UserId, SocketId>[];
