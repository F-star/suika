import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): { id: number } => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
