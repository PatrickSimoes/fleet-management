import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

const valid = { email: 'john@example.com', password: 'plain' };

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(LoginDto, payload));

describe('LoginDto (validações)', () => {
  it('aceita email e senha válidos', async () => {
    expect(await validateDto(valid)).toHaveLength(0);
  });

  it('rejeita email inválido', async () => {
    const errors = await validateDto({ ...valid, email: 'invalido' });
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejeita senha vazia', async () => {
    const errors = await validateDto({ ...valid, password: '' });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});
