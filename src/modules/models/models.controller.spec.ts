import { Test, TestingModule } from '@nestjs/testing';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';
import type { JwtPayload } from '../auth/interface/jwt-payload.interface';

describe('ModelsController', () => {
  let controller: ModelsController;
  let service: jest.Mocked<
    Pick<ModelsService, 'create' | 'paginate' | 'findOne' | 'update' | 'remove'>
  >;

  const user: JwtPayload = { sub: 'user-1', username: 'John' };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      paginate: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModelsController],
      providers: [{ provide: ModelsService, useValue: service }],
    }).compile();

    controller = module.get<ModelsController>(ModelsController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('create repassa o dto e o id do usuário autenticado', async () => {
    const dto = { name: 'Corolla', brandId: 'brand-1' };
    await controller.create(dto, user);
    expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('findAll repassa a query de paginação', async () => {
    const query = { page: 2, limit: 5 };
    await controller.findAll(query);
    expect(service.paginate).toHaveBeenCalledWith(query);
  });

  it('findOne repassa o id', async () => {
    await controller.findOne('1');
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('update repassa id e dto', async () => {
    await controller.update('1', { name: 'Civic' });
    expect(service.update).toHaveBeenCalledWith('1', { name: 'Civic' });
  });

  it('remove repassa o id', async () => {
    await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith('1');
  });
});
