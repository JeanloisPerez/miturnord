import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Ensure uploads folder exists
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  // Serve uploaded images as static files at /uploads
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  // Allow frontend
  app.enableCors({ origin: 'http://localhost:5173', credentials: true });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
