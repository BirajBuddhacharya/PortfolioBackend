import { Module } from '@nestjs/common';
import { GaService } from './ga.service';
import { AdminGaController } from './ga.admin.controller';

@Module({
  controllers: [AdminGaController],
  providers: [GaService],
})
export class GaModule {}
