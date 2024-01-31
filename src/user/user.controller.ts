import { Controller, Get, Post, Body, Param, Query, Put } from '@nestjs/common';
import { ChangeUserPasswordDto, CreateUserDto, UpdateUserDto } from './dto';
import { UserService } from './user.service';
import { GetCurrentUser } from 'src/auth/decorator';
import { User } from '@prisma/client';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Get('/search')
  async findByName(@Query('query') query: string) {
    return this.userService.searchUsers(query);
  }

  @Put('/update')
  async update(
    @GetCurrentUser('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Put('/update/password')
  async changePassword(
    @GetCurrentUser() user: User,
    @Body() changeUserPasswordDto: ChangeUserPasswordDto,
  ) {
    return this.userService.changePassword(user, changeUserPasswordDto);
  }
}
