import {
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { User } from '../../modules/users/entities/user.entity';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updatedAt!: Date;

  @Column({ name: 'created_by', type: 'uniqueidentifier', nullable: true })
  createdBy!: string | null;

  @ManyToOne('User')
  @JoinColumn({ name: 'created_by' })
  createdByUser!: User | null;
}
