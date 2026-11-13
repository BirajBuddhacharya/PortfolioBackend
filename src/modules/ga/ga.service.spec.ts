import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GaService } from './ga.service';

describe('GaService', () => {
  let service: GaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GaService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<GaService>(GaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
