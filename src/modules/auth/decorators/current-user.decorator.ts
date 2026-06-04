import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  AuthenticatedRequest,
  JwtPayload,
} from '../interface/jwt-payload.interface';

export const currentUserFactory = (
  _data: unknown,
  ctx: ExecutionContext,
): JwtPayload | undefined => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user;
};

export const CurrentUser = createParamDecorator(currentUserFactory);
