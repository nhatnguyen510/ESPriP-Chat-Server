//src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { appConfig } from 'src/config/config.module';
import { Payload } from 'src/types/types';
import { UserService } from 'src/user/user.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: appConfig.jwt.refreshSecret,
    });
  }

  async validate(payload: Payload): Promise<Payload> {
    const user = await this.userService.findOne(payload.id);

    if (!user) {
      throw new UnauthorizedException();
    }

    console.log({ payload });

    return payload;
  }
}
