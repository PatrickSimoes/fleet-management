import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Model } from '../../models/entities/model.entity';

@Entity('vehicles')
export class Vehicle extends BaseEntity {
  @Column({ name: 'license_plate' })
  licensePlate!: string;

  @Column({ name: 'chassis' })
  chassis!: string;

  @Column({ name: 'renavam' })
  renavam!: string;

  @Column({ name: 'year' })
  year!: number;

  @Column({ name: 'color' })
  color!: string;

  @Column({ name: 'model_id' })
  modelId!: string;

  @ManyToOne(() => Model, (model) => model.vehicles)
  @JoinColumn({ name: 'model_id' })
  model!: Model;
}
