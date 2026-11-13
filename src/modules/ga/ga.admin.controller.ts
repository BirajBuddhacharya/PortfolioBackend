import { Controller, Get } from '@nestjs/common';
import { GaService } from './ga.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SetRoles } from 'src/decorators/roles.decorator';
import { RoleEnum } from 'src/enums/roles.enum';

@Controller('ga')
@ApiBearerAuth()
@SetRoles(RoleEnum.ADMIN)
export class AdminGaController {
  constructor(private readonly gaService: GaService) {}

  @Get()
  findAll() {
    return this.gaService.findAll();
  }
}
