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

    const masterKey = this.encryptionService.deriveMasterKey(password);

    return this.prismaService.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        first_name,
        last_name,
        avatar_url,
        master_key: masterKey,
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

    if (updateUserDto.username) {
      const isUsernameExisted = await this.findByUsername(
        updateUserDto.username,
      );

      if (isUsernameExisted) {
        throw new BadRequestException('Username already exists');
      }
    }

    if (updateUserDto.email) {
      const isEmailExisted = await this.findByEmail(updateUserDto.email);

      if (isEmailExisted) {
        throw new BadRequestException('Email already exists');
      }
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

    const newMasterKey = this.encryptionService.deriveMasterKey(new_password);

    return this.update(user.id, {
      password: new_password,
      master_key: newMasterKey,
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
