import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto';
import { User } from '@prisma/client';
import { LoginGuard, JwtAuthGuard, RefreshTokenGuard } from './guard';
import { GetCurrentUser } from './decorator';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LoginGuard)
  @Post('/login')
  async login(@GetCurrentUser() user: User) {
    return this.authService.login(user);
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
  async logout(@GetCurrentUser() user: User) {
    return this.authService.logout(user);
  }
}
