//src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { appConfig } from 'src/config/config.module';
import { Payload } from 'src/types';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: appConfig.jwt.secret,
    });
  }

  async validate(payload: Payload) {
    const user = await this.userService.findOne(payload.id);

    if (!user) {
      throw new UnauthorizedException("User doesn't exist");
    }

    return user;
  }
}
