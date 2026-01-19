import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsDecimal,
  IsDateString,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsEmail,
  Length,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { MetodoPago } from 'src/enums/metodo-pago.enum';
import { Type } from 'class-transformer';

// DTO para crear apoderado (campos requeridos)
class CreateApoderadoDataDto {
  @ApiProperty({ example: 'Juan', description: 'Nombre del apoderado' })
  @IsString()
  @Length(1, 100)
  nombre: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del apoderado' })
  @IsString()
  @Length(1, 100)
  apellido: string;

  @ApiProperty({
    example: 'DNI',
    description: 'Tipo de documento de identidad del apoderado',
  })
  @IsString()
  @Length(2, 10)
  tipoDocumentoIdentidad: string;

  @ApiProperty({
    example: '12345678',
    description: 'Número de documento de identidad del apoderado',
  })
  @IsString()
  @Length(6, 15)
  documentoIdentidad: string;

  @ApiProperty({
    example: '+51987654321',
    description: 'Número de teléfono',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  numero?: string;

  @ApiProperty({
    example: 'correo@ejemplo.com',
    description: 'Correo electrónico',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @Length(0, 255)
  correo?: string;

  @ApiProperty({
    example: 'Av. Siempre Viva 123',
    description: 'Dirección',
    required: false,
  })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiProperty({
    example: true,
    description: 'Es el apoderado principal (quien paga la matrícula)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;

  @ApiProperty({
    example: 'madre',
    description: 'Tipo de apoderado: padre, madre, tutor, abuelo, etc.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  tipoApoderado?: string;
}

class CreateContactoEmergenciaDataDto {
  @ApiProperty({ example: 'María', description: 'Nombre del contacto' })
  @IsString()
  @Length(1, 100)
  nombre: string;

  @ApiProperty({ example: 'González', description: 'Apellido del contacto' })
  @IsString()
  @Length(1, 100)
  apellido: string;

  @ApiProperty({
    example: '+51987654321',
    description: 'Teléfono del contacto',
  })
  @IsString()
  @Length(1, 20)
  telefono: string;

  @ApiProperty({
    example: 'maria@email.com',
    description: 'Email del contacto',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'madre', description: 'Tipo de contacto' })
  @IsString()
  @Length(1, 50)
  tipoContacto: string;

  @ApiProperty({
    example: 'madre',
    description: 'Relación específica con el estudiante',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  relacionEstudiante?: string;

  @ApiProperty({
    example: true,
    description: 'Es contacto principal?',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;

  @ApiProperty({
    example: 1,
    description: 'Prioridad de contacto',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  prioridad?: number;
}

class CreateEstudianteDataDto {
  @ApiProperty({ description: 'Nombre del estudiante' })
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Apellido del estudiante' })
  @IsString()
  apellido: string;

  @ApiProperty({ description: 'Número de documento' })
  @IsString()
  nroDocumento: string;

  @ApiProperty({ description: 'Tipo de documento', required: false })
  @IsOptional()
  @IsString()
  tipoDocumento?: string;

  @ApiProperty({ description: 'Observaciones', required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;

  // ✅ AGREGAR el array de contactos:
  @ApiProperty({
    description: 'Lista de contactos de emergencia',
    required: false,
    type: [CreateContactoEmergenciaDataDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateContactoEmergenciaDataDto)
  contactosEmergencia?: CreateContactoEmergenciaDataDto[];

  @ApiProperty({
    required: false,
    description: 'URL de la imagen del estudiante',
  })
  @IsString()
  @IsOptional()
  imagen_estudiante?: string;
}

// DTO para actualizar datos del apoderado
class ActualizarApoderadoDataDto {
  @ApiProperty({
    example: '+51987654321',
    description: 'Número de teléfono del apoderado',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  numero?: string;

  @ApiProperty({
    example: 'Av. Siempre Viva 123',
    description: 'Dirección del apoderado',
    required: false,
  })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiProperty({
    example: 'apoderado@email.com',
    description: 'Correo electrónico del apoderado',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @Length(0, 255)
  correo?: string;
}

// DTO para actualizar contactos de emergencia existentes
class ActualizarContactoEmergenciaDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID del contacto existente para actualizar',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  idContactoEmergencia?: string;

  @ApiProperty({ example: 'María', description: 'Nombre del contacto' })
  @IsString()
  @Length(1, 100)
  nombre: string;

  @ApiProperty({ example: 'González', description: 'Apellido del contacto' })
  @IsString()
  @Length(1, 100)
  apellido: string;

  @ApiProperty({
    example: '+51987654321',
    description: 'Teléfono del contacto',
  })
  @IsString()
  @Length(1, 20)
  telefono: string;

  @ApiProperty({
    example: 'maria@email.com',
    description: 'Email del contacto',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'madre', description: 'Tipo de contacto' })
  @IsString()
  @Length(1, 50)
  tipoContacto: string;

  @ApiProperty({
    example: 'madre',
    description: 'Relación específica con el estudiante',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  relacionEstudiante?: string;

  @ApiProperty({
    example: true,
    description: 'Es contacto principal?',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;

  @ApiProperty({
    example: 1,
    description: 'Prioridad de contacto',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  prioridad?: number;

  @ApiProperty({
    example: false,
    description: 'Flag para indicar si desactivar el contacto',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  desactivar?: boolean;
}

// DTO para actualizar datos del estudiante (solo nombre y apellido)
class ActualizarEstudianteDataDto {
  @ApiProperty({
    example: 'Carlos',
    description: 'Nombre del estudiante',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  nombre?: string;

  @ApiProperty({
    example: 'Rodríguez',
    description: 'Apellido del estudiante',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  apellido?: string;
}

export class ActualizarContactosMatriculaDto {
  @ApiProperty({
    description: 'Datos del apoderado para actualizar',
    required: false,
    type: ActualizarApoderadoDataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ActualizarApoderadoDataDto)
  apoderadoData?: ActualizarApoderadoDataDto;

  @ApiProperty({
    description: 'Datos del estudiante para actualizar (solo nombre y apellido)',
    required: false,
    type: ActualizarEstudianteDataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ActualizarEstudianteDataDto)
  estudianteData?: ActualizarEstudianteDataDto;

  @ApiProperty({
    description: 'Lista de contactos de emergencia para actualizar',
    required: false,
    type: [ActualizarContactoEmergenciaDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ActualizarContactoEmergenciaDto)
  contactosEmergencia?: ActualizarContactoEmergenciaDto[];

  @ApiProperty({
    description: 'Lista de nuevos contactos de emergencia para crear',
    required: false,
    type: [CreateContactoEmergenciaDataDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateContactoEmergenciaDataDto)
  nuevosContactos?: CreateContactoEmergenciaDataDto[];
}

export class CreateMatriculaDto {
  @ApiProperty({
    description: 'Costo de la matrícula del estudiante',
    example: '150.00',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsDecimal({ decimal_digits: '2' })
  costoMatricula?: string;

  @ApiProperty({
    description: 'Fecha de ingreso del estudiante',
    example: '2024-03-01',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  fechaIngreso: string;

  @ApiProperty({
    description: 'ID del grado al que se matricula el estudiante',
    example: 'c3d4e5f6-g7h8-9012-cdef-345678901234',
    format: 'uuid',
  })
  @IsUUID()
  idGrado: string;

  @ApiProperty({
    description: 'Método de pago utilizado para la matrícula',
    example: 'Transferencia bancaria',
    required: false,
  })
  @IsOptional()
  @IsEnum(MetodoPago)
  metodoPago?: MetodoPago;

  @ApiProperty({
    description: 'URL o path de la imagen del voucher de pago',
    example: 'https://ejemplo.com/voucher123.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  voucherImg?: string;

  @ApiProperty({
    description: 'URL del voucher (alias de voucherImg para compatibilidad)',
    example: 'https://ejemplo.com/voucher123.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  voucherUrl?: string;

  @ApiProperty({
    description: 'Año escolar de la matrícula (por defecto año actual)',
    example: '2025',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(4, 4)
  anioEscolar?: string;

  // OPCIÓN 1: IDs existentes
  @ApiProperty({
    description:
      'ID del apoderado responsable de la matrícula (usar si ya existe)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  idApoderado?: string;

  @ApiProperty({
    description: 'ID del estudiante que se matricula (usar si ya existe)',
    example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  idEstudiante?: string;

  // OPCIÓN 2: Datos para crear nuevos registros
  @ApiProperty({
    description: 'Datos del apoderado (usar si no existe y se quiere crear)',
    required: false,
    type: CreateApoderadoDataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateApoderadoDataDto)
  apoderadoData?: CreateApoderadoDataDto;

  @ApiProperty({
    description: 'Datos del estudiante (usar si no existe y se quiere crear)',
    required: false,
    type: CreateEstudianteDataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateEstudianteDataDto)
  estudianteData?: CreateEstudianteDataDto;
}

// DTO para asignar aula a una matrícula
export class AsignarAulaDto {
  @ApiProperty({
    description: 'ID del aula a asignar',
    example: 'd4e5f6g7-h8i9-0123-def4-56789abc0123',
    format: 'uuid',
  })
  @IsUUID()
  idAula: string;}