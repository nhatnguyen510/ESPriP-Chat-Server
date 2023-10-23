import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class AcceptFriendRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  requested_user_id: string;

  accepted_user_id?: string;

  @IsString()
  @IsNotEmpty()
  accepted_user_public_key: string;
}
