import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('brands')
export class Brand extends BaseEntity {
  @Column()
  name!: string;
}
