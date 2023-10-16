import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/service';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';

export const roundsOfHashing = 10;

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const isUserExist = await this.prismaService.user.findFirst({
      where: {
        OR: [
          {
            username: createUserDto.username,
          },
          {
            email: createUserDto.email,
          },
        ],
      },
    });

    if (isUserExist) {
      throw new BadRequestException('User already exist');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      roundsOfHashing,
    );

    createUserDto.password = hashedPassword;

    return this.prismaService.user.create({
      data: {
        username: createUserDto.username,
        password: createUserDto.password,
        email: createUserDto.email,
        first_name: createUserDto.firstName,
        last_name: createUserDto.lastName,
      },
    });
  }

  findAll() {
    return this.prismaService.user.findMany();
  }

  findOne(id: string) {
    return this.prismaService.user.findUnique({ where: { id } });
  }

  findByUsername(username: string) {
    return this.prismaService.user.findUnique({ where: { username } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        roundsOfHashing,
      );
    }

    return this.prismaService.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: string) {
    return this.prismaService.user.delete({ where: { id } });
  }

  async validatePassword(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  }
}
