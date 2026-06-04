import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeedService, SeedVehicle } from './seed.service';
import { User } from '../modules/users/entities/user.entity';
import { Brand } from '../modules/brands/entities/brand.entity';
import { Model } from '../modules/models/entities/model.entity';
import { Vehicle } from '../modules/vehicles/entities/vehicle.entity';
import {
  createMockRepository,
  MockRepository,
} from '../common/testing/mock-repository';

describe('SeedService', () => {
  let service: SeedService;
  let users: MockRepository<User>;
  let brands: MockRepository<Brand>;
  let models: MockRepository<Model>;
  let vehicles: MockRepository<Vehicle>;

  const seed: SeedVehicle[] = [
    {
      brand: 'Volkswagen',
      model: 'Gol',
      licensePlate: 'ABC1D23',
      chassis: '9BWZZZ377VT004251',
      renavam: '12345678901',
      year: 2022,
      color: 'Branco',
    },
    {
      brand: 'Volkswagen',
      model: 'Saveiro',
      licensePlate: 'DEF2G45',
      chassis: '9BWAB45Z8MP100200',
      renavam: '23456789012',
      year: 2021,
      color: 'Prata',
    },
  ];

  beforeEach(async () => {
    users = createMockRepository<User>();
    brands = createMockRepository<Brand>();
    models = createMockRepository<Model>();
    vehicles = createMockRepository<Vehicle>();

    [users, brands, models, vehicles].forEach((repo) => {
      repo.create!.mockImplementation((e: Record<string, unknown>) => e);
      repo.save!.mockImplementation((e: Record<string, unknown>) =>
        Promise.resolve({ id: `${(e.name as string) ?? 'id'}-id`, ...e }),
      );
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: getRepositoryToken(User), useValue: users },
        { provide: getRepositoryToken(Brand), useValue: brands },
        { provide: getRepositoryToken(Model), useValue: models },
        { provide: getRepositoryToken(Vehicle), useValue: vehicles },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('numa base vazia', () => {
    beforeEach(() => {
      users.findOne!.mockResolvedValue(null);
      brands.findOneBy!.mockResolvedValue(null);
      models.findOneBy!.mockResolvedValue(null);
      vehicles.existsBy!.mockResolvedValue(false);
    });

    it('cria o usuário aivacol com a senha hasheada', async () => {
      await service.run(seed);

      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ nickname: 'aivacol' }),
      );
      const calls = users.create!.mock.calls as Array<[{ password: string }]>;
      const createArg = calls[0][0];
      expect(createArg.password).not.toBe('aivacol');
      expect(createArg.password).toMatch(/^\$2[aby]\$/);
    });

    it('cria a marca uma única vez mesmo com dois modelos da mesma marca', async () => {
      const persisted: Record<string, Brand> = {};
      brands.findOneBy!.mockImplementation((where: { name: string }) =>
        Promise.resolve(persisted[where.name] ?? null),
      );
      brands.save!.mockImplementation((b: Brand) => {
        const saved = { ...b, id: 'brand-id' };
        persisted[b.name] = saved;
        return Promise.resolve(saved);
      });

      await service.run(seed);

      expect(brands.save).toHaveBeenCalledTimes(1);
      expect(models.save).toHaveBeenCalledTimes(2);
      expect(vehicles.save).toHaveBeenCalledTimes(2);
    });

    it('associa o veículo ao modelo e ao usuário (created_by)', async () => {
      brands.save!.mockResolvedValue({ id: 'brand-1' });
      models.save!.mockResolvedValue({ id: 'model-1' });
      users.save!.mockResolvedValue({ id: 'user-1', nickname: 'aivacol' });

      await service.run([seed[0]]);

      expect(vehicles.create).toHaveBeenCalledWith(
        expect.objectContaining({
          licensePlate: 'ABC1D23',
          modelId: 'model-1',
          createdBy: 'user-1',
        }),
      );
    });
  });

  describe('idempotência (base já populada)', () => {
    it('não recria usuário, marcas, modelos nem veículos existentes', async () => {
      users.findOne!.mockResolvedValue({ id: 'user-1', nickname: 'aivacol' });
      brands.findOneBy!.mockResolvedValue({ id: 'brand-1' });
      models.findOneBy!.mockResolvedValue({ id: 'model-1' });
      vehicles.existsBy!.mockResolvedValue(true);

      await service.run(seed);

      expect(users.save).not.toHaveBeenCalled();
      expect(brands.save).not.toHaveBeenCalled();
      expect(models.save).not.toHaveBeenCalled();
      expect(vehicles.save).not.toHaveBeenCalled();
    });
  });
});
