import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

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

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    it('returns an access_token when email and password are valid', async () => {
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

    it('throws UnauthorizedException when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.signIn('x@x.com', 'p')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the password is incorrect', async () => {
      usersService.findByEmail.mockResolvedValue(user);
      mockedCompare.mockResolvedValue(false);

      await expect(service.signIn('john@example.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});
