import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserBaseService } from './user.base.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UserService {
  constructor(private userBaseService: UserBaseService) {}

  findAll(paginationDto: PaginationDto) {
    return this.userBaseService.find({}, paginationDto);
  }

  findById(id: number) {
    return this.userBaseService.findOneOrFail({ id });
  }

  async create(dto: CreateUserDto) {
    const exists = await this.userBaseService.exists({ email: dto.email });
    if (exists) throw new ConflictException('Email already in use');

    const password = await bcrypt.hash(dto.password, 10);
    return this.userBaseService.create({ ...dto, password });
  }

  async softDelete(id: number) {
    await this.userBaseService.findOneOrFail({ id });
    return this.userBaseService.softDelete({ id });
  }

  updateSelf(id: number, dto: UpdateMeDto) {
    return this.userBaseService.update({ id }, dto);
  }
}
