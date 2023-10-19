//src/auth/jwt.strategy.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from 'src/auth/guard';
import { PrismaService } from 'src/common/service';

@Injectable()
export class MessageGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const user = request.user as User;
    const conversationId = request.params.id;

    console.log({ user, conversationId });

    // check if user is in the conversation
    const isUserInTheConversation =
      user.conversationIds.includes(conversationId);

    if (!isUserInTheConversation) {
      return false;
    }

    return true;
  }
}
