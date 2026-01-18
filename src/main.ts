import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de CORS para permitir los orígenes especificados
  app.enableCors({
    origin: [
      'http://localhost:5173', // Desarrollo
      'http://localhost:3000',
      'http://localhost:3001', // Desarrollo alternativo
      // Desarrollo alternativo
      'https://nido-pro-frontend.vercel.app', // ← AGREGAR ESTO
      'https://awsnidopr.up.railway.app', // Si necesitan comunicación interna
    ],
    credentials: true,
  });

  // Prefijo global para la API
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si se envían propiedades no definidas en el DTO
      transform: true, // Convierte automáticamente los tipos de datos
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Nido Pro')
    .setDescription('Api de Intranet Nido')
    .setVersion('1.0')
    .addTag('nidoPro')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
