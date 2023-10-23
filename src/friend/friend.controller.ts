import { Controller, Get, Post, Body } from '@nestjs/common';
import { FriendService } from './friend.service';
import {
  AcceptFriendRequestDto,
  GetFriendsDto,
  SendFriendRequestDto,
  GetFriendRequestsDto,
} from './dto';
import { GetCurrentUser } from 'src/auth/decorator';

@Controller()
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get()
  getFriends(@GetCurrentUser('id') id: string) {
    const getFriendsDto: GetFriendsDto = {
      user_id: id,
    };
    return this.friendService.getFriends(getFriendsDto);
  }

  @Get('/requests')
  getFriendRequests(@GetCurrentUser('id') id: string) {
    const getFriendRequestsDto: GetFriendRequestsDto = {
      user_id: id,
    };
    return this.friendService.getFriendRequests(getFriendRequestsDto);
  }

  @Post('/send-request')
  sendFriendRequest(
    @GetCurrentUser('id') id: string,
    @Body() sendFriendRequestDto: SendFriendRequestDto,
  ) {
    sendFriendRequestDto.requested_user_id = id;
    return this.friendService.sendFriendRequest(sendFriendRequestDto);
  }

  @Post('/accept-request')
  acceptFriendRequest(
    @GetCurrentUser('id') id: string,
    @Body() acceptFriendRequestDto: AcceptFriendRequestDto,
  ) {
    acceptFriendRequestDto.accepted_user_id = id;
    return this.friendService.acceptFriendRequest(acceptFriendRequestDto);
  }
}
