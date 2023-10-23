import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class SendFriendRequestDto {
  requested_user_id?: string;

  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  accepted_user_id: string;

  @IsString()
  @IsNotEmpty()
  requested_user_public_key: string;
}
