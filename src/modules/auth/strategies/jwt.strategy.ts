import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { AllConfig } from '../../../config/config.type';
import {
  USER_AUTH_SELECT,
  type AuthUser,
} from '../../user/user.select';

export interface JwtPayload {
  sub: number;
  email: string;
  tokenVersion: number;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService<AllConfig>,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('app', { infer: true })!.jwtSecretKey,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    // Refresh tokens are signed with a different secret, but reject them here
    // too as defence in depth if the secrets are ever misconfigured.
    if (!payload?.sub || payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: USER_AUTH_SELECT,
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Authorization failed');
    }

    return user;
  }
}
