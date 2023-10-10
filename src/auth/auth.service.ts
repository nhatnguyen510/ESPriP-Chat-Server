import { Injectable } from '@nestjs/common';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { PrismaService } from 'src/common/service';

@Injectable()
export class AuthService {
  constructor(private prismaService: PrismaService) {}

  async register(registerAuthDto: RegisterAuthDto) {
    try {
      const result = await this.prismaService.user.create({
        data: {
          username: registerAuthDto.username,
          password: registerAuthDto.password,
          email: registerAuthDto.email,
          first_name: registerAuthDto.firstName,
          last_name: registerAuthDto.lastName,
        },
      });

      return result;
    } catch (err) {
      console.log({ err });
      throw err;
    }
  }
}
