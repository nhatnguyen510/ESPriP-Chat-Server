import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class RemoveFriendDto {
  user_id?: string;

  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  friend_id: string;
}
