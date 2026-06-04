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

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { name: 'Corolla', brandId: 'brand-1' };

    it('cria o modelo quando o par (marca, nome) é único', async () => {
      repository.existsBy!.mockResolvedValue(false);
      repository.create!.mockImplementation((d: Partial<Model>) => d);
      repository.save!.mockImplementation((e: Partial<Model>) =>
        Promise.resolve({ id: '1', ...e }),
      );

      const result = await service.create(dto, 'user-1');

      // A unicidade é por marca + nome, não só por nome.
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

    it('lança ConflictException quando já existe o modelo na mesma marca', async () => {
      repository.existsBy!.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        "Modelo 'Corolla' já existe nesta marca",
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('não checa duplicidade se faltar name ou brandId', async () => {
      repository.create!.mockImplementation((d: Partial<Model>) => d);
      repository.save!.mockImplementation((e: Partial<Model>) =>
        Promise.resolve(e),
      );

      await service.create({ name: 'Corolla' }); // sem brandId

      expect(repository.existsBy).not.toHaveBeenCalled();
    });
  });
});
