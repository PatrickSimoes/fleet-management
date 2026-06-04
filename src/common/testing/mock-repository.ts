import type { Repository } from 'typeorm';

/** Mock tipado de um Repository do TypeORM (apenas os métodos usados nos serviços). */
export type MockRepository<T extends object = Record<string, unknown>> =
  Partial<Record<keyof Repository<T>, jest.Mock>>;

/** Cria um repositório falso com os métodos mais usados já mockados. */
export const createMockRepository = <
  T extends object = Record<string, unknown>,
>(): MockRepository<T> => ({
  find: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  existsBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});
