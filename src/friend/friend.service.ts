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
        acceptedUserId: user_id,
        status: 'Pending',
      },
      select: {
        requestedUser: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
          },
        },
        acceptedUser: {
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

    const requestedUser = this.userService.findOne(requested_user_id);
    const acceptedUser = this.userService.findOne(accepted_user_id);

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
            requestedUser: {
              id: requested_user_id,
            },
            acceptedUser: {
              id: accepted_user_id,
            },
          },
          {
            requestedUser: {
              id: accepted_user_id,
            },
            acceptedUser: {
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
        requestedUser: {
          connect: {
            id: requested_user_id,
          },
        },
        acceptedUser: {
          connect: {
            id: accepted_user_id,
          },
        },
        requestedUserPublicKey: requested_user_public_key,
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

    const requestedUser = this.userService.findOne(requested_user_id);
    const acceptedUser = this.userService.findOne(accepted_user_id);

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
            requestedUser: {
              id: requested_user_id,
            },
            acceptedUser: {
              id: accepted_user_id,
            },
          },
          {
            requestedUser: {
              id: accepted_user_id,
            },
            acceptedUser: {
              id: requested_user_id,
            },
          },
        ],
      },
    });

    if (existedFriendRequest.status === 'Accepted') {
      throw new BadRequestException('Friend request already accepted');
    }

    if (
      existedFriendRequest.requestedUserId == accepted_user_id &&
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
        acceptedUserPublicKey: accepted_user_public_key,
      },
    });

    // create a new Conversation
    await this.prismaService.conversation.create({
      data: {
        participants: {
          connect: [
            {
              id: updatedFriendRequest.requestedUserId,
            },
            {
              id: updatedFriendRequest.acceptedUserId,
            },
          ],
        },
      },
    });

    return updatedFriendRequest;
  }

  getFriends(getFriendsDto: GetFriendsDto) {
    const { user_id } = getFriendsDto;
    return this.prismaService.friend.findMany({
      where: {
        OR: [
          {
            requestedUserId: user_id,
            status: 'Accepted',
          },
          {
            acceptedUserId: user_id,
            status: 'Accepted',
          },
        ],
      },
      select: {
        requestedUser: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
          },
        },
        acceptedUser: {
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
}
