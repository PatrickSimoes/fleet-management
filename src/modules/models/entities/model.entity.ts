import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Brand } from '../../brands/entities/brand.entity';

@Entity('models')
export class Model extends BaseEntity {
  @Column()
  name!: string;

  @Column({ name: 'brand_id' })
  brandId!: string;

  @ManyToOne(() => Brand, (brand) => brand.models)
  @JoinColumn({ name: 'brand_id' })
  brand!: Brand;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.model)
  vehicles!: Vehicle[];
}
