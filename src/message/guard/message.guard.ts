//src/auth/jwt.strategy.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class MessageGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const user = request.user as User;
    const conversationId = request.params.id;

    // check if user is in the conversation
    const isUserInTheConversation =
      user.conversation_ids.includes(conversationId);

    if (!isUserInTheConversation) {
      return false;
    }

    return true;
  }
}
