import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class RejectFriendRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  requested_user_id: string;

  accepted_user_id?: string;
}
