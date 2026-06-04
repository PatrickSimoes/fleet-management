import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };

  // Monta um ExecutionContext fake com o header authorization informado.
  const buildContext = (authorization?: string) => {
    const request: { headers: Record<string, string>; user?: unknown } = {
      headers: authorization ? { authorization } : {},
    };
    return {
      ctx: {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => null,
        getClass: () => null,
      } as unknown as ExecutionContext,
      request,
    };
  };

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() };
    reflector = { getAllAndOverride: jest.fn() };
    guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
    );
  });

  it('libera rotas públicas sem exigir token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const { ctx } = buildContext();

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      IS_PUBLIC_KEY,
      expect.any(Array),
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('lança UnauthorizedException quando não há token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const { ctx } = buildContext();

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('lança UnauthorizedException quando o esquema não é Bearer', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const { ctx } = buildContext('Basic abc123');

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('lança UnauthorizedException quando o token é inválido', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
    const { ctx } = buildContext('Bearer bad-token');

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('aceita token válido e injeta o payload em request.user', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const payload = { sub: 'user-1', username: 'John' };
    jwtService.verifyAsync.mockResolvedValue(payload);
    const { ctx, request } = buildContext('Bearer good-token');

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('good-token');
    expect(request.user).toEqual(payload);
  });
});
