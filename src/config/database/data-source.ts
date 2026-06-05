import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Brand } from '../../modules/brands/entities/brand.entity';
import { Model } from '../../modules/models/entities/model.entity';
import { Vehicle } from '../../modules/vehicles/entities/vehicle.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'mssql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 1433),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Brand, Model, Vehicle],
  migrations: ['src/config/database/migrations/*.ts'],
  synchronize: false,
  options: {
    encrypt: false,
  },
};

export default new DataSource(dataSourceOptions);
