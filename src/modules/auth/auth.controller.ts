import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SkipAuthCheck } from '../../decorators/public.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { ResponseDto } from '../../common/response/response.dto';
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @SkipAuthCheck()
  async login(@Body() dto: LoginDto) {
    return new ResponseDto(await this.authService.login(dto), 'Login successful');
  }

  @Get('me')
  @ApiBearerAuth()
  me(@CurrentUser() user: any) {
    return new ResponseDto(this.authService.me(user));
  }
}
