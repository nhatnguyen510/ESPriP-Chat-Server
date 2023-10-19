import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from '.';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
