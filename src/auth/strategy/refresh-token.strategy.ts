//src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { appConfig } from 'src/config/config.module';
import { Payload } from 'src/types';
import { UserService } from 'src/user/user.service';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: appConfig.jwt.refreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: Payload) {
    const user = await this.userService.findOne(payload.id);
    const refreshToken = request.body.refreshToken;
    const tokenId = request.headers['x-token-id'] as string;

    if (!user) {
      throw new UnauthorizedException("User doesn't exist");
    }

    return this.authService.getUserIfRefreshTokenMatches(
      refreshToken,
      tokenId,
      payload,
    );
  }
}
