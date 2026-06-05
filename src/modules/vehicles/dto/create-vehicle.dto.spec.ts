import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateVehicleDto } from './create-vehicle.dto';

const valid = {
  licensePlate: 'ABC1D23',
  chassis: '9BWZZZ377VT004251',
  renavam: '12345678901',
  year: 2022,
  modelId: 'a3f1c2d4-5b6e-7f80-9a1b-2c3d4e5f6a7b',
};

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(CreateVehicleDto, payload));

describe('CreateVehicleDto (validações)', () => {
  it('aceita um payload válido', async () => {
    const errors = await validateDto(valid);
    expect(errors).toHaveLength(0);
  });

  it.each(['licensePlate', 'chassis', 'renavam'])(
    'rejeita quando o campo string "%s" está ausente',
    async (field) => {
      const payload: Record<string, unknown> = { ...valid };
      delete payload[field];
      const errors = await validateDto(payload);
      expect(errors.some((e) => e.property === field)).toBe(true);
    },
  );

  it('rejeita ano menor que 1900', async () => {
    const errors = await validateDto({ ...valid, year: 1899 });
    expect(errors.some((e) => e.property === 'year')).toBe(true);
  });

  it('rejeita ano não inteiro', async () => {
    const errors = await validateDto({ ...valid, year: 'abc' });
    expect(errors.some((e) => e.property === 'year')).toBe(true);
  });

  it('rejeita modelId que não é UUID', async () => {
    const errors = await validateDto({ ...valid, modelId: 'not-a-uuid' });
    expect(errors.some((e) => e.property === 'modelId')).toBe(true);
  });
});
