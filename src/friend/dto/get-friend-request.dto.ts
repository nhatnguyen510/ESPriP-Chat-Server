import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class GetFriendRequestsDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  user_id: string;
}
