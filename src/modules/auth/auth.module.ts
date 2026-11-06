import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { AllConfig } from '../../config/config.type';

@Module({
  imports: [
    // brute-force protection, scoped to this module's controllers
    ThrottlerModule.forRoot([
      { name: 'login', ttl: 60_000, limit: 5 },
      { name: 'token', ttl: 60_000, limit: 20 },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfig>) => {
        const appCfg = configService.get('app', { infer: true })!;
        return {
          secret: appCfg.jwtSecretKey,
          signOptions: {
            expiresIn: appCfg.jwtExpiresIn as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
