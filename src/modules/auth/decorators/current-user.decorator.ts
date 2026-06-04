import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  AuthenticatedRequest,
  JwtPayload,
} from '../interface/jwt-payload.interface';

/** Lógica de extração isolada para ser testável de forma unitária. */
export const currentUserFactory = (
  _data: unknown,
  ctx: ExecutionContext,
): JwtPayload | undefined => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user;
};

/** Extrai o usuário do token (request.user) preenchido pelo AuthGuard. */
export const CurrentUser = createParamDecorator(currentUserFactory);
