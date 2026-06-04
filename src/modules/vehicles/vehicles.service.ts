import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService extends BaseService<Vehicle> {
  constructor(
    @InjectRepository(Vehicle)
    repository: Repository<Vehicle>,
  ) {
    super(repository, 'Vehicle');
  }

  async create(
    dto: DeepPartial<Vehicle>,
    createdBy?: string,
  ): Promise<Vehicle> {
    const conflicts = await this.findConflicts(dto);
    if (conflicts.length > 0) {
      throw new ConflictException({
        message: 'Veículo com dados duplicados',
        conflicts,
      });
    }

    try {
      const vehicle = this.repository.create({ ...dto, createdBy });
      return await this.repository.save(vehicle);
    } catch (error) {
      this.handleDbError(error);
    }
  }

  /** Checa em paralelo os campos únicos e devolve a lista do que já está em uso. */
  private async findConflicts(dto: DeepPartial<Vehicle>): Promise<string[]> {
    const checks: Promise<string | null>[] = [];

    if (dto.licensePlate) {
      const value = dto.licensePlate;
      checks.push(
        this.repository
          .existsBy({ licensePlate: value })
          .then((used) => (used ? `placa '${value}' já está em uso` : null)),
      );
    }
    if (dto.chassis) {
      const value = dto.chassis;
      checks.push(
        this.repository
          .existsBy({ chassis: value })
          .then((used) => (used ? `chassi '${value}' já está em uso` : null)),
      );
    }
    if (dto.renavam) {
      const value = dto.renavam;
      checks.push(
        this.repository
          .existsBy({ renavam: value })
          .then((used) => (used ? `renavam '${value}' já está em uso` : null)),
      );
    }

    const results = await Promise.all(checks);
    return results.filter((conflict): conflict is string => conflict !== null);
  }
}
