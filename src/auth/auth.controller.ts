import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto';
import { LoginGuard } from './guard/login.guard';
import { User } from '@prisma/client';
import { RefreshTokenGuard } from './guard/refresh-token.guard';
import { Payload } from 'src/types';
import { JwtAuthGuard } from './guard/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LoginGuard)
  @Post('/login')
  async login(@Request() req: { user: User }) {
    return this.authService.login(req.user);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('/refresh')
  async refreshToken(
    @Request()
    req: {
      user: {
        accessToken: string;
        refreshToken: string;
        hashedRefreshToken: string;
        tokenId: string;
      };
    },
  ) {
    return this.authService.refresh(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  async logout(@Request() req: { user: User }) {
    return this.authService.logout(req.user);
  }
}
