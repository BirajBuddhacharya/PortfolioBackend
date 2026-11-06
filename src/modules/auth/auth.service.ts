import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AllConfig } from '../../config/config.type';
import {
  USER_AUTH_SELECT,
  type AuthUser,
  type SafeUser,
} from '../user/user.select';

export interface GoogleUser {
  email: string;
  name: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AccessPayload {
  sub: number;
  email: string;
  tokenVersion: number;
  type: 'access';
}

interface RefreshPayload {
  sub: number;
  tokenVersion: number;
  type: 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService<AllConfig>,
  ) {}

  private get appConfig() {
    return this.configService.get('app', { infer: true })!;
  }

  private issueTokens(user: AuthUser): TokenPair {
    const accessPayload: AccessPayload = {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
      type: 'access',
    };
    const refreshPayload: RefreshPayload = {
      sub: user.id,
      tokenVersion: user.tokenVersion,
      type: 'refresh',
    };

    return {
      accessToken: this.jwtService.sign(accessPayload, {
        secret: this.appConfig.jwtSecretKey,
        expiresIn: this.appConfig.jwtExpiresIn as any,
      }),
      refreshToken: this.jwtService.sign(refreshPayload, {
        secret: this.appConfig.jwtRefreshSecret,
        expiresIn: this.appConfig.jwtRefreshExpiresIn as any,
      }),
    };
  }

  private toSafeUser(user: AuthUser & { password?: string }): SafeUser {
    const { tokenVersion: _tokenVersion, password: _password, ...safe } = user;
    return safe;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      select: {
        ...USER_AUTH_SELECT,
        password: true,
      },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      ...this.issueTokens(user),
      user: this.toSafeUser(user),
    };
  }

  async googleLogin(googleUser: GoogleUser): Promise<TokenPair> {
    const user = await this.prisma.user.findFirst({
      where: { email: googleUser.email, deletedAt: null },
      select: USER_AUTH_SELECT,
    });

    if (!user) {
      throw new UnauthorizedException(
        'No admin account linked to this Google account',
      );
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.appConfig.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh' || !payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: USER_AUTH_SELECT,
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    return this.issueTokens(user);
  }

  /** Bumps the user's token version, revoking every access/refresh token. */
  async logout(userId: number): Promise<{ success: true }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    return { success: true };
  }

  me(user: AuthUser): SafeUser {
    return this.toSafeUser(user);
  }
}
