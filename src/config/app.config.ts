import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  jwtSecretKey: string;
  jwtExpiresIn: string;
  swaggerUser: string;
  swaggerPassword: string;
  corsOrigins: string[];
  turnstileSecretKey: string;
  googleClientId: string;
  googleClientSecret: string;
  googleCallbackUrl: string;
  frontendUrl: string;
}

export default registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT ?? '3000', 10),
  jwtSecretKey: process.env.JWT_SECRET ?? 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  swaggerUser: process.env.SWAGGER_USER ?? 'admin',
  swaggerPassword: process.env.SWAGGER_PASSWORD ?? 'admin',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') ?? ['*'],
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY ?? '',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  contactEmail: process.env.CONTACT_EMAIL ?? '',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3007/api/v1/auth/google/callback',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
}));
