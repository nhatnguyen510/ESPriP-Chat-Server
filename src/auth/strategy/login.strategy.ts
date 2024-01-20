import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { Strategy } from 'passport-local';
import { UserService } from 'src/user/user.service';

@Injectable()
export class LoginStrategy extends PassportStrategy(Strategy, 'login') {
  constructor(private userService: UserService) {
    super();
  }

  async validate(username: string, password: string): Promise<User> {
    const user = await this.userService.findByUsername(username);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await this.userService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Password is not valid');
    }
    return {
      ...user,
      password,
    };
  }
}
