import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { BaseEntity } from '../entities/base.entity';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResult } from '../dto/paginated-result.interface';

export abstract class BaseService<T extends BaseEntity> {
  protected constructor(
    protected readonly repository: Repository<T>,
    protected readonly entityName: string,
  ) {}

  async create(dto: DeepPartial<T>, createdBy?: string): Promise<T> {
    const entity = this.repository.create({
      ...dto,
      createdBy,
    } as DeepPartial<T>);

    try {
      return await this.repository.save(entity);
    } catch (error) {
      this.handleDbError(error);
    }
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
      ...options,
      where: { id } as FindOptionsWhere<T>,
    });

    if (!entity) {
      throw new NotFoundException(`${this.entityName} #${id} não encontrado`);
    }

    return entity;
  }

  async update(id: T['id'], dto: DeepPartial<T>): Promise<T> {
    const entity = await this.findOne(id);

    Object.assign(entity, dto);

    try {
      return await this.repository.save(entity);
    } catch (error) {
      this.handleDbError(error);
    }
  }

  async remove(id: T['id']): Promise<void> {
    const entity = await this.findOne(id);
    await this.repository.remove(entity);
  }

  /**
   * Rede de segurança: traduz erros de constraint do SQL Server em exceções
   * HTTP coerentes, evitando vazar um 500 cru com mensagem de SQL.
   * A validação "amigável" (mensagem com o valor) deve ficar em cada service.
   */
  protected handleDbError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { number?: number } | undefined;

      switch (driverError?.number) {
        case 2627: // Violation of UNIQUE/PRIMARY KEY constraint
        case 2601: // Cannot insert duplicate key row (unique index)
          throw new ConflictException(
            `${this.entityName} já existe (registro duplicado)`,
          );
        case 547: // FOREIGN KEY constraint conflict
          throw new BadRequestException(
            `Referência inválida em ${this.entityName}: relacionamento inexistente ou registro em uso`,
          );
        case 515: // Cannot insert NULL into a non-nullable column
          throw new BadRequestException(
            `Campo obrigatório não informado em ${this.entityName}`,
          );
      }
    }

    throw error;
  }
}
