import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChangeUserPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  old_password!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  new_password!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  confirmed_new_password!: string;
}
