import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { FriendService } from './friend.service';
import {
  AcceptFriendRequestDto,
  GetFriendsDto,
  SendFriendRequestDto,
  GetFriendRequestsDto,
  RejectFriendRequestDto,
  RemoveFriendDto,
  SearchFriendsDto,
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

  @Get('/requests/sent')
  getSentFriendRequests(@GetCurrentUser('id') id: string) {
    const getFriendRequestsDto: GetFriendRequestsDto = {
      user_id: id,
    };
    return this.friendService.getSentFriendRequests(getFriendRequestsDto);
  }

  @Post('/requests/send')
  sendFriendRequest(
    @GetCurrentUser('id') id: string,
    @Body() sendFriendRequestDto: SendFriendRequestDto,
  ) {
    sendFriendRequestDto.requested_user_id = id;
    return this.friendService.sendFriendRequest(sendFriendRequestDto);
  }

  @Post('/requests/accept')
  acceptFriendRequest(
    @GetCurrentUser('id') id: string,
    @Body() acceptFriendRequestDto: AcceptFriendRequestDto,
  ) {
    acceptFriendRequestDto.accepted_user_id = id;

    return this.friendService.acceptFriendRequest(acceptFriendRequestDto);
  }

  @Post('/requests/reject')
  rejectFriendRequest(
    @GetCurrentUser('id') id: string,
    @Body() rejectFriendRequestDto: RejectFriendRequestDto,
  ) {
    rejectFriendRequestDto.accepted_user_id = id;

    return this.friendService.rejectFriendRequest(rejectFriendRequestDto);
  }

  @Get('/search')
  searchFriends(
    @GetCurrentUser('id') id: string,
    @Query('query') query: string,
  ) {
    const searchFriendsDto: SearchFriendsDto = {
      user_id: id,
      query,
    };
    return this.friendService.searchFriends(searchFriendsDto);
  }

  @Post('/remove')
  removeFriend(
    @GetCurrentUser('id') id: string,
    @Body() removeFriendDto: RemoveFriendDto,
  ) {
    removeFriendDto.user_id = id;
    return this.friendService.removeFriend(removeFriendDto);
  }
}
