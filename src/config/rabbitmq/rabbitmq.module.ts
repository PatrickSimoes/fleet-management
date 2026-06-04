import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  FLEET_DLQ,
  FLEET_DLX,
  FLEET_QUEUE,
  FLEET_SERVICE,
} from './rabbitmq.constants';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: FLEET_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URI') as string],
            queue: FLEET_QUEUE,
            queueOptions: {
              durable: true,
              deadLetterExchange: FLEET_DLX,
              deadLetterRoutingKey: FLEET_DLQ,
            },
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class RabbitmqModule {}
