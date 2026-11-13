import { Test, TestingModule } from '@nestjs/testing';
import { AdminGaController } from './ga.admin.controller';
import { GaService } from './ga.service';

describe('GaController', () => {
  let controller: AdminGaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminGaController],
      providers: [GaService],
    }).compile();

    controller = module.get<AdminGaController>(AdminGaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
