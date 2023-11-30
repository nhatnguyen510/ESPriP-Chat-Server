import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { Server } from 'socket.io';
import { PrismaService, RedisService } from 'src/common/service';
import { CustomSocket, OnlineFriends, SocketId, UserId } from './chat.type';
import { EmitEvent, Status } from './chat.enum';
import { RedisNameSpace } from 'src/enum';

@Injectable()
export class ChatService {
  private readonly _redis: Redis;

  constructor(
    redisService: RedisService,
    private readonly prismaService: PrismaService,
  ) {
    this._redis = redisService.client;
  }

  async connect(server: Server, client: CustomSocket): Promise<void> {
    const userId: UserId = client.user.id;

    const socketId: SocketId = client.id;

    await this.setSocketIdToRedis(RedisNameSpace.Online, userId, socketId);

    const friendIds = await this.getUserFriendIds(userId);

    const onlineFriends = await this.getOnlineFriends(friendIds);

    const friendSocketIds = this.getFriendsSocketIds(onlineFriends);

    const onlineFriendsIds = this.getOnlineFriendsIds(onlineFriends);

    console.log('onlineFriends: ', onlineFriends);
    console.log('onlineFriendsIds: ', onlineFriendsIds);
    console.log('friendSocketIds: ', friendSocketIds);

    server.to(socketId).emit(EmitEvent.OnlineFriends, onlineFriendsIds);

    server.to(friendSocketIds).emit(EmitEvent.UserOnline, {
      userId,
      status: Status.Online,
    });
  }

  async disconnect(server: Server, client: CustomSocket) {
    const userId: UserId = client.user.id;

    await this.deleteSocketIdFromRedis(RedisNameSpace.Online, userId);

    const friendIds = await this.getUserFriendIds(userId);

    const onlineFriends = await this.getOnlineFriends(friendIds);

    const friendSocketIds = this.getFriendsSocketIds(onlineFriends);

    server.to(friendSocketIds).emit(EmitEvent.UserOffline, {
      userId,
      status: Status.Offline,
    });
  }

  async markMessageAsSeen(server: Server, client: CustomSocket, data: any) {
    const userId: UserId = client.user.id;

    const { conversation_id, receiver_id, seen } = data;

    const receiverSocketId = await this.getSocketIdFromRedis(
      RedisNameSpace.Online,
      receiver_id,
    );

    if (receiverSocketId) {
      server.to(receiverSocketId).emit(EmitEvent.MessageSeen, {
        conversation_id,
        sender_id: userId,
        seen,
      });
    }
  }

  private async setSocketIdToRedis(
    redisNameSpace: RedisNameSpace,
    id: UserId,
    socketId: SocketId,
  ): Promise<'OK'> {
    return await this._redis.set(`${redisNameSpace}${id}`, socketId);
  }

  async getSocketIdFromRedis(
    redisNameSpace: RedisNameSpace,
    id: UserId,
  ): Promise<SocketId> {
    return await this._redis.get(`${redisNameSpace}${id}`);
  }

  private async deleteSocketIdFromRedis(
    redisNameSpace: RedisNameSpace,
    id: UserId,
  ) {
    return await this._redis.del(`${redisNameSpace}${id}`);
  }

  private async getUserFriendIds(userId: UserId): Promise<UserId[]> {
    return this.prismaService.friend
      .findMany({
        where: {
          OR: [
            {
              requested_user_id: userId,
              status: 'Accepted',
            },
            {
              accepted_user_id: userId,
              status: 'Accepted',
            },
          ],
        },
        include: {
          requested_user: {
            where: {
              id: {
                not: userId,
              },
            },
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
            },
          },
          accepted_user: {
            where: {
              id: {
                not: userId,
              },
            },
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      })
      .then((friends) => {
        return friends.map((friend) => {
          if (!friend.accepted_user) {
            return friend.requested_user.id;
          }
          if (!friend.requested_user) {
            return friend.accepted_user.id;
          }
        });
      });
  }

  private getFriendsSocketIds(onlineFriends: OnlineFriends) {
    return onlineFriends.map((friend) => Object.values(friend)[0]);
  }

  private getOnlineFriendsIds(onlineFriends: OnlineFriends) {
    return onlineFriends.map((friend) => Object.keys(friend)[0]);
  }

  private async getOnlineFriends(friendIds: UserId[]): Promise<OnlineFriends> {
    const onlineFriends = await Promise.all(
      friendIds.map(async (friendId) => {
        const friendSocketId = await this.getSocketIdFromRedis(
          RedisNameSpace.Online,
          friendId,
        );

        if (friendSocketId) {
          return {
            [friendId]: friendSocketId,
          };
        }
      }),
    );

    return onlineFriends.filter((friend) => friend);
  }

  private async isUserOnline(userId: UserId): Promise<number> {
    return await this._redis.exists(`${RedisNameSpace.Online}${userId}`);
  }
}
