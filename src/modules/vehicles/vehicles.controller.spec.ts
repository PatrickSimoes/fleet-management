import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import type { JwtPayload } from '../auth/interface/jwt-payload.interface';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let service: jest.Mocked<
    Pick<
      VehiclesService,
      'create' | 'paginate' | 'findOne' | 'update' | 'remove'
    >
  >;

  const user: JwtPayload = { sub: 'user-1', username: 'John' };

  const dto = {
    licensePlate: 'ABC1D23',
    chassis: '9BWZZZ377VT004251',
    renavam: '12345678901',
    year: 2022,
    modelId: 'model-1',
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      paginate: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [{ provide: VehiclesService, useValue: service }],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('create forwards the dto and the authenticated user id', async () => {
    await controller.create(dto, user);
    expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('findAll forwards the pagination query', async () => {
    const query = { page: 1, limit: 10 };
    await controller.findAll(query);
    expect(service.paginate).toHaveBeenCalledWith(query);
  });

  it('findOne forwards the id', async () => {
    await controller.findOne('1');
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('update forwards the id and dto', async () => {
    await controller.update('1', { year: 2023 });
    expect(service.update).toHaveBeenCalledWith('1', { year: 2023 });
  });

  it('remove forwards the id', async () => {
    await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith('1');
  });
});
