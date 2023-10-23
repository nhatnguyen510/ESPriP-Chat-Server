import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class GetFriendsDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  user_id: string;
}
