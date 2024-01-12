import { Controller, Get, Post, Body } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { GetCurrentUser } from 'src/auth/decorator';
import { SaveSessionKeyDto } from './dto/save-session-key.dto';
import { User } from '@prisma/client';

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
}
