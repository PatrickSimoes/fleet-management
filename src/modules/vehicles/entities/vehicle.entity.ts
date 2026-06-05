import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Model } from '../../models/entities/model.entity';

@Entity('vehicles')
export class Vehicle extends BaseEntity {
  @Column({ name: 'license_plate', unique: true })
  licensePlate!: string;

  @Column({ name: 'chassis', unique: true })
  chassis!: string;

  @Column({ name: 'renavam', unique: true })
  renavam!: string;

  @Column({ name: 'year' })
  year!: number;

  @Index()
  @Column({ name: 'model_id' })
  modelId!: string;

  @ManyToOne(() => Model, (model) => model.vehicles)
  @JoinColumn({ name: 'model_id' })
  model!: Model;
}
