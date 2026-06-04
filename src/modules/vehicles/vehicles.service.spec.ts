import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import { RedisService } from '../../config/redis/redis.service';
import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let repository: MockRepository<Vehicle>;
  let redis: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    delByPattern: jest.Mock;
  };

  const dto = {
    licensePlate: 'ABC1D23',
    chassis: '9BWZZZ377VT004251',
    renavam: '12345678901',
    year: 2022,
    color: 'preto',
    modelId: 'model-1',
  };

  beforeEach(async () => {
    repository = createMockRepository<Vehicle>();
    redis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delByPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: getRepositoryToken(Vehicle), useValue: repository },
        { provide: RedisService, useValue: redis },
        { provide: ConfigService, useValue: { get: jest.fn(() => 60) } },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('paginate (cache de listagem)', () => {
    const query = { page: 1, limit: 10 };

    it('retorna do cache sem tocar no banco quando há hit', async () => {
      const cached = { data: [], meta: {} };
      redis.get.mockResolvedValue(cached);

      const result = await service.paginate(query);

      expect(result).toBe(cached);
      expect(repository.findAndCount).not.toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('no cache miss consulta o banco e popula o cache com TTL', async () => {
      redis.get.mockResolvedValue(null);
      repository.findAndCount!.mockResolvedValue([[{ id: '1' }], 1]);

      const result = await service.paginate(query);

      expect(repository.findAndCount).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalledWith(
        'vehicles:list:page=1:limit=10',
        result,
        60,
      );
    });

    it('ignora o cache quando opções de busca são passadas', async () => {
      repository.findAndCount!.mockResolvedValue([[], 0]);

      await service.paginate(query, { where: {} });

      expect(redis.get).not.toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
    });
  });

  describe('findOne (cache de item)', () => {
    it('retorna do cache quando há hit', async () => {
      const cached = { id: '1' } as Vehicle;
      redis.get.mockResolvedValue(cached);

      const result = await service.findOne('1');

      expect(result).toBe(cached);
      expect(repository.findOne).not.toHaveBeenCalled();
    });

    it('no cache miss busca no banco e armazena no cache', async () => {
      redis.get.mockResolvedValue(null);
      repository.findOne!.mockResolvedValue({ id: '1' });

      const result = await service.findOne('1');

      expect(redis.set).toHaveBeenCalledWith('vehicles:item:1', result, 60);
    });

    it('ignora o cache quando opções são passadas', async () => {
      repository.findOne!.mockResolvedValue({ id: '1' });

      await service.findOne('1', { relations: { model: true } });

      expect(redis.get).not.toHaveBeenCalled();
    });
  });

  describe('create (validação de campos únicos)', () => {
    it('cria o veículo e invalida o cache de listagem quando não há conflitos', async () => {
      repository.existsBy!.mockResolvedValue(false);
      repository.create!.mockImplementation((d: Partial<Vehicle>) => d);
      repository.save!.mockImplementation((e: Partial<Vehicle>) =>
        Promise.resolve({ id: '1', ...e }),
      );

      const result = await service.create(dto, 'user-1');

      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        createdBy: 'user-1',
      });
      expect(redis.delByPattern).toHaveBeenCalledWith('vehicles:list:*');
      expect(result).toMatchObject({ id: '1', licensePlate: 'ABC1D23' });
    });

    it('agrega todos os conflitos (placa, chassi e renavam) na exceção', async () => {
      repository.existsBy!.mockResolvedValue(true); // tudo duplicado

      await expect(service.create(dto)).rejects.toThrow(ConflictException);

      try {
        await service.create(dto);
      } catch (err) {
        const response = (err as ConflictException).getResponse() as {
          conflicts: string[];
        };
        expect(response.conflicts).toEqual(
          expect.arrayContaining([
            expect.stringContaining('placa'),
            expect.stringContaining('chassi'),
            expect.stringContaining('renavam'),
          ]),
        );
      }
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('reporta apenas o campo realmente duplicado', async () => {
      repository.existsBy!.mockImplementation(
        (where: { licensePlate?: string }) =>
          Promise.resolve(Boolean(where.licensePlate)),
      );

      try {
        await service.create(dto);
        fail('deveria ter lançado ConflictException');
      } catch (err) {
        const response = (err as ConflictException).getResponse() as {
          conflicts: string[];
        };
        expect(response.conflicts).toHaveLength(1);
        expect(response.conflicts[0]).toContain('placa');
      }
    });
  });

  describe('update / remove (invalidação de cache)', () => {
    it('update invalida o item e a listagem', async () => {
      repository.findOneBy!.mockResolvedValue({ id: '1' });
      repository.save!.mockImplementation((e: Partial<Vehicle>) =>
        Promise.resolve(e),
      );

      await service.update('1', { color: 'azul' });

      expect(redis.del).toHaveBeenCalledWith('vehicles:item:1');
      expect(redis.delByPattern).toHaveBeenCalledWith('vehicles:list:*');
    });

    it('remove invalida o item e a listagem', async () => {
      repository.findOneBy!.mockResolvedValue({ id: '1' });

      await service.remove('1');

      expect(repository.remove).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith('vehicles:item:1');
      expect(redis.delByPattern).toHaveBeenCalledWith('vehicles:list:*');
    });
  });
});
