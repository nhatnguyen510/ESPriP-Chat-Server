import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/service';
import { UserService } from 'src/user/user.service';
import {
  AcceptFriendRequestDto,
  GetFriendsDto,
  GetFriendRequestsDto,
  SendFriendRequestDto,
  RejectFriendRequestDto,
  RemoveFriendDto,
  SearchFriendsDto,
} from './dto';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChatService } from 'src/chat/chat.service';
import { RedisNameSpace } from 'src/enum';
import { EmitEvent } from 'src/chat/chat.enum';

@Injectable()
export class FriendService {
  constructor(
    private prismaService: PrismaService,
    private userService: UserService,
    private chatGateway: ChatGateway,
    private chatService: ChatService,
  ) {}
  getFriendRequests(getFriendRequestDto: GetFriendRequestsDto) {
    const { user_id } = getFriendRequestDto;
    return this.prismaService.friend.findMany({
      where: {
        accepted_user_id: user_id,
        status: 'Pending',
      },
      include: {
        requested_user: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
          },
        },
        accepted_user: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  async getSentFriendRequests(getFriendRequestDto: GetFriendRequestsDto) {
    const { user_id } = getFriendRequestDto;
    return this.prismaService.friend
      .findMany({
        where: {
          requested_user_id: user_id,
          status: 'Pending',
        },
        include: {
          requested_user: {
            where: {
              id: {
                not: user_id,
              },
            },
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
              avatar_url: true,
            },
          },
          accepted_user: {
            where: {
              id: {
                not: user_id,
              },
            },
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
              avatar_url: true,
            },
          },
        },
      })
      .then((friendRequests) => {
        return friendRequests.map((friendRequest) => {
          if (!friendRequest.accepted_user) {
            return friendRequest.requested_user;
          }
          if (!friendRequest.requested_user) {
            return friendRequest.accepted_user;
          }
        });
      });
  }

  async sendFriendRequest(sendFriendRequestDto: SendFriendRequestDto) {
    const { accepted_user_id, requested_user_id, requested_user_public_key } =
      sendFriendRequestDto;

    if (accepted_user_id === requested_user_id) {
      throw new BadRequestException(
        'You cannot send a friend request to yourself',
      );
    }

    if (!requested_user_public_key) {
      throw new BadRequestException(
        'You must provide a public key for the requested user',
      );
    }

    const requestedUser = await this.userService.findOne(requested_user_id);
    const acceptedUser = await this.userService.findOne(accepted_user_id);

    if (!requestedUser) {
      throw new BadRequestException('The requested user does not exist');
    }

    if (!acceptedUser) {
      throw new BadRequestException('The accepted user does not exist');
    }

    const existedFriendRequest = await this.prismaService.friend.findFirst({
      where: {
        OR: [
          {
            requested_user: {
              id: requested_user_id,
            },
            accepted_user: {
              id: accepted_user_id,
            },
          },
          {
            requested_user: {
              id: accepted_user_id,
            },
            accepted_user: {
              id: requested_user_id,
            },
          },
        ],
      },
    });

    if (existedFriendRequest && existedFriendRequest.status === 'Accepted') {
      throw new BadRequestException('Friend request already accepted');
    }

    if (existedFriendRequest && existedFriendRequest.status === 'Pending') {
      throw new BadRequestException('Friend request already sent');
    }

    return this.prismaService.friend.create({
      data: {
        requested_user: {
          connect: {
            id: requested_user_id,
          },
        },
        accepted_user: {
          connect: {
            id: accepted_user_id,
          },
        },
        requested_user_public_key,
        status: 'Pending',
      },
      include: {
        accepted_user: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  async acceptFriendRequest(acceptFriendRequest: AcceptFriendRequestDto) {
    const { accepted_user_id, requested_user_id, accepted_user_public_key } =
      acceptFriendRequest;

    if (accepted_user_id === requested_user_id) {
      throw new BadRequestException(
        'You cannot accept a friend request from yourself',
      );
    }

    const requestedUser = await this.userService.findOne(requested_user_id);
    const acceptedUser = await this.userService.findOne(accepted_user_id);

    if (!requestedUser) {
      throw new BadRequestException('The requested user does not exist');
    }

    if (!acceptedUser) {
      throw new BadRequestException('The accepted user does not exist');
    }

    const existedFriendRequest = await this.prismaService.friend.findFirst({
      where: {
        OR: [
          {
            requested_user_id,
            accepted_user_id,
          },
          {
            requested_user_id: accepted_user_id,
            accepted_user_id: requested_user_id,
          },
        ],
      },
    });

    if (existedFriendRequest.status === 'Accepted') {
      throw new BadRequestException('Friend request already accepted');
    }

    if (
      existedFriendRequest.requested_user_id == accepted_user_id &&
      existedFriendRequest.status === 'Pending'
    ) {
      throw new BadRequestException(
        'You cannot accept a friend request that you sent',
      );
    }

    // update the friend request to accepted
    const updatedFriendRequest = await this.prismaService.friend.update({
      where: {
        id: existedFriendRequest.id,
      },
      data: {
        status: 'Accepted',
        accepted_user_public_key,
      },
      include: {
        accepted_user: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
          },
        },
      },
    });

    // create a new Conversation
    const newConversation = await this.prismaService.conversation.create({
      data: {
        participants: {
          connect: [
            {
              id: updatedFriendRequest.requested_user_id,
            },
            {
              id: updatedFriendRequest.accepted_user_id,
            },
          ],
        },
      },
    });

    const requestedUserSocketId = await this.chatService.getSocketIdFromRedis(
      RedisNameSpace.Online,
      requested_user_id,
    );

    if (requestedUserSocketId) {
      this.chatGateway.server
        .to(requestedUserSocketId)
        .emit(EmitEvent.FriendRequestAccepted, {
          conversation: newConversation,
          friendRequest: updatedFriendRequest,
        });
    }

    return {
      message: 'Friend request accepted successfully',
      conversation: newConversation,
    };
  }

  async getFriends(getFriendsDto: GetFriendsDto) {
    const { user_id } = getFriendsDto;
    return this.prismaService.friend
      .findMany({
        where: {
          OR: [
            {
              requested_user_id: user_id,
              status: 'Accepted',
            },
            {
              accepted_user_id: user_id,
              status: 'Accepted',
            },
          ],
        },
        include: {
          requested_user: {
            where: {
              id: {
                not: user_id,
              },
            },
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
              avatar_url: true,
            },
          },
          accepted_user: {
            where: {
              id: {
                not: user_id,
              },
            },
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
              avatar_url: true,
            },
          },
        },
      })
      .then((friends) => {
        return friends.map((friend) => {
          if (!friend.accepted_user) {
            return {
              ...friend.requested_user,
              friend_public_key: friend.requested_user_public_key,
            };
          }
          if (!friend.requested_user) {
            return {
              ...friend.accepted_user,
              friend_public_key: friend.accepted_user_public_key,
            };
          }
        });
      });
  }

  async rejectFriendRequest(rejectFriendRequestDto: RejectFriendRequestDto) {
    const { accepted_user_id, requested_user_id } = rejectFriendRequestDto;

    if (accepted_user_id === requested_user_id) {
      throw new BadRequestException(
        'You cannot reject a friend request from yourself',
      );
    }

    const requestedUser = await this.userService.findOne(requested_user_id);
    const acceptedUser = await this.userService.findOne(accepted_user_id);

    if (!requestedUser) {
      throw new BadRequestException('The requested user does not exist');
    }

    if (!acceptedUser) {
      throw new BadRequestException('The accepted user does not exist');
    }

    const existedFriendRequest = await this.prismaService.friend.findFirst({
      where: {
        OR: [
          {
            requested_user_id,
            accepted_user_id,
          },
          {
            requested_user_id: accepted_user_id,
            accepted_user_id: requested_user_id,
          },
        ],
        status: 'Pending',
      },
    });

    if (existedFriendRequest.requested_user_id == accepted_user_id) {
      throw new BadRequestException(
        'You cannot reject a friend request that you sent',
      );
    }

    // update the friend request to rejected
    const updatedFriendRequest = await this.prismaService.friend.update({
      where: {
        id: existedFriendRequest.id,
      },
      data: {
        status: 'Rejected',
      },
    });

    return updatedFriendRequest;
  }

  async removeFriend(removeFriendDto: RemoveFriendDto) {
    const { user_id, friend_id } = removeFriendDto;

    if (user_id === friend_id) {
      throw new BadRequestException('You cannot remove yourself');
    }

    const friend = await this.prismaService.friend.findFirst({
      where: {
        OR: [
          {
            requested_user_id: user_id,
            accepted_user_id: friend_id,
          },
          {
            requested_user_id: friend_id,
            accepted_user_id: user_id,
          },
        ],
      },
    });

    if (!friend) {
      throw new BadRequestException('Friend does not exist');
    }

    if (friend.status === 'Pending') {
      throw new BadRequestException('Friend request not accepted yet');
    }

    const conversation = await this.prismaService.conversation.findFirst({
      where: {
        participants: {
          every: {
            id: {
              in: [user_id, friend_id],
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new BadRequestException('Conversation does not exist');
    }

    // remove the conversation between the two users
    const deleteConversation = this.prismaService.conversation.delete({
      where: {
        id: conversation.id,
      },
    });

    // remove the friend
    const deleteFriend = this.prismaService.friend.delete({
      where: {
        id: friend.id,
      },
    });

    await this.prismaService.$transaction([deleteConversation, deleteFriend]);

    return {
      message: 'Friend removed successfully',
      conversation_id: conversation.id,
    };
  }

  async searchFriends(searchFriendsDto: SearchFriendsDto) {
    const { user_id, query } = searchFriendsDto;

    const friendList = await this.getFriends({
      user_id,
    });

    // find friends in the friend list that match the query
    const matchedFriends = friendList.filter((friend) => {
      return (
        friend.username.includes(query) ||
        friend.first_name.includes(query) ||
        friend.last_name.includes(query)
      );
    });

    return matchedFriends;
  }
}
