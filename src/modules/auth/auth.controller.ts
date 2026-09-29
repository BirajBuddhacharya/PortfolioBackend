import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SkipAuthCheck } from '../../decorators/public.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { ResponseDto } from '../../common/response/response.dto';
import { AllConfig } from '../../config/config.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService<AllConfig>,
  ) {}

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

  @Get('google')
  @SkipAuthCheck()
  @UseGuards(AuthGuard('google'))
  googleRedirect() {}

  @Get('google/callback')
  @SkipAuthCheck()
  @UseGuards(AuthGuard('google'))
  async googleCallback(@CurrentUser() user: any, @Res() res: Response) {
    const { accessToken } = await this.authService.googleLogin(user);
    const frontendUrl = this.configService.get('app', { infer: true })!.frontendUrl;
    res.redirect(`${frontendUrl}/admin/login?token=${accessToken}`);
  }
}
