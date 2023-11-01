import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto';
import { User } from '@prisma/client';
import { LoginGuard, RefreshTokenGuard } from './guard';
import { GetCurrentUser, IsPublic } from './decorator';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @IsPublic()
  @Post('/register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @IsPublic()
  @UseGuards(LoginGuard)
  @Post('/login')
  async login(@GetCurrentUser() user: User) {
    return this.authService.login(user);
  }

  @IsPublic()
  @UseGuards(RefreshTokenGuard)
  @Post('/refresh')
  async refreshToken(
    @Request()
    req: {
      user: {
        access_token: string;
        refresh_token: string;
        hashed_refresh_token: string;
        token_id: string;
      };
    },
  ) {
    return this.authService.refresh(req.user);
  }

  @Post('/logout')
  async logout(@GetCurrentUser() user: User) {
    return this.authService.logout(user);
  }
}
