import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import Redis from 'ioredis';
import { AuthService } from 'src/auth/auth.service';
import { CustomSocket } from './chat.type';

export class ChatAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>;
  private authService: AuthService;

  constructor(
    private readonly redis: Redis,
    app: NestFastifyApplication,
  ) {
    super(app);
    this.authService = app.get(AuthService);
  }

  async connectToRedis(): Promise<void> {
    this.adapterConstructor = createAdapter(this.redis, this.redis.duplicate());
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    server.use(async (socket: CustomSocket, next) => {
      const token = socket.handshake.auth.token;

      console.log('token in chat', token);
      const user = await this.authService.verifyToken(token);
      if (!user) {
        return next(new Error('Unauthorized'));
      }
      socket.user = user;
      next();
    });

    return server;
  }
}
