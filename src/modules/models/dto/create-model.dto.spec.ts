import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateModelDto } from './create-model.dto';

const valid = {
  name: 'Corolla',
  brandId: 'a3f1c2d4-5b6e-7f80-9a1b-2c3d4e5f6a7b',
};

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(CreateModelDto, payload));

describe('CreateModelDto (validações)', () => {
  it('aceita um payload válido', async () => {
    expect(await validateDto(valid)).toHaveLength(0);
  });

  it('rejeita name vazio', async () => {
    const errors = await validateDto({ ...valid, name: '' });
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejeita name acima de 255 caracteres', async () => {
    const errors = await validateDto({ ...valid, name: 'a'.repeat(256) });
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejeita brandId que não é UUID', async () => {
    const errors = await validateDto({ ...valid, brandId: '123' });
    expect(errors.some((e) => e.property === 'brandId')).toBe(true);
  });
});
