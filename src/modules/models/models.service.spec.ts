import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ModelsService } from './models.service';
import { Model } from './entities/model.entity';
import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';

describe('ModelsService', () => {
  let service: ModelsService;
  let repository: MockRepository<Model>;

  beforeEach(async () => {
    repository = createMockRepository<Model>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelsService,
        { provide: getRepositoryToken(Model), useValue: repository },
      ],
    }).compile();

    service = module.get<ModelsService>(ModelsService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { name: 'Corolla', brandId: 'brand-1' };

    it('creates the model when the (brand, name) pair is unique', async () => {
      repository.existsBy!.mockResolvedValue(false);
      repository.create!.mockImplementation((d: Partial<Model>) => d);
      repository.save!.mockImplementation((e: Partial<Model>) =>
        Promise.resolve({ id: '1', ...e }),
      );

      const result = await service.create(dto, 'user-1');

      expect(repository.existsBy).toHaveBeenCalledWith({
        name: 'Corolla',
        brandId: 'brand-1',
      });
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        createdBy: 'user-1',
      });
      expect(result).toMatchObject({ id: '1', ...dto });
    });

    it('throws ConflictException when the model already exists in the same brand', async () => {
      repository.existsBy!.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        "Modelo 'Corolla' já existe nesta marca",
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('does not check duplication when name or brandId is missing', async () => {
      repository.create!.mockImplementation((d: Partial<Model>) => d);
      repository.save!.mockImplementation((e: Partial<Model>) =>
        Promise.resolve(e),
      );

      await service.create({ name: 'Corolla' });

      expect(repository.existsBy).not.toHaveBeenCalled();
    });
  });
});
