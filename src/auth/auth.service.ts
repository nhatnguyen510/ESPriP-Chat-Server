import { UserService } from './../user/user.service';
import { RegisterDto } from './dto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from 'src/common/service';
import { appConfig } from 'src/config/config.module';
import { Payload } from 'src/types';
import * as dayjs from 'dayjs';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    await this.userService.create(registerDto);

    return {
      message: 'User registered successfully',
    };
  }

  async login(user: User) {
    const { id, username } = user;
    // generate access token
    const accessToken = this.generateAccessToken(username, id);

    // generate refresh token
    const refreshToken = this.generateRefreshToken(username, id);

    // hash refresh token
    const hashedRefreshToken = await argon2.hash(refreshToken);

    //save refresh token in db
    const token = await this.prismaService.token.create({
      data: {
        refresh_token: hashedRefreshToken,
        user: {
          connect: {
            id,
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      refresh_token_id: token.id,
      ...rest,
    };
  }

  async logout(user: User) {
    await this.prismaService.token.deleteMany({
      where: {
        user_id: user.id,
      },
    });

    return {
      message: 'User logged out successfully',
    };
  }

  async getUserIfRefreshTokenMatches(
    refreshToken: string,
    tokenId: string,
    payload: Payload,
  ) {
    const foundToken = await this.prismaService.token.findUnique({
      where: {
        id: tokenId,
      },
    });

    if (!foundToken) {
      throw new NotFoundException('Token id is not valid');
    }

    const isMatch = await argon2.verify(foundToken.refresh_token, refreshToken);

    const issuedAt = dayjs.unix(payload.iat);
    const diff = dayjs().diff(issuedAt, 'seconds');

    if (isMatch) {
      return await this.generateTokens(payload, tokenId);
    } else {
      //less than 1 minute leeway allows refresh for network concurrency
      if (diff < 60 * 1 * 1) {
        console.log('leeway');
        return await this.generateTokens(payload, tokenId);
      }

      //refresh token is valid but not in db
      //possible re-use!!! delete all refresh tokens(sessions) belonging to the sub
      if (payload.id !== foundToken.user_id) {
        //the sub of the token isn't the id of the token in db
        // log out all session of this payalod id, reFreshToken has been compromised
        await this.prismaService.token.deleteMany({
          where: {
            user_id: payload.id,
          },
        });
        throw new ForbiddenException('Refresh token has been compromised');
      }

      throw new BadRequestException('Refresh token is not valid');
    }
  }

  async refresh({
    access_token,
    refresh_token,
    hashed_refresh_token,
    token_id,
  }) {
    await this.prismaService.token.update({
      where: {
        id: token_id,
      },
      data: {
        refresh_token: hashed_refresh_token,
      },
    });

    return {
      access_token,
      refresh_token,
    };
  }

  private async generateTokens(payload: Payload, tokenId: string) {
    const accessToken = this.generateAccessToken(payload.username, payload.id);

    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const remainingTime = payload.exp - currentTime;

    const newRefreshToken = this.generateRefreshToken(
      payload.username,
      payload.id,
      remainingTime,
    );

    const hash = await argon2.hash(newRefreshToken);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      hashed_refresh_token: hash,
      token_id: tokenId,
    };
  }

  private generateAccessToken(
    username: string,
    id: string,
    expiresIn = appConfig.jwt.expiresIn,
  ) {
    return this.jwtService.sign(
      {
        username,
        id,
      },
      {
        secret: appConfig.jwt.secret,
        expiresIn,
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
        expiresIn,
      },
    );
  }
}
