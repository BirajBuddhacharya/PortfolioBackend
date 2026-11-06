import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  jwtSecretKey: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  swaggerUser: string;
  swaggerPassword: string;
  corsOrigins: string[];
  turnstileSecretKey: string;
  googleClientId: string;
  googleClientSecret: string;
  googleCallbackUrl: string;
  frontendUrl: string;
  ignoreTurnstile: boolean;
  resendApiKey: string;
  contactEmail: string;
}

export default registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT ?? '3000', 10),
  jwtSecretKey: process.env.JWT_SECRET ?? 'change-me-in-production',
  // Refresh tokens are signed with a separate secret so an access token can
  // never be replayed against the refresh endpoint (and vice versa).
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ??
    `${process.env.JWT_SECRET ?? 'change-me-in-production'}:refresh`,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  swaggerUser: process.env.SWAGGER_USER ?? 'admin',
  swaggerPassword: process.env.SWAGGER_PASSWORD ?? 'admin',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') ?? ['*'],
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY ?? '',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  contactEmail: process.env.CONTACT_EMAIL ?? '',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ??
    'http://localhost:3007/api/v1/auth/google/callback',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  ignoreTurnstile: process.env.IGNORE_TURNSTILE?.toLowerCase() === 'true',
}));
