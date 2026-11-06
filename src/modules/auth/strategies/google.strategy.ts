import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { AllConfig } from '../../../config/config.type';
import { SignedCookieOAuthStateStore } from './oauth-state.store';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService<AllConfig>) {
    const appCfg = configService.get('app', { infer: true })!;
    super({
      clientID: appCfg.googleClientId,
      clientSecret: appCfg.googleClientSecret,
      callbackURL: appCfg.googleCallbackUrl,
      scope: ['email', 'profile'],
      // CSRF state + PKCE (S256). The verifier is held in a signed HttpOnly
      // cookie, so the callback works across stateless serverless instances.
      state: true,
      pkce: true,
      store: new SignedCookieOAuthStateStore(
        appCfg.jwtSecretKey,
        process.env.NODE_ENV === 'production',
      ),
    } as any);
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const user = {
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
    };
    done(null, user);
  }
}
