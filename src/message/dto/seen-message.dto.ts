import { IsNotEmpty, IsString } from 'class-validator';

export class SeenMessageDto {
  @IsString()
  @IsNotEmpty()
  conversation_id: string;

  @IsString()
  @IsNotEmpty()
  user_id: string;
}
