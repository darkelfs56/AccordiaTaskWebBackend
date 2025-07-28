import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser(process.env.COOKIE_SECRET));
  const corsConfig = {
    origin: process.env.ALLOWED_CLIENT_ORIGIN ?? '*',
    credentials: true,
  };

  app.enableCors(corsConfig);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
