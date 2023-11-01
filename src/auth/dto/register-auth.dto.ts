import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username!: string;

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
  password!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  first_name!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  last_name!: string;
}
