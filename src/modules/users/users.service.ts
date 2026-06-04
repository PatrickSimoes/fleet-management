import { ConflictException, Injectable } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { BaseService } from '../../common/services/base.service';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
  ) {
    super(repository, 'User');
  }

  async create(dto: DeepPartial<User>, createdBy?: string): Promise<User> {
    if (dto.email && (await this.repository.existsBy({ email: dto.email }))) {
      throw new ConflictException(`Usuário com email '${dto.email}' já existe`);
    }

    const user = await super.create(
      { ...dto, password: await bcrypt.hash(dto.password as string, 10) },
      createdBy,
    );

    delete (user as Partial<User>).password;

    return user;
  }

  // password tem select:false, então precisa ser pedido explicitamente p/ o login
  findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        password: true,
      },
    });
  }
}
