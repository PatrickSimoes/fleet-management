import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

const validateDto = (payload: Record<string, unknown>) => {
  const dto = plainToInstance(PaginationQueryDto, payload);
  return { dto, errors: validate(dto) };
};

describe('PaginationQueryDto (validation)', () => {
  it('applies defaults page=1 and limit=1000 when missing', async () => {
    const { dto, errors } = validateDto({});
    expect(await errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(1000);
  });

  it('converts query strings into numbers (Type Number)', async () => {
    const { dto, errors } = validateDto({ page: '2', limit: '50' });
    expect(await errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(50);
  });

  it('rejects page lower than 1', async () => {
    const { errors } = validateDto({ page: '0' });
    expect((await errors).some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects limit above 1000', async () => {
    const { errors } = validateDto({ limit: '1001' });
    expect((await errors).some((e) => e.property === 'limit')).toBe(true);
  });
});
