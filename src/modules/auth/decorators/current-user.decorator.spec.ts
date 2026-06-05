import { ExecutionContext } from '@nestjs/common';
import { currentUserFactory } from './current-user.decorator';
import type { JwtPayload } from '../interface/jwt-payload.interface';

const contextWith = (user?: JwtPayload): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('currentUserFactory (CurrentUser)', () => {
  it('returns the user present in request.user', () => {
    const user: JwtPayload = { sub: 'user-1', username: 'John' };

    expect(currentUserFactory(undefined, contextWith(user))).toEqual(user);
  });

  it('returns undefined when there is no user in the request', () => {
    expect(currentUserFactory(undefined, contextWith())).toBeUndefined();
  });
});
