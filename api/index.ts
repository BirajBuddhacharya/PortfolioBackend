import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { AppModule } from '../src/app.module';
import { AllConfig } from '../src/config/config.type';
import type { Request, Response } from 'express';

let app: Awaited<ReturnType<typeof NestFactory.create>>;

async function getApp() {
  if (!app) {
    app = await NestFactory.create(AppModule, { logger: false });
    const config = app.get(ConfigService<AllConfig>);
    const appCfg = config.get('app', { infer: true })!;

    app.setGlobalPrefix('api/v1');
    app.enableCors({ origin: appCfg.corsOrigins });
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));

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

    await app.init();
  }
  return app;
}

export default async function handler(req: Request, res: Response) {
  const nestApp = await getApp();
  const expressApp = nestApp.getHttpAdapter().getInstance();
  return expressApp(req, res);
}
