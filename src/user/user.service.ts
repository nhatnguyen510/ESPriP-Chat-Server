import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/service';
import { CreateUserDto, UpdateUserDto, ChangeUserPasswordDto } from './dto';
import * as bcrypt from 'bcrypt';
import { EncryptionService } from 'src/encryption/encryption.service';
import { User } from '@prisma/client';

export const roundsOfHashing = 10;

@Injectable()
export class UserService {
  constructor(
    private prismaService: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { username, email, password, first_name, last_name, avatar_url } =
      createUserDto;
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
      throw new BadRequestException('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, roundsOfHashing);

    return this.prismaService.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        first_name,
        last_name,
        avatar_url,
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

    console.log({ updateUserDto });

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

  async changePassword(
    user: User,
    changeUserPasswordDto: ChangeUserPasswordDto,
  ) {
    const { old_password, new_password, confirmed_new_password } =
      changeUserPasswordDto;

    if (new_password !== confirmed_new_password) {
      throw new BadRequestException('New passwords do not match');
    }

    if (old_password === new_password) {
      throw new BadRequestException(
        'New password cannot be the same as old password',
      );
    }

    const isPasswordValid = await this.validatePassword(
      old_password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    await this.encryptionService.updateKeysWithNewPassword(
      user,
      old_password,
      new_password,
    );

    const hashedPassword = await bcrypt.hash(new_password, roundsOfHashing);

    return this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });
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
        avatar_url: true,
        email: true,
      },
    });
  }
}
