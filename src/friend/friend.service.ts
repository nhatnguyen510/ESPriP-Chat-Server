import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/service';
import { UserService } from 'src/user/user.service';
import {
  AcceptFriendRequestDto,
  GetFriendsDto,
  GetFriendRequestsDto,
  SendFriendRequestDto,
} from './dto';

@Injectable()
export class FriendService {
  constructor(
    private prismaService: PrismaService,
    private userService: UserService,
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
          },
        },
        accepted_user: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
          },
        },
      },
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
    });

    // create a new Conversation
    await this.prismaService.conversation.create({
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

    return updatedFriendRequest;
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
            },
          },
        },
      })
      .then((friends) => {
        return friends.map((friend) => {
          if (!friend.accepted_user) {
            return friend.requested_user;
          }
          if (!friend.requested_user) {
            return friend.accepted_user;
          }
        });
      });
  }
}
