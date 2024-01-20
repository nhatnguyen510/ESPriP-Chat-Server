import { Controller, Get, Post, Body, Put } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { GetCurrentUser } from 'src/auth/decorator';
import { SaveSessionKeyDto } from './dto/save-session-key.dto';
import { User } from '@prisma/client';
import { SaveKeysDto } from './dto/save-keys.dto';
import { UpdateKeysDto } from './dto/update-keys.dto';

@Controller()
export class EncryptionController {
  constructor(private readonly encryptionService: EncryptionService) {}

  @Get()
  async getPrimeAndGenerator() {
    return this.encryptionService.getPrimeAndGenerator();
  }

  @Get('/session-keys')
  async getAllSessionKeys(@GetCurrentUser() user: User) {
    return this.encryptionService.getAllSessionKeys(user);
  }

  @Post('/session-key')
  async saveSessionKey(
    @GetCurrentUser() user: User,
    @Body() saveSessionKeyDto: SaveSessionKeyDto,
  ) {
    return this.encryptionService.saveSessionKey(user, saveSessionKeyDto);
  }

  @Get('/keys')
  async getKeys(@GetCurrentUser() user: User) {
    return this.encryptionService.getKeys(user);
  }

  @Post('/keys')
  async saveKeys(
    @GetCurrentUser() user: User,
    @Body() saveKeysDto: SaveKeysDto,
  ) {
    return this.encryptionService.saveKeys(user, saveKeysDto);
  }

  @Put('/keys')
  async updateKeys(
    @GetCurrentUser() user: User,
    @Body() updateKeysDto: UpdateKeysDto,
  ) {
    return this.encryptionService.updateKeys(user, updateKeysDto);
  }

  @Post('keys/delete')
  async deleteKeys(@GetCurrentUser() user: User) {
    return this.encryptionService.deleteKeys(user);
  }
}
