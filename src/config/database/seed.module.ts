import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database.module';
import { User } from '../../modules/users/entities/user.entity';
import { Brand } from '../../modules/brands/entities/brand.entity';
import { Model } from '../../modules/models/entities/model.entity';
import { Vehicle } from '../../modules/vehicles/entities/vehicle.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    TypeOrmModule.forFeature([User, Brand, Model, Vehicle]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
