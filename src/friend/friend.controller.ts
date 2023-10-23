import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import {
  AcceptFriendRequestDto,
  GetFriendsDto,
  SendFriendRequestDto,
  GetFriendRequestsDto,
} from './dto';
import { User } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get()
  getFriends(@Request() req: { user: User }) {
    const getFriendsDto: GetFriendsDto = {
      user_id: req.user.id,
    };
    return this.friendService.getFriends(getFriendsDto);
  }

  @Get('/requests')
  getFriendRequests(@Request() req: { user: User }) {
    const getFriendRequestsDto: GetFriendRequestsDto = {
      user_id: req.user.id,
    };
    return this.friendService.getFriendRequests(getFriendRequestsDto);
  }

  @Post('/send-request')
  sendFriendRequest(
    @Request() req: { user: User },
    @Body() sendFriendRequestDto: SendFriendRequestDto,
  ) {
    sendFriendRequestDto.requested_user_id = req.user.id;
    return this.friendService.sendFriendRequest(sendFriendRequestDto);
  }

  @Post('/accept-request')
  acceptFriendRequest(
    @Request() req: { user: User },
    @Body() acceptFriendRequestDto: AcceptFriendRequestDto,
  ) {
    acceptFriendRequestDto.accepted_user_id = req.user.id;
    return this.friendService.acceptFriendRequest(acceptFriendRequestDto);
  }
}
