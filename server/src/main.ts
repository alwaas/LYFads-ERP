import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

import { join } from 'path';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security
  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    }),
  );

  // Response Compression
  app.use(compression());

  // CORS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const allowedOrigins = [frontendUrl, 'http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Static Upload Folder
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Swagger Documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('LYFads ERP API')
      .setDescription('Enterprise ERP Backend API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('docs', app, document);
  }

  const port = Number(process.env.PORT) || 3000;

  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 Swagger Docs: http://localhost:${port}/docs`);
}

void bootstrap();
