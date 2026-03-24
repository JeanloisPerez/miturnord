import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedocModule, RedocOptions } from 'nestjs-redoc';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  app.useGlobalFilters(new AllExceptionsFilter());

  // Ensure uploads folder exists
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  // Serve uploaded images as static files at /uploads
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  // Allow frontend
  app.enableCors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('MiTurnoRD API')
    .setDescription('Documentación de la API del backend de MiTurnoRD')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ReDoc Configuration
  const redocOptions: RedocOptions = {
    title: 'MiTurnoRD API Docs',
    sortPropsAlphabetically: true,
    hideDownloadButton: false,
    hideHostname: false,
  };
  await RedocModule.setup('/api/redoc', app as any, document, redocOptions);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
