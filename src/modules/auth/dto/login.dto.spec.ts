import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

const valid = { email: 'john@example.com', password: 'plain' };

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(LoginDto, payload));

describe('LoginDto (validation)', () => {
  it('accepts a valid email and password', async () => {
    expect(await validateDto(valid)).toHaveLength(0);
  });

  it('rejects an invalid email', async () => {
    const errors = await validateDto({ ...valid, email: 'invalido' });
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejects an empty password', async () => {
    const errors = await validateDto({ ...valid, password: '' });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});
