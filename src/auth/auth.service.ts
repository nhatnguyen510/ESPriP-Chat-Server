import { UserService } from './../user/user.service';
import { LoginDto, RegisterDto } from './dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { appConfig } from 'src/config/config.module';
import { Payload } from 'src/types/types';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    await this.userService.create(registerDto);

    return {
      message: 'User registered successfully',
    };
  }

  async login(user: User) {
    const accessToken = this.generateAccessToken(user.username, user.id);
    const refreshToken = this.generateRefreshToken(user.username, user.id);
    const { password, ...others } = user;

    await this.userService.update(user.id, {
      refresh_token: refreshToken,
    });

    return {
      accessToken,
      refreshToken,
      ...others,
    };
  }

  async refresh(payload: Payload) {
    console.log({
      'Payload exp': payload.exp,
    });
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const remainingTime = payload.exp - currentTime;

    const accessToken = this.generateAccessToken(payload.username, payload.id);
    const refreshToken = this.generateRefreshToken(
      payload.username,
      payload.id,
      remainingTime,
    );

    this.userService.update(payload.id, {
      refresh_token: refreshToken,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private generateAccessToken(username: string, id: string) {
    return this.jwtService.sign(
      {
        username,
        id,
      },
      {
        secret: appConfig.jwt.secret,
        expiresIn: appConfig.jwt.expiresIn,
      },
    );
  }

  private generateRefreshToken(
    username: string,
    id: string,
    expiresIn = appConfig.jwt.refreshExpiresIn,
  ) {
    return this.jwtService.sign(
      {
        username,
        id,
      },
      {
        secret: appConfig.jwt.refreshSecret,
        expiresIn: expiresIn,
      },
    );
  }
}
