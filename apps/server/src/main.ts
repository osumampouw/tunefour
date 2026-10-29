import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  // Parse cookies so the auth guard and controller can read session cookies.
  app.use(cookieParser());
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`tunefour-server listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start tunefour-server', err);
  process.exit(1);
});
