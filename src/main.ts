import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  json,
  urlencoded,
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { AppModule } from './app.module';
import { AllConfig } from './config/config.type';

// App-level contact throttle. Generous enough for shared-NAT/mobile-carrier
// traffic, while still stopping a single client from hammering the form.
const CONTACT_WINDOW_MS = 10 * 60 * 1000;
const CONTACT_MAX_REQUESTS = 10;
const contactHits = new Map<string, number[]>();

function contactRateLimit(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'POST') return next();

  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (contactHits.get(key) ?? []).filter(
    (ts) => now - ts < CONTACT_WINDOW_MS,
  );

  if (recent.length >= CONTACT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((recent[0] + CONTACT_WINDOW_MS - now) / 1000);
    res.setHeader('Retry-After', String(Math.max(1, retryAfter)));
    res.status(429).json({
      status: 429,
      timestamp: new Date().toISOString(),
      message: 'Too many messages sent. Please try again later.',
    });
    return;
  }

  recent.push(now);
  contactHits.set(key, recent);

  // Keep the map from growing without bound on long-lived instances.
  if (contactHits.size > 5000) {
    for (const [ip, hits] of contactHits) {
      if (!hits.some((ts) => now - ts < CONTACT_WINDOW_MS)) {
        contactHits.delete(ip);
      }
    }
  }

  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AllConfig>);
  const appCfg = config.get('app', { infer: true })!;

  app.setGlobalPrefix('api/v1');

  const httpAdapter = app.getHttpAdapter().getInstance() as Express;

  // Required so req.ip is the client IP behind Vercel's proxy.
  httpAdapter.set('trust proxy', 1);

  // V4 — don't advertise the framework.
  httpAdapter.disable('x-powered-by');

  // V3 — hardening headers. The API never needs to be framed or render HTML.
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    );
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    );
    if (req.path.startsWith('/api/v1')) {
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      );
    }
    next();
  });

  const origins = appCfg.corsOrigins;
  app.enableCors({
    origin: origins.length === 1 && origins[0] === '*' ? '*' : origins,
    credentials: true,
    maxAge: 7200, // cache preflight 2h (Chrome max)
  });
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  app.use('/api/v1/public/contact', contactRateLimit);

  app.use(
    '/api-docs',
    basicAuth({
      users: { [appCfg.swaggerUser]: appCfg.swaggerPassword },
      challenge: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Portfolio API')
    .setDescription('Portfolio backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(appCfg.port);
}

bootstrap();
