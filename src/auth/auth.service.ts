import { UserService } from './../user/user.service';
import { RegisterDto, ResetPasswordDto } from './dto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService, RedisService } from 'src/common/service';
import { appConfig } from 'src/config/config.module';
import { Payload } from 'src/types';
import * as dayjs from 'dayjs';
import * as argon2 from 'argon2';
import { EncryptionService } from 'src/encryption/encryption.service';
import Redis from 'ioredis';
import * as crypto from 'crypto';
import { RedisNameSpace } from 'src/enum';
import { MailService } from 'src/mail/mail.service';
import * as bcrypt from 'bcrypt';

export const roundsOfHashing = 10;
@Injectable()
export class AuthService {
  private readonly _redis: Redis;

  constructor(
    private userService: UserService,
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private encryptionService: EncryptionService,
    private redisService: RedisService,
    private readonly mailService: MailService,
  ) {
    this._redis = redisService.client;
  }

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
    const { password, master_key, ...rest } = user;

    // if user has no master key, generate one
    if (!master_key) {
      const masterKey = this.encryptionService.deriveMasterKey(password);

      await this.userService.update(user, {
        master_key: masterKey,
      });

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        refresh_token_id: token.id,
        master_key: masterKey,
        ...rest,
      };
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      refresh_token_id: token.id,
      master_key,
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

  async verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: appConfig.jwt.secret,
      });

      const user = await this.userService.findOne(payload.id);

      if (!user) {
        return null;
      }

      return user;
    } catch (err) {
      return null;
    }
  }

  async verifyUsername(username: string) {
    const user = await this.userService.findByUsername(username);

    if (user) {
      throw new BadRequestException('Username is already taken');
    }

    return {
      message: 'Username is available',
    };
  }

  async verifyEmail(email: string) {
    const user = await this.userService.findByEmail(email);

    if (user) {
      throw new BadRequestException('Email is already taken');
    }

    return {
      message: 'Email is available',
    };
  }

  async getUsernameFromEmail(email: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.username;
  }

  async generatePasswordResetToken(email: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = crypto.randomBytes(32).toString('hex');

    const hashedToken = await bcrypt.hash(token, roundsOfHashing);

    await this.setTokenToRedis(
      RedisNameSpace.ResetPasswordToken,
      email,
      hashedToken,
    );

    return token;
  }

  async setTokenToRedis(
    redisNameSpace: RedisNameSpace,
    email: string,
    token: string,
  ) {
    await this._redis.set(`${redisNameSpace}${email}`, token, 'EX', 60 * 15); // 15 minutes
  }

  async findTokenInRedis(redisNameSpace: RedisNameSpace, email: string) {
    return await this._redis.get(`${redisNameSpace}${email}`);
  }

  async deleteTokenInRedis(redisNameSpace: RedisNameSpace, email: string) {
    return await this._redis.del(`${redisNameSpace}${email}`);
  }

  async requestPasswordReset(email: string) {
    const existedToken = await this.findTokenInRedis(
      RedisNameSpace.ResetPasswordToken,
      email,
    );

    if (existedToken) {
      await this.deleteTokenInRedis(RedisNameSpace.ResetPasswordToken, email);
    }

    const token = await this.generatePasswordResetToken(email);

    const username = await this.getUsernameFromEmail(email);

    const link = `${appConfig.clientUrl}/reset-password?username=${username}&token=${token}&email=${email}`;

    await this.mailService.sendForgotPasswordEmail(email, username, link);

    return {
      message: 'Password reset link has been sent to your email',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, token, password } = resetPasswordDto;

    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existedToken = await this.findTokenInRedis(
      RedisNameSpace.ResetPasswordToken,
      email,
    );

    if (!existedToken) {
      throw new BadRequestException('Token has expired');
    }

    const isTokenValid = await bcrypt.compare(token, existedToken);

    if (!isTokenValid) {
      throw new BadRequestException('Token is not valid');
    }

    // update master key
    await this.encryptionService.updateKeysWithNewPassword(
      user,
      '',
      password,
      user.master_key,
    );

    const newMasterKey = this.encryptionService.deriveMasterKey(password);

    await this.userService.update(user, {
      password,
      master_key: newMasterKey,
    });

    await this.deleteTokenInRedis(RedisNameSpace.ResetPasswordToken, email);

    return {
      message: 'Password has been reset successfully',
    };
  }
}
