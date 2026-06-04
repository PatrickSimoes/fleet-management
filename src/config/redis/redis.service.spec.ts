import type Redis from 'ioredis';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let client: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    scanStream: jest.Mock;
    quit: jest.Mock;
  };
  let service: RedisService;

  beforeEach(() => {
    client = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      scanStream: jest.fn(),
      quit: jest.fn(),
    };
    service = new RedisService(client as unknown as Redis);
  });

  describe('get', () => {
    it('desserializa o JSON quando há valor', async () => {
      client.get.mockResolvedValue(JSON.stringify({ a: 1 }));

      await expect(service.get('k')).resolves.toEqual({ a: 1 });
      expect(client.get).toHaveBeenCalledWith('k');
    });

    it('retorna null quando a chave não existe', async () => {
      client.get.mockResolvedValue(null);

      await expect(service.get('k')).resolves.toBeNull();
    });
  });

  describe('set', () => {
    it('serializa e aplica TTL com EX quando informado', async () => {
      await service.set('k', { a: 1 }, 60);

      expect(client.set).toHaveBeenCalledWith(
        'k',
        JSON.stringify({ a: 1 }),
        'EX',
        60,
      );
    });

    it('persiste sem expiração quando o TTL é ausente ou zero', async () => {
      await service.set('k', { a: 1 });
      expect(client.set).toHaveBeenCalledWith('k', JSON.stringify({ a: 1 }));

      await service.set('k', { a: 1 }, 0);
      expect(client.set).toHaveBeenLastCalledWith(
        'k',
        JSON.stringify({ a: 1 }),
      );
    });
  });

  describe('del', () => {
    it('remove as chaves informadas', async () => {
      await service.del('a', 'b');
      expect(client.del).toHaveBeenCalledWith('a', 'b');
    });

    it('não chama o client quando não há chaves', async () => {
      await service.del();
      expect(client.del).not.toHaveBeenCalled();
    });
  });

  describe('delByPattern', () => {
    // Simula o scanStream do ioredis como um async iterable de lotes de chaves.
    const streamOf = (batches: string[][]) =>
      (async function* () {
        for (const batch of batches) {
          await Promise.resolve();
          yield batch;
        }
      })();

    it('varre o padrão e remove todas as chaves encontradas', async () => {
      client.scanStream.mockReturnValue(streamOf([['k1', 'k2'], ['k3']]));

      await service.delByPattern('prefix:*');

      expect(client.scanStream).toHaveBeenCalledWith({
        match: 'prefix:*',
        count: 100,
      });
      expect(client.del).toHaveBeenCalledWith('k1', 'k2', 'k3');
    });

    it('não chama del quando nenhuma chave casa o padrão', async () => {
      client.scanStream.mockReturnValue(streamOf([[]]));

      await service.delByPattern('prefix:*');

      expect(client.del).not.toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('encerra a conexão com o Redis', () => {
      service.onModuleDestroy();
      expect(client.quit).toHaveBeenCalled();
    });
  });
});
