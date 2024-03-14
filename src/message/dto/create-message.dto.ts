import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMessageDto {
  conversation_id?: string;

  sender_id?: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsNotEmpty()
  iv!: string;
}
