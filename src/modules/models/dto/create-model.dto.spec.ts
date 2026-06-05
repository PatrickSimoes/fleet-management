import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateModelDto } from './create-model.dto';

const valid = {
  name: 'Corolla',
  brandId: 'a3f1c2d4-5b6e-7f80-9a1b-2c3d4e5f6a7b',
};

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(CreateModelDto, payload));

describe('CreateModelDto (validation)', () => {
  it('accepts a valid payload', async () => {
    expect(await validateDto(valid)).toHaveLength(0);
  });

  it('rejects an empty name', async () => {
    const errors = await validateDto({ ...valid, name: '' });
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejects a name longer than 255 characters', async () => {
    const errors = await validateDto({ ...valid, name: 'a'.repeat(256) });
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejects a non-UUID brandId', async () => {
    const errors = await validateDto({ ...valid, brandId: '123' });
    expect(errors.some((e) => e.property === 'brandId')).toBe(true);
  });
});
