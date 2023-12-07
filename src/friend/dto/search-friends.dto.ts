import { IsNotEmpty, IsString } from 'class-validator';

export class SearchFriendsDto {
  user_id?: string;

  @IsString()
  @IsNotEmpty()
  query: string;
}
