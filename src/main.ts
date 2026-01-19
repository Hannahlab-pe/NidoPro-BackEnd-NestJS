import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  console.log('🚀 Iniciando NidoPro Backend...');
  console.log('📦 Variables de entorno cargadas:');
  console.log('   - DB_HOST:', process.env.DB_HOST);
  console.log('   - DB_PORT:', process.env.DB_PORT);
  console.log('   - PORT:', process.env.PORT);
  console.log('   - GCS_BUCKET_NAME:', process.env.GCS_BUCKET_NAME || 'NO CONFIGURADO');

  const app = await NestFactory.create(AppModule);
  console.log('✅ AppModule creado exitosamente');

  // Configuración de CORS para permitir todos los orígenes (TEMPORAL - DEBUG)
  app.enableCors({
    origin: true, // Permite TODOS los orígenes
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  console.log('✅ CORS habilitado para todos los orígenes');

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

  const port = process.env.PORT ?? 3000;
  // Escuchar en 0.0.0.0 para permitir conexiones externas (Railway/Docker)
  await app.listen(port, '0.0.0.0');
  console.log(`✅ Servidor corriendo en puerto ${port}`);
  console.log(`🌐 API disponible en: http://0.0.0.0:${port}/api/v1`);
  console.log(`📚 Swagger docs en: http://0.0.0.0:${port}/api`);
}

bootstrap().catch(err => {
  console.error('❌ Error fatal al iniciar la aplicación:', err);
  process.exit(1);
});
