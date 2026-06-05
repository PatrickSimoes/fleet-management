import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: { signIn: jest.Mock };

  beforeEach(async () => {
    service = { signIn: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('signIn forwards email and password to AuthService and returns the token', async () => {
    service.signIn.mockResolvedValue({ access_token: 'jwt' });

    const result = await controller.signIn({
      email: 'john@example.com',
      password: 'plain',
    });

    expect(service.signIn).toHaveBeenCalledWith('john@example.com', 'plain');
    expect(result).toEqual({ access_token: 'jwt' });
  });
});
