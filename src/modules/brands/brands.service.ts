import { Injectable } from '@nestjs/common';
import { Brand } from './entities/brand.entity';
import { BaseService } from '../../common/services/base.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class BrandsService extends BaseService<Brand> {
  constructor(
    @InjectRepository(Brand)
    repository: Repository<Brand>,
  ) {
    super(repository, 'Brand');
  }
}
