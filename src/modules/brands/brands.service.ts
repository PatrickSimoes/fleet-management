import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { BaseService } from '../../common/services/base.service';

@Injectable()
export class BrandsService extends BaseService<Brand> {
  constructor(
    @InjectRepository(Brand)
    repository: Repository<Brand>,
  ) {
    super(repository, 'Brand');
  }

  async create(dto: DeepPartial<Brand>, createdBy?: string): Promise<Brand> {
    if (dto.name && (await this.repository.existsBy({ name: dto.name }))) {
      throw new ConflictException(`Marca '${dto.name}' já existe`);
    }

    try {
      const brand = this.repository.create({ ...dto, createdBy });
      return await this.repository.save(brand);
    } catch (error) {
      this.handleDbError(error);
    }
  }
}
