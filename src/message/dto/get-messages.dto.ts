import { IsNotEmpty, IsString } from 'class-validator';

export class GetMessagesDto {
  @IsString()
  @IsNotEmpty()
  conversation_id: string;

  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsNotEmpty()
  page: number;

  @IsNotEmpty()
  limit: number;
}
