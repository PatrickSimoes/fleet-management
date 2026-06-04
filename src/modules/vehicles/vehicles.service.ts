import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResult } from '../../common/dto/paginated-result.interface';
import { RedisService } from '../../config/redis/redis.service';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService extends BaseService<Vehicle> {
  private static readonly LIST_KEY = 'vehicles:list';
  private static readonly ITEM_KEY = 'vehicles:item';

  private readonly cacheTtl: number;

  constructor(
    @InjectRepository(Vehicle)
    repository: Repository<Vehicle>,
    private readonly redis: RedisService,
    config: ConfigService,
  ) {
    super(repository, 'Vehicle');
    this.cacheTtl = Number(config.get('REDIS_CACHE_TTL', 60));
  }

  async paginate(
    query: PaginationQueryDto,
    options?: FindManyOptions<Vehicle>,
  ): Promise<PaginatedResult<Vehicle>> {
    if (options) {
      return super.paginate(query, options);
    }

    const key = `${VehiclesService.LIST_KEY}:page=${query.page}:limit=${query.limit}`;
    const cached = await this.redis.get<PaginatedResult<Vehicle>>(key);
    if (cached) {
      return cached;
    }

    const result = await super.paginate(query);
    await this.redis.set(key, result, this.cacheTtl);
    return result;
  }

  async findOne(
    id: string,
    options?: FindOneOptions<Vehicle>,
  ): Promise<Vehicle> {
    if (options) {
      return super.findOne(id, options);
    }

    const key = `${VehiclesService.ITEM_KEY}:${id}`;
    const cached = await this.redis.get<Vehicle>(key);
    if (cached) {
      return cached;
    }

    const vehicle = await super.findOne(id);
    await this.redis.set(key, vehicle, this.cacheTtl);
    return vehicle;
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
      const saved = await this.repository.save(vehicle);
      await this.invalidateListCache();
      return saved;
    } catch (error) {
      this.handleDbError(error);
    }
  }

  async update(id: string, dto: DeepPartial<Vehicle>): Promise<Vehicle> {
    const vehicle = await super.update(id, dto);
    await this.invalidateCache(id);
    return vehicle;
  }

  async remove(id: string): Promise<void> {
    await super.remove(id);
    await this.invalidateCache(id);
  }

  /** Invalida o item específico e todas as páginas de listagem. */
  private async invalidateCache(id: string): Promise<void> {
    await Promise.all([
      this.redis.del(`${VehiclesService.ITEM_KEY}:${id}`),
      this.invalidateListCache(),
    ]);
  }

  private async invalidateListCache(): Promise<void> {
    await this.redis.delByPattern(`${VehiclesService.LIST_KEY}:*`);
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
