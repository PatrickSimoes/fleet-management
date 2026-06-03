import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}
