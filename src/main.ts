import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { Logger, ValidationPipe } from '@nestjs/common';
import {
  FLEET_DLQ,
  FLEET_DLX,
  FLEET_QUEUE,
} from './config/rabbitmq/rabbitmq.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT ?? 3000;

  app.use(helmet());

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URI as string],
      queue: FLEET_QUEUE,
      noAck: false,
      queueOptions: {
        durable: true,
        deadLetterExchange: FLEET_DLX,
        deadLetterRoutingKey: FLEET_DLQ,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(port);

  Logger.log(`Server is running on port ${port}`);
}

void bootstrap();
