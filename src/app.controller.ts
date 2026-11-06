import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SkipAuthCheck } from './decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @SkipAuthCheck()
  getHello(): string {
    return this.appService.getHello();
  }
}
