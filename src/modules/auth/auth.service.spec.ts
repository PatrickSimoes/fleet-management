import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

// bcrypt expõe propriedades não-configuráveis, então mockamos o módulo inteiro.
jest.mock('bcrypt', () => ({ compare: jest.fn() }));
const mockedCompare = bcrypt.compare as jest.Mock;
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmail: jest.Mock };
  let jwtService: { signAsync: jest.Mock };

  const user = {
    id: 'user-1',
    name: 'John',
    email: 'john@example.com',
    password: 'hashed-password',
  } as User;

  beforeEach(async () => {
    usersService = { findByEmail: jest.fn() };
    jwtService = { signAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    it('retorna um access_token quando email e senha são válidos', async () => {
      usersService.findByEmail.mockResolvedValue(user);
      mockedCompare.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('signed-jwt');

      const result = await service.signIn('john@example.com', 'plain');

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        username: 'John',
      });
      expect(result).toEqual({ access_token: 'signed-jwt' });
    });

    it('lança UnauthorizedException quando o usuário não existe', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.signIn('x@x.com', 'p')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('lança UnauthorizedException quando a senha está incorreta', async () => {
      usersService.findByEmail.mockResolvedValue(user);
      mockedCompare.mockResolvedValue(false);

      await expect(
        service.signIn('john@example.com', 'errada'),
      ).rejects.toThrow(UnauthorizedException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});
