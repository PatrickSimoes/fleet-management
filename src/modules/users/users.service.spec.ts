import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';

// bcrypt expõe propriedades não-configuráveis, então mockamos o módulo inteiro.
jest.mock('bcrypt', () => ({ hash: jest.fn() }));
const mockedHash = bcrypt.hash as jest.Mock;

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockRepository<User>;

  const baseDto = {
    nickname: 'jdoe',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'plain-password',
  };

  beforeEach(async () => {
    repository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('faz hash da senha e não devolve o hash na resposta (regra de negócio)', async () => {
      repository.existsBy!.mockResolvedValue(false);
      mockedHash.mockResolvedValue('hashed-password');
      repository.create!.mockImplementation((d: Partial<User>) => d);
      repository.save!.mockImplementation((e: Partial<User>) =>
        Promise.resolve({ id: '1', ...e }),
      );

      const result = await service.create(baseDto, 'creator-1');

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 10);
      // a senha (hash) NÃO deve voltar na resposta
      expect(result).not.toHaveProperty('password');
      expect(result).toMatchObject({
        id: '1',
        email: 'john@example.com',
        createdBy: 'creator-1',
      });
      // mas o que foi persistido contém o hash, não a senha em texto puro
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed-password' }),
      );
    });

    it('lança ConflictException quando o email já existe', async () => {
      repository.existsBy!.mockResolvedValue(true);

      await expect(service.create(baseDto)).rejects.toThrow(ConflictException);
      await expect(service.create(baseDto)).rejects.toThrow(
        "Usuário com email 'john@example.com' já existe",
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('busca o usuário incluindo o campo password (select:false por padrão)', async () => {
      const user = { id: '1', email: 'john@example.com' } as User;
      repository.findOne!.mockResolvedValue(user);

      const result = await service.findByEmail('john@example.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
        select: {
          id: true,
          name: true,
          nickname: true,
          email: true,
          password: true,
        },
      });
      expect(result).toBe(user);
    });
  });
});
