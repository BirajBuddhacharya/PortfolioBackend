import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { AllConfig } from '../../../config/config.type';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService<AllConfig>) {
    const appCfg = configService.get('app', { infer: true })!;
    super({
      clientID: appCfg.googleClientId,
      clientSecret: appCfg.googleClientSecret,
      callbackURL: appCfg.googleCallbackUrl,
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const user = {
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
    };
    done(null, user);
  }
}
