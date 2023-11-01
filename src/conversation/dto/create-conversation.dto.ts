import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  sender_id: string;

  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  receiver_id: string;
}
