import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

const valid = {
  nickname: 'jdoe',
  name: 'John Doe',
  email: 'john@example.com',
  password: 'supersecret',
};

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(CreateUserDto, payload));

describe('CreateUserDto (validation)', () => {
  it('accepts a valid payload', async () => {
    expect(await validateDto(valid)).toHaveLength(0);
  });

  it('rejects an email with invalid format', async () => {
    const errors = await validateDto({ ...valid, email: 'not-an-email' });
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejects a password shorter than 8 characters', async () => {
    const errors = await validateDto({ ...valid, password: '123' });
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError?.constraints).toHaveProperty('minLength');
  });

  it('rejects a nickname longer than 50 characters', async () => {
    const errors = await validateDto({ ...valid, nickname: 'a'.repeat(51) });
    expect(errors.some((e) => e.property === 'nickname')).toBe(true);
  });

  it.each(['nickname', 'name', 'email', 'password'])(
    'rejects when "%s" is missing',
    async (field) => {
      const payload: Record<string, unknown> = { ...valid };
      delete payload[field];
      const errors = await validateDto(payload);
      expect(errors.some((e) => e.property === field)).toBe(true);
    },
  );
});
