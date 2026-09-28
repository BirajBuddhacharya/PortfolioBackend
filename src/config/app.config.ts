import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT ?? '3000', 10),
  jwtSecretKey: process.env.JWT_SECRET ?? 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  swaggerUser: process.env.SWAGGER_USER ?? 'admin',
  swaggerPassword: process.env.SWAGGER_PASSWORD ?? 'admin',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') ?? ['*'],
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY ?? '',
  ignoreTurnstile: process.env.IGNORE_TURNSTILE === 'true',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  contactEmail: process.env.CONTACT_EMAIL ?? '',
}));
