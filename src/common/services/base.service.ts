import { NotFoundException } from '@nestjs/common';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { BaseEntity } from '../entities/base.entity';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResult } from '../dto/paginated-result.interface';

export abstract class BaseService<
  T extends BaseEntity & { id: string | number },
> {
  protected constructor(
    protected readonly repository: Repository<T>,
    protected readonly entityName: string,
  ) {}

  async create(dto: DeepPartial<T>, createdBy: string): Promise<T> {
    const entity = this.repository.create({
      ...dto,
      createdBy,
    } as DeepPartial<T>);
    return this.repository.save(entity);
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async paginate(
    { page = 1, limit = 1000 }: PaginationQueryDto,
    options?: FindManyOptions<T>,
  ): Promise<PaginatedResult<T>> {
    const [data, total] = await this.repository.findAndCount({
      ...options,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: T['id'], options?: FindOneOptions<T>): Promise<T> {
    const entity = await this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
      ...options,
    });

    if (!entity) {
      throw new NotFoundException(`${this.entityName} #${id} não encontrado`);
    }

    return entity;
  }

  async update(id: T['id'], dto: DeepPartial<T>): Promise<T> {
    const entity = await this.findOne(id);

    Object.assign(entity, dto);

    return this.repository.save(entity);
  }

  async remove(id: T['id']): Promise<void> {
    const entity = await this.findOne(id);
    await this.repository.remove(entity);
  }
}
