import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  receiverId: string;
}
