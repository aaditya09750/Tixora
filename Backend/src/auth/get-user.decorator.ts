import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserSession {
  id: string;
  role: string;
}

export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext): UserSession => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
