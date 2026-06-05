import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/users/entities/user.entity';
import { Brand } from '../../modules/brands/entities/brand.entity';
import { Model } from '../../modules/models/entities/model.entity';
import { Vehicle } from '../../modules/vehicles/entities/vehicle.entity';

export interface SeedVehicle {
  brand: string;
  model: string;
  licensePlate: string;
  chassis: string;
  renavam: string;
  year: number;
  color: string;
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Brand) private readonly brands: Repository<Brand>,
    @InjectRepository(Model) private readonly models: Repository<Model>,
    @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
  ) {}

  async run(seedVehicles: SeedVehicle[]): Promise<void> {
    const user = await this.seedUser();

    let created = 0;
    let skipped = 0;
    for (const entry of seedVehicles) {
      const brand = await this.upsertBrand(entry.brand, user.id);
      const model = await this.upsertModel(entry.model, brand.id, user.id);
      const wasCreated = await this.upsertVehicle(entry, model.id, user.id);
      if (wasCreated) {
        created++;
      } else {
        skipped++;
      }
    }

    this.logger.log(
      `Seed concluído: usuário '${user.nickname}', ${created} veículo(s) criado(s), ${skipped} já existente(s).`,
    );
  }

  private async seedUser(): Promise<User> {
    const email = process.env.SEED_USER_EMAIL ?? 'aivacol@aivacol.com.br';

    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      this.logger.log(`Usuário '${existing.nickname}' já existe.`);
      return existing;
    }

    const password = await bcrypt.hash(
      process.env.SEED_USER_PASSWORD ?? 'aivacol',
      10,
    );
    const user = this.users.create({
      nickname: 'aivacol',
      name: 'Aivacol',
      email,
      password,
    });
    return this.users.save(user);
  }

  private async upsertBrand(name: string, createdBy: string): Promise<Brand> {
    const existing = await this.brands.findOneBy({ name });
    if (existing) {
      return existing;
    }
    return this.brands.save(this.brands.create({ name, createdBy }));
  }

  private async upsertModel(
    name: string,
    brandId: string,
    createdBy: string,
  ): Promise<Model> {
    const existing = await this.models.findOneBy({ name, brandId });
    if (existing) {
      return existing;
    }
    return this.models.save(this.models.create({ name, brandId, createdBy }));
  }

  private async upsertVehicle(
    entry: SeedVehicle,
    modelId: string,
    createdBy: string,
  ): Promise<boolean> {
    const exists = await this.vehicles.existsBy({
      licensePlate: entry.licensePlate,
    });
    if (exists) {
      return false;
    }

    await this.vehicles.save(
      this.vehicles.create({
        licensePlate: entry.licensePlate,
        chassis: entry.chassis,
        renavam: entry.renavam,
        year: entry.year,
        color: entry.color,
        modelId,
        createdBy,
      }),
    );
    return true;
  }
}
