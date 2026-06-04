import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const logger = new Logger('Redis');
        const client = new Redis({
          host: config.get<string>('REDIS_HOST'),
          port: Number(config.get<number>('REDIS_PORT', 6379)),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          maxRetriesPerRequest: 3,
        });

        client.on('connect', () => logger.log('Conectado ao Redis'));
        client.on('error', (err) =>
          logger.error(`Erro no Redis: ${err.message}`, err.stack),
        );

        return client;
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
