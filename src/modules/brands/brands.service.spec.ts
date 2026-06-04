import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import { BrandsService } from './brands.service';
import { Brand } from './entities/brand.entity';
import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';

describe('BrandsService', () => {
  let service: BrandsService;
  let repository: MockRepository<Brand>;

  beforeEach(async () => {
    repository = createMockRepository<Brand>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: getRepositoryToken(Brand), useValue: repository },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('cria a marca quando o nome ainda não existe', async () => {
      repository.existsBy!.mockResolvedValue(false);
      repository.create!.mockImplementation((d: Partial<Brand>) => d);
      repository.save!.mockImplementation((e: Partial<Brand>) =>
        Promise.resolve({ id: '1', ...e }),
      );

      const result = await service.create({ name: 'Toyota' }, 'user-1');

      expect(repository.existsBy).toHaveBeenCalledWith({ name: 'Toyota' });
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Toyota',
        createdBy: 'user-1',
      });
      expect(result).toEqual({ id: '1', name: 'Toyota', createdBy: 'user-1' });
    });

    it('lança ConflictException quando o nome já existe (regra de negócio)', async () => {
      repository.existsBy!.mockResolvedValue(true);

      await expect(service.create({ name: 'Toyota' })).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create({ name: 'Toyota' })).rejects.toThrow(
        "Marca 'Toyota' já existe",
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('não checa duplicidade quando o nome não é informado', async () => {
      repository.create!.mockImplementation((d: Partial<Brand>) => d);
      repository.save!.mockImplementation((e: Partial<Brand>) =>
        Promise.resolve(e),
      );

      await service.create({});

      expect(repository.existsBy).not.toHaveBeenCalled();
    });

    it('traduz erro de chave única do banco em ConflictException', async () => {
      repository.existsBy!.mockResolvedValue(false);
      repository.create!.mockImplementation((d: Partial<Brand>) => d);
      repository.save!.mockRejectedValue(
        new QueryFailedError('q', [], { number: 2627 } as unknown as Error),
      );

      await expect(service.create({ name: 'Honda' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  it('expõe os métodos herdados de BaseService', () => {
    expect(typeof service.findAll).toBe('function');
    expect(typeof service.paginate).toBe('function');
    expect(typeof service.findOne).toBe('function');
    expect(typeof service.update).toBe('function');
    expect(typeof service.remove).toBe('function');
  });
});
