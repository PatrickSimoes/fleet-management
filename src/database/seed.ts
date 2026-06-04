import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService, SeedVehicle } from './seed.service';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const file = join(process.cwd(), 'seed_vehicles.json');
    const seedVehicles = JSON.parse(
      readFileSync(file, 'utf-8'),
    ) as SeedVehicle[];

    await app.get(SeedService).run(seedVehicles);
  } catch (error) {
    logger.error('Falha ao executar o seed', (error as Error).stack);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void bootstrap();
