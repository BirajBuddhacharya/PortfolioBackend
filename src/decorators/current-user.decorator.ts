import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../modules/user/entity/user.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as User;
  },
);
