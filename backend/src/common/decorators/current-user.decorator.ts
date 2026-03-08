import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../database/entities/user.entity.js';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | unknown => {
    const request = ctx.switchToHttp().getRequest<{ user?: User }>();
    const user = request.user;
    return data && user ? user[data] : user;
  },
);
