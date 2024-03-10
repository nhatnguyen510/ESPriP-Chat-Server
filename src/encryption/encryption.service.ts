import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/service';
import { appConfig } from 'src/config/config.module';
import { createDiffieHellman, DiffieHellman, pbkdf2Sync } from 'crypto';
import { User } from '@prisma/client';
import * as crypto from 'crypto';
import {
  SaveKeysDto,
  SaveSessionKeyDto,
  UpdateKeysDto,
  UpdateSessionKeyDto,
} from './dto';

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

    return encryption;
  }

  async getAllDecryptedSessionKeys(user: User, password: string) {
    const encryption = await this.prismaService.encryption.findMany({
      where: {
        user_id: user.id,
      },
    });

    const userMasterKey = this.deriveMasterKey(password);

    return await Promise.all(
      encryption.map(async (sessionKey) => {
        return this.decryptSessionKey(
          {
            encryptedData: sessionKey.encrypted_key,
            iv: sessionKey.iv,
          },
          Buffer.from(userMasterKey, 'hex'),
        );
      }),
    );
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

  async updateSessionKey(user: User, updateSessionKeyDto: UpdateSessionKeyDto) {
    const { encryption_id, encrypted_key, iv } = updateSessionKeyDto;

    const updatedSessionKey = await this.prismaService.encryption.update({
      where: {
        id: encryption_id,
      },
      data: {
        encrypted_key,
        iv,
      },
    });

    return updatedSessionKey;
  }

  async deleteKeys(user: User) {
    return this.prismaService.keys.deleteMany({
      where: {
        user_id: user.id,
      },
    });
  }

  encrypt(text: string, key: Buffer) {
    const iv = crypto.randomBytes(16); // Generate a random initialization vector
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
  }

  decrypt(encryptedData: { iv: string; encryptedData: string }, key: Buffer) {
    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        key,
        Buffer.from(encryptedData.iv, 'hex'),
      );
      let decrypted = decipher.update(
        encryptedData.encryptedData,
        'hex',
        'utf8',
      );
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new BadRequestException('The provided key is not correct');
    }
  }

  // Encrypt the session key using the master key and AES
  encryptSessionKey(sessionKey: string, masterKey: Buffer) {
    return this.encrypt(sessionKey, masterKey);
  }

  // Decrypt the session key using the master key and AES
  decryptSessionKey(
    encryptedSessionKey: {
      iv: string;
      encryptedData: string;
    },
    masterKey: Buffer,
  ) {
    return this.decrypt(encryptedSessionKey, masterKey);
  }

  async updateKeysWithNewPassword(
    user: User,
    old_password: string,
    new_password: string,
    old_master_key: string = null,
  ) {
    // TODO: Use master key from the old password to decrypt the private key and encrypt it with the new password
    const oldMasterKey = old_master_key || this.deriveMasterKey(old_password);
    const newMasterKey = this.deriveMasterKey(new_password);

    const existedKeys = await this.getKeys(user);
    const existedSessionKeys = await this.getAllSessionKeys(user);

    if (existedKeys) {
      const decryptedPrivateKey = this.decrypt(
        {
          iv: existedKeys.iv,
          encryptedData: existedKeys.encrypted_private_key,
        },
        Buffer.from(oldMasterKey, 'hex'),
      );

      const encryptedPrivateKey = this.encrypt(
        decryptedPrivateKey,
        Buffer.from(newMasterKey, 'hex'),
      );

      await this.updateKeys(user, {
        encrypted_private_key: encryptedPrivateKey.encryptedData,
        public_key: existedKeys.public_key,
        iv: encryptedPrivateKey.iv,
      });
    }

    if (existedSessionKeys) {
      await Promise.all(
        existedSessionKeys.map(async (sessionKey) => {
          const decryptedSessionKey = this.decrypt(
            {
              iv: sessionKey.iv,
              encryptedData: sessionKey.encrypted_key,
            },
            Buffer.from(oldMasterKey, 'hex'),
          );

          const encryptedSessionKey = this.encrypt(
            decryptedSessionKey,
            Buffer.from(newMasterKey, 'hex'),
          );

          return this.updateSessionKey(user, {
            encryption_id: sessionKey.id,
            encrypted_key: encryptedSessionKey.encryptedData,
            iv: encryptedSessionKey.iv,
          });
        }),
      );
    }
  }
}
