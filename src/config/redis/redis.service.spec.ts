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
    it('deserializes the JSON when a value exists', async () => {
      client.get.mockResolvedValue(JSON.stringify({ a: 1 }));

      await expect(service.get('k')).resolves.toEqual({ a: 1 });
      expect(client.get).toHaveBeenCalledWith('k');
    });

    it('returns null when the key does not exist', async () => {
      client.get.mockResolvedValue(null);

      await expect(service.get('k')).resolves.toBeNull();
    });
  });

  describe('set', () => {
    it('serializes and applies TTL with EX when provided', async () => {
      await service.set('k', { a: 1 }, 60);

      expect(client.set).toHaveBeenCalledWith(
        'k',
        JSON.stringify({ a: 1 }),
        'EX',
        60,
      );
    });

    it('persists without expiration when the TTL is missing or zero', async () => {
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
    it('removes the provided keys', async () => {
      await service.del('a', 'b');
      expect(client.del).toHaveBeenCalledWith('a', 'b');
    });

    it('does not call the client when there are no keys', async () => {
      await service.del();
      expect(client.del).not.toHaveBeenCalled();
    });
  });

  describe('delByPattern', () => {
    const streamOf = (batches: string[][]) =>
      (async function* () {
        for (const batch of batches) {
          await Promise.resolve();
          yield batch;
        }
      })();

    it('scans the pattern and removes every matched key', async () => {
      client.scanStream.mockReturnValue(streamOf([['k1', 'k2'], ['k3']]));

      await service.delByPattern('prefix:*');

      expect(client.scanStream).toHaveBeenCalledWith({
        match: 'prefix:*',
        count: 100,
      });
      expect(client.del).toHaveBeenCalledWith('k1', 'k2', 'k3');
    });

    it('does not call del when no key matches the pattern', async () => {
      client.scanStream.mockReturnValue(streamOf([[]]));

      await service.delByPattern('prefix:*');

      expect(client.del).not.toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('closes the Redis connection', () => {
      service.onModuleDestroy();
      expect(client.quit).toHaveBeenCalled();
    });
  });
});
