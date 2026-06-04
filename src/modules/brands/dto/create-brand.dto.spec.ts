import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBrandDto } from './create-brand.dto';

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(CreateBrandDto, payload));

describe('CreateBrandDto (validações)', () => {
  it('aceita um nome válido', async () => {
    expect(await validateDto({ name: 'Toyota' })).toHaveLength(0);
  });

  it('rejeita name vazio', async () => {
    const errors = await validateDto({ name: '' });
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejeita name ausente', async () => {
    const errors = await validateDto({});
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejeita name acima de 255 caracteres', async () => {
    const errors = await validateDto({ name: 'a'.repeat(256) });
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejeita name que não é string', async () => {
    const errors = await validateDto({ name: 123 });
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });
});
