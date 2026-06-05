import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBrandDto } from './create-brand.dto';

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(CreateBrandDto, payload));

describe('CreateBrandDto (validation)', () => {
  it('accepts a valid name', async () => {
    expect(await validateDto({ name: 'Toyota' })).toHaveLength(0);
  });

  it('rejects an empty name', async () => {
    const errors = await validateDto({ name: '' });
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejects a missing name', async () => {
    const errors = await validateDto({});
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejects a name longer than 255 characters', async () => {
    const errors = await validateDto({ name: 'a'.repeat(256) });
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejects a non-string name', async () => {
    const errors = await validateDto({ name: 123 });
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });
});
