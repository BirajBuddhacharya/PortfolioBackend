import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ContactController } from './public.contact.controller';
import { ContactService } from './contact.service';
import { ContactBaseService } from './common/contact.base.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ContactController', () => {
  let controller: ContactController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [
        ContactService,
        { provide: ContactBaseService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<ContactController>(ContactController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
