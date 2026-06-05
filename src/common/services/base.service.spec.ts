import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { BaseService } from './base.service';
import { BaseEntity } from '../entities/base.entity';
import {
  createMockRepository,
  MockRepository,
} from '../testing/mock-repository';

class TestEntity extends BaseEntity {
  name!: string;
}

class TestService extends BaseService<TestEntity> {
  constructor(repository: Repository<TestEntity>) {
    super(repository, 'TestEntity');
  }
}

const dbError = (number?: number): QueryFailedError =>
  new QueryFailedError('query', [], { number } as unknown as Error);

describe('BaseService', () => {
  let repository: MockRepository<TestEntity>;
  let service: TestService;

  beforeEach(() => {
    repository = createMockRepository<TestEntity>();
    service = new TestService(repository as unknown as Repository<TestEntity>);
  });

  describe('findAll', () => {
    it('forwards the options to repository.find and returns the result', async () => {
      const rows = [{ id: '1' }] as TestEntity[];
      repository.find!.mockResolvedValue(rows);

      const result = await service.findAll({ where: { name: 'a' } as never });

      expect(repository.find).toHaveBeenCalledWith({
        where: { name: 'a' },
      });
      expect(result).toBe(rows);
    });
  });

  describe('paginate', () => {
    it('computes skip/take and the pagination metadata', async () => {
      repository.findAndCount!.mockResolvedValue([[{ id: '1' }], 25]);

      const result = await service.paginate({ page: 2, limit: 10 });

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
      });
      expect(result.meta).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
    });

    it('applies the defaults (page=1, limit=1000) when not provided', async () => {
      repository.findAndCount!.mockResolvedValue([[], 0]);

      await service.paginate({} as never);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 1000,
      });
    });
  });

  describe('findOne', () => {
    it('returns the entity when found', async () => {
      const entity = { id: '1' } as TestEntity;
      repository.findOne!.mockResolvedValue(entity);

      await expect(service.findOne('1')).resolves.toBe(entity);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('throws NotFoundException when not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('99')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('99')).rejects.toThrow(
        'TestEntity #99 não encontrado',
      );
    });
  });

  describe('update', () => {
    it('loads, applies the dto and saves the entity', async () => {
      const entity = { id: '1', name: 'old' } as TestEntity;
      repository.findOneBy!.mockResolvedValue(entity);
      repository.save!.mockImplementation((e) => Promise.resolve(e));

      const result = await service.update('1', { name: 'new' });

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: '1' });
      expect(repository.save).toHaveBeenCalledWith({ id: '1', name: 'new' });
      expect(result.name).toBe('new');
    });

    it('throws NotFoundException when the entity does not exist', async () => {
      repository.findOneBy!.mockResolvedValue(null);

      await expect(service.update('1', { name: 'x' })).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('loads and removes the entity', async () => {
      const entity = { id: '1' } as TestEntity;
      repository.findOneBy!.mockResolvedValue(entity);

      await service.remove('1');

      expect(repository.remove).toHaveBeenCalledWith(entity);
    });

    it('throws NotFoundException when the entity does not exist', async () => {
      repository.findOneBy!.mockResolvedValue(null);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('handleDbError (database error translation)', () => {
    beforeEach(() => {
      repository.findOneBy!.mockResolvedValue({ id: '1' });
    });

    it.each([2627, 2601])(
      'maps a unique key violation (%i) to ConflictException',
      async (number) => {
        repository.save!.mockRejectedValue(dbError(number));

        await expect(service.update('1', {})).rejects.toThrow(
          ConflictException,
        );
      },
    );

    it('maps a FK violation (547) to BadRequestException', async () => {
      repository.save!.mockRejectedValue(dbError(547));

      await expect(service.update('1', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('maps a NULL into a required column (515) to BadRequestException', async () => {
      repository.save!.mockRejectedValue(dbError(515));

      await expect(service.update('1', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rethrows a QueryFailedError with an unknown number', async () => {
      const error = dbError(9999);
      repository.save!.mockRejectedValue(error);

      await expect(service.update('1', {})).rejects.toBe(error);
    });

    it('rethrows errors that are not QueryFailedError', async () => {
      const error = new Error('generic error');
      repository.save!.mockRejectedValue(error);

      await expect(service.update('1', {})).rejects.toBe(error);
    });
  });
});
