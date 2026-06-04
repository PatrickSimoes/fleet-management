import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

const validateDto = (payload: Record<string, unknown>) => {
  const dto = plainToInstance(PaginationQueryDto, payload);
  return { dto, errors: validate(dto) };
};

describe('PaginationQueryDto (validações)', () => {
  it('aplica os defaults page=1 e limit=1000 quando ausentes', async () => {
    const { dto, errors } = validateDto({});
    expect(await errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(1000);
  });

  it('converte strings da query em números (Type Number)', async () => {
    const { dto, errors } = validateDto({ page: '2', limit: '50' });
    expect(await errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(50);
  });

  it('rejeita page menor que 1', async () => {
    const { errors } = validateDto({ page: '0' });
    expect((await errors).some((e) => e.property === 'page')).toBe(true);
  });

  it('rejeita limit acima de 1000', async () => {
    const { errors } = validateDto({ limit: '1001' });
    expect((await errors).some((e) => e.property === 'limit')).toBe(true);
  });
});
