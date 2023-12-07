import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/service';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';

export const roundsOfHashing = 10;

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { username, email, password, first_name, last_name } = createUserDto;
    const isUserExist = await this.prismaService.user.findFirst({
      where: {
        OR: [
          {
            username,
          },
          {
            email,
          },
        ],
      },
    });

    if (isUserExist) {
      throw new BadRequestException('User already exist');
    }

    const hashedPassword = await bcrypt.hash(password, roundsOfHashing);

    return this.prismaService.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        first_name,
        last_name,
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

  findByEmail(email: string) {
    return this.prismaService.user.findUnique({ where: { email } });
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

  async searchUsers(query: string) {
    return this.prismaService.user.findMany({
      where: {
        OR: [
          {
            first_name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            last_name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            username: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        email: true,
      },
    });
  }
}
