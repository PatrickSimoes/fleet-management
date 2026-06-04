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

// Entidade e serviço concretos só para exercitar a classe abstrata.
class TestEntity extends BaseEntity {
  name!: string;
}

class TestService extends BaseService<TestEntity> {
  constructor(repository: Repository<TestEntity>) {
    super(repository, 'TestEntity');
  }
}

/** Helper para montar um QueryFailedError com o `number` do driver mssql. */
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
    it('repassa as opções para repository.find e retorna o resultado', async () => {
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
    it('calcula skip/take e os metadados de paginação', async () => {
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

    it('aplica os defaults (page=1, limit=1000) quando não informados', async () => {
      repository.findAndCount!.mockResolvedValue([[], 0]);

      await service.paginate({} as never);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 1000,
      });
    });
  });

  describe('findOne', () => {
    it('retorna a entidade quando encontrada', async () => {
      const entity = { id: '1' } as TestEntity;
      repository.findOne!.mockResolvedValue(entity);

      await expect(service.findOne('1')).resolves.toBe(entity);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('lança NotFoundException quando não encontrada', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('99')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('99')).rejects.toThrow(
        'TestEntity #99 não encontrado',
      );
    });
  });

  describe('update', () => {
    it('carrega, aplica o dto e salva a entidade', async () => {
      const entity = { id: '1', name: 'old' } as TestEntity;
      repository.findOneBy!.mockResolvedValue(entity);
      repository.save!.mockImplementation((e) => Promise.resolve(e));

      const result = await service.update('1', { name: 'new' });

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: '1' });
      expect(repository.save).toHaveBeenCalledWith({ id: '1', name: 'new' });
      expect(result.name).toBe('new');
    });

    it('lança NotFoundException quando a entidade não existe', async () => {
      repository.findOneBy!.mockResolvedValue(null);

      await expect(service.update('1', { name: 'x' })).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('carrega e remove a entidade', async () => {
      const entity = { id: '1' } as TestEntity;
      repository.findOneBy!.mockResolvedValue(entity);

      await service.remove('1');

      expect(repository.remove).toHaveBeenCalledWith(entity);
    });

    it('lança NotFoundException quando a entidade não existe', async () => {
      repository.findOneBy!.mockResolvedValue(null);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('handleDbError (tradução de erros do banco)', () => {
    beforeEach(() => {
      repository.findOneBy!.mockResolvedValue({ id: '1' });
    });

    it.each([2627, 2601])(
      'converte violação de chave única (%i) em ConflictException',
      async (number) => {
        repository.save!.mockRejectedValue(dbError(number));

        await expect(service.update('1', {})).rejects.toThrow(
          ConflictException,
        );
      },
    );

    it('converte violação de FK (547) em BadRequestException', async () => {
      repository.save!.mockRejectedValue(dbError(547));

      await expect(service.update('1', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('converte NULL em coluna obrigatória (515) em BadRequestException', async () => {
      repository.save!.mockRejectedValue(dbError(515));

      await expect(service.update('1', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('repassa QueryFailedError com número desconhecido', async () => {
      const error = dbError(9999);
      repository.save!.mockRejectedValue(error);

      await expect(service.update('1', {})).rejects.toBe(error);
    });

    it('repassa erros que não são QueryFailedError', async () => {
      const error = new Error('erro genérico');
      repository.save!.mockRejectedValue(error);

      await expect(service.update('1', {})).rejects.toBe(error);
    });
  });
});
