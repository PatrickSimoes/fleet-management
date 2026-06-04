import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { Model } from './entities/model.entity';

@Injectable()
export class ModelsService extends BaseService<Model> {
  constructor(
    @InjectRepository(Model)
    repository: Repository<Model>,
  ) {
    super(repository, 'Model');
  }

  async create(dto: DeepPartial<Model>, createdBy?: string): Promise<Model> {
    if (
      dto.name &&
      dto.brandId &&
      (await this.repository.existsBy({ name: dto.name, brandId: dto.brandId }))
    ) {
      throw new ConflictException(`Modelo '${dto.name}' já existe nesta marca`);
    }

    try {
      const model = this.repository.create({ ...dto, createdBy });
      return await this.repository.save(model);
    } catch (error) {
      this.handleDbError(error);
    }
  }
}
