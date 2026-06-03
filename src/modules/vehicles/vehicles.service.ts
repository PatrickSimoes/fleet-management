import { Injectable } from '@nestjs/common';
import { BaseService } from '../../common/services/base.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VehiclesService extends BaseService<Vehicle> {
  constructor(
    @InjectRepository(Vehicle)
    repository: Repository<Vehicle>,
  ) {
    super(repository, 'Vehicle');
  }
}
