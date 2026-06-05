import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import { RedisService } from '../../config/redis/redis.service';
import {
  EventPatterns,
  FLEET_SERVICE,
} from '../../config/rabbitmq/rabbitmq.constants';
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
  let client: { emit: jest.Mock };

  const dto = {
    licensePlate: 'ABC1D23',
    chassis: '9BWZZZ377VT004251',
    renavam: '12345678901',
    year: 2022,
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
    client = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: getRepositoryToken(Vehicle), useValue: repository },
        { provide: RedisService, useValue: redis },
        { provide: ConfigService, useValue: { get: jest.fn(() => 60) } },
        { provide: FLEET_SERVICE, useValue: client },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('paginate (list cache)', () => {
    const query = { page: 1, limit: 10 };

    it('returns from cache without touching the database on a hit', async () => {
      const cached = { data: [], meta: {} };
      redis.get.mockResolvedValue(cached);

      const result = await service.paginate(query);

      expect(result).toBe(cached);
      expect(repository.findAndCount).not.toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('on a cache miss queries the database and populates the cache with TTL', async () => {
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

    it('bypasses the cache when find options are passed', async () => {
      repository.findAndCount!.mockResolvedValue([[], 0]);

      await service.paginate(query, { where: {} });

      expect(redis.get).not.toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
    });
  });

  describe('findOne (item cache)', () => {
    it('returns from cache on a hit', async () => {
      const cached = { id: '1' } as Vehicle;
      redis.get.mockResolvedValue(cached);

      const result = await service.findOne('1');

      expect(result).toBe(cached);
      expect(repository.findOne).not.toHaveBeenCalled();
    });

    it('on a cache miss queries the database and stores it in the cache', async () => {
      redis.get.mockResolvedValue(null);
      repository.findOne!.mockResolvedValue({ id: '1' });

      const result = await service.findOne('1');

      expect(redis.set).toHaveBeenCalledWith('vehicles:item:1', result, 60);
    });

    it('bypasses the cache when options are passed', async () => {
      repository.findOne!.mockResolvedValue({ id: '1' });

      await service.findOne('1', { relations: { model: true } });

      expect(redis.get).not.toHaveBeenCalled();
    });
  });

  describe('create (unique field validation)', () => {
    it('creates the vehicle and invalidates the list cache when there are no conflicts', async () => {
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
      expect(client.emit).toHaveBeenCalledWith(EventPatterns.VEHICLE_CREATED, {
        id: '1',
        licensePlate: 'ABC1D23',
        createdBy: 'user-1',
      });
      expect(result).toMatchObject({ id: '1', licensePlate: 'ABC1D23' });
    });

    it('aggregates all conflicts (plate, chassis and renavam) in the exception', async () => {
      repository.existsBy!.mockResolvedValue(true);

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

    it('reports only the field that is actually duplicated', async () => {
      repository.existsBy!.mockImplementation(
        (where: { licensePlate?: string }) =>
          Promise.resolve(Boolean(where.licensePlate)),
      );

      try {
        await service.create(dto);
        fail('should have thrown ConflictException');
      } catch (err) {
        const response = (err as ConflictException).getResponse() as {
          conflicts: string[];
        };
        expect(response.conflicts).toHaveLength(1);
        expect(response.conflicts[0]).toContain('placa');
      }
    });
  });

  describe('update / remove (cache invalidation)', () => {
    it('update invalidates the item and the list', async () => {
      repository.findOneBy!.mockResolvedValue({ id: '1' });
      repository.save!.mockImplementation((e: Partial<Vehicle>) =>
        Promise.resolve(e),
      );

      await service.update('1', { year: 2023 });

      expect(redis.del).toHaveBeenCalledWith('vehicles:item:1');
      expect(redis.delByPattern).toHaveBeenCalledWith('vehicles:list:*');
      expect(client.emit).toHaveBeenCalledWith(EventPatterns.VEHICLE_UPDATED, {
        id: '1',
      });
    });

    it('remove invalidates the item and the list', async () => {
      repository.findOneBy!.mockResolvedValue({ id: '1' });

      await service.remove('1');

      expect(repository.remove).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith('vehicles:item:1');
      expect(redis.delByPattern).toHaveBeenCalledWith('vehicles:list:*');
      expect(client.emit).toHaveBeenCalledWith(EventPatterns.VEHICLE_DELETED, {
        id: '1',
      });
    });
  });
});
