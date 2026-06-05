import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import type { JwtPayload } from '../auth/interface/jwt-payload.interface';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<
    Pick<UsersService, 'create' | 'paginate' | 'findOne' | 'update' | 'remove'>
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
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('create forwards the dto and the authenticated user id as createdBy', async () => {
    const dto = {
      nickname: 'jdoe',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'plain-password',
    };
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
    await controller.update('1', { name: 'Jane' });
    expect(service.update).toHaveBeenCalledWith('1', { name: 'Jane' });
  });

  it('remove forwards the id', async () => {
    await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith('1');
  });
});
