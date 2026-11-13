import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SetRoles } from '../../decorators/roles.decorator';
import { RoleEnum } from '../../enums/roles.enum';
import { ResponseDto } from '../../common/response/response.dto';
import { GaService } from './ga.service';
import { GaReportQueryDto } from './dto/ga-report-query.dto';

@ApiTags('Google Analytics')
@ApiBearerAuth()
@Controller('ga')
@SetRoles(RoleEnum.ADMIN)
export class AdminGaController {
  constructor(private readonly gaService: GaService) {}

  @Get('requests')
  @ApiOperation({ summary: 'Requests, pageviews and traffic sources' })
  async getRequests(@Query() query: GaReportQueryDto) {
    return new ResponseDto(await this.gaService.getRequests(query));
  }

  @Get('visitors')
  @ApiOperation({ summary: 'Visitors, geography and top pages' })
  async getVisitors(@Query() query: GaReportQueryDto) {
    return new ResponseDto(await this.gaService.getVisitors(query));
  }

  @Get('performance')
  @ApiOperation({ summary: 'Engagement and session performance metrics' })
  async getPerformance(@Query() query: GaReportQueryDto) {
    return new ResponseDto(await this.gaService.getPerformance(query));
  }
}
