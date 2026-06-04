import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Model } from '../../models/entities/model.entity';

@Entity('brands')
export class Brand extends BaseEntity {
  @Column({ unique: true })
  name!: string;

  @OneToMany(() => Model, (model) => model.brand)
  models!: Model[];
}
