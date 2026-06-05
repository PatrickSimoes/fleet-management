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

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates the brand when the name does not exist yet', async () => {
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

    it('throws ConflictException when the name already exists (business rule)', async () => {
      repository.existsBy!.mockResolvedValue(true);

      await expect(service.create({ name: 'Toyota' })).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create({ name: 'Toyota' })).rejects.toThrow(
        "Marca 'Toyota' já existe",
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('does not check duplication when the name is not provided', async () => {
      repository.create!.mockImplementation((d: Partial<Brand>) => d);
      repository.save!.mockImplementation((e: Partial<Brand>) =>
        Promise.resolve(e),
      );

      await service.create({});

      expect(repository.existsBy).not.toHaveBeenCalled();
    });

    it('translates a database unique key error into ConflictException', async () => {
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

  it('exposes the methods inherited from BaseService', () => {
    expect(typeof service.findAll).toBe('function');
    expect(typeof service.paginate).toBe('function');
    expect(typeof service.findOne).toBe('function');
    expect(typeof service.update).toBe('function');
    expect(typeof service.remove).toBe('function');
  });
});
