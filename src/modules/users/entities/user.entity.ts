import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column()
  nickname!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;
}
