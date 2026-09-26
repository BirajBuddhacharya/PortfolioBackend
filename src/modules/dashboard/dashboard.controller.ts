import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { SetRoles } from '../../decorators/roles.decorator';
import { RoleEnum } from '../../enums/roles.enum';
import { ResponseDto } from '../../common/response/response.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('overview')
  @SetRoles(RoleEnum.ADMIN)
  async getOverview() {
    return new ResponseDto(await this.dashboardService.getOverview());
  }

  @Get('snapshot')
  @SetRoles(RoleEnum.ADMIN)
  async getSnapshot() {
    return new ResponseDto(await this.dashboardService.getSnapshot());
  }
}
