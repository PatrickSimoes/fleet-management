import type { Repository } from 'typeorm';

export type MockRepository<T extends object = Record<string, unknown>> =
  Partial<Record<keyof Repository<T>, jest.Mock>>;

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
