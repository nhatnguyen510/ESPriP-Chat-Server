import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/service';
import { appConfig } from 'src/config/config.module';
import { createDiffieHellman, DiffieHellman, pbkdf2Sync } from 'crypto';
import { SaveSessionKeyDto } from './dto/save-session-key.dto';
import { User } from '@prisma/client';
import { SaveKeysDto } from './dto/save-keys.dto';
import { UpdateKeysDto } from './dto/update-keys.dto';

@Injectable()
export class EncryptionService {
  private server: DiffieHellman;

  constructor(private prismaService: PrismaService) {
    this.server = createDiffieHellman(
      appConfig.encryption.prime,
      'hex',
      appConfig.encryption.generator as any,
    );
  }

  getPrimeAndGenerator() {
    return {
      prime: this.server.getPrime('hex'),
      generator: this.server.getGenerator('hex'),
    };
  }

  deriveMasterKey(password: string) {
    return pbkdf2Sync(
      password,
      appConfig.encryption.master_key_salt,
      100000,
      32,
      'sha512',
    ).toString('hex');
  }

  async getAllSessionKeys(user: User) {
    const encryption = await this.prismaService.encryption.findMany({
      where: {
        user_id: user.id,
      },
    });

    if (!encryption) {
      throw new BadRequestException('No encryption key found');
    }

    return encryption;
  }

  async saveSessionKey(user: User, saveSessionKeyDto: SaveSessionKeyDto) {
    const { conversation_id, encrypted_key, iv } = saveSessionKeyDto;

    // check if user is in the conversation
    const isUserInConversation =
      user.conversation_ids.includes(conversation_id);

    if (!isUserInConversation) {
      throw new BadRequestException('User is not in the conversation');
    }

    return this.prismaService.encryption.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        conversation: {
          connect: {
            id: conversation_id,
          },
        },
        encrypted_key,
        iv,
      },
    });
  }

  async saveKeys(user: User, saveKeysDto: SaveKeysDto) {
    const { encrypted_private_key, public_key, iv } = saveKeysDto;

    return this.prismaService.keys.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        encrypted_private_key,
        public_key,
        iv,
      },
    });
  }

  async getKeys(user: User) {
    const keys = await this.prismaService.keys.findUnique({
      where: {
        user_id: user.id,
      },
    });

    return keys;
  }

  async updateKeys(user: User, updateKeysDto: UpdateKeysDto) {
    const { encrypted_private_key, public_key, iv } = updateKeysDto;

    const updatedKey = await this.prismaService.keys.update({
      where: {
        user_id: user.id,
      },
      data: {
        encrypted_private_key,
        public_key,
        iv,
      },
    });

    return updatedKey;
  }

  async deleteKeys(user: User) {
    return this.prismaService.keys.deleteMany({
      where: {
        user_id: user.id,
      },
    });
  }
}
