import { UserService } from './../user/user.service';
import { LoginDto, RegisterDto } from './dto';
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
    // generate access token
    const accessToken = this.generateAccessToken(user.username, user.id);

    // generate refresh token
    const refreshToken = this.generateRefreshToken(user.username, user.id);

    // hash refresh token
    const hashedRefreshToken = await argon2.hash(refreshToken);

    //save refresh token in db
    const token = await this.prismaService.token.create({
      data: {
        refreshToken: hashedRefreshToken,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;

    return {
      accessToken,
      refreshToken,
      refreshTokenId: token.id,
      ...rest,
    };
  }

  async logout(user: User) {
    await this.prismaService.token.deleteMany({
      where: {
        userId: user.id,
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

    const isMatch = await argon2.verify(
      foundToken.refreshToken ?? '',
      refreshToken,
    );

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
      if (payload.id !== foundToken.userId) {
        //the sub of the token isn't the id of the token in db
        // log out all session of this payalod id, reFreshToken has been compromised
        await this.prismaService.token.deleteMany({
          where: {
            userId: payload.id,
          },
        });
        throw new ForbiddenException('Refresh token has been compromised');
      }

      throw new BadRequestException('Refresh token is not valid');
    }
  }

  async refresh({ accessToken, refreshToken, hashedRefreshToken, tokenId }) {
    await this.prismaService.token.update({
      where: {
        id: tokenId,
      },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async generateTokens(payload: Payload, tokenId: string) {
    const accessToken = this.generateAccessToken(payload.username, payload.id);

    const newRefreshToken = this.generateRefreshToken(
      payload.username,
      payload.id,
      payload.exp,
    );

    const hash = await argon2.hash(newRefreshToken);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      hashedRefreshToken: hash,
      tokenId: tokenId,
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
