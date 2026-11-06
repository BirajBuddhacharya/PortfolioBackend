import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedData } from '../../common/dto/paginated-data.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { Prisma } from './entity/user.entity';
import { USER_SAFE_SELECT, type SafeUser } from './user.select';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto): Promise<PaginatedData<SafeUser>> {
    const where: Prisma.UserWhereInput = { deletedAt: null };
    const orderBy: Prisma.UserOrderByWithRelationInput =
      pagination.sort ?? { updatedAt: 'desc' };

    if (pagination.pagination) {
      const [result, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          orderBy,
          skip: pagination.skip,
          take: pagination.take,
          select: USER_SAFE_SELECT,
        }),
        this.prisma.user.count({ where }),
      ]);
      return new PaginatedData(result, total);
    }

    const result = await this.prisma.user.findMany({
      where,
      orderBy,
      select: USER_SAFE_SELECT,
    });
    return new PaginatedData(result, result.length);
  }

  async findById(id: number): Promise<SafeUser> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_SAFE_SELECT,
    });
    if (!user) throw new NotFoundException('Requested data not found');
    return user;
  }

  async create(dto: CreateUserDto): Promise<SafeUser> {
    const exists = await this.prisma.user.count({
      where: { email: dto.email, deletedAt: null },
    });
    if (exists) throw new ConflictException('Email already in use');

    const password = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: { ...dto, password },
      select: USER_SAFE_SELECT,
    });
  }

  async softDelete(id: number): Promise<SafeUser> {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: USER_SAFE_SELECT,
    });
  }

  async updateSelf(id: number, dto: UpdateMeDto): Promise<SafeUser> {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SAFE_SELECT,
    });
  }
}
