import { PartialType } from '@nestjs/swagger';
import { CreateAsignacionDocenteCursoAulaDto } from './create-asignacion-docente-curso-aula.dto';

export class UpdateAsignacionDocenteCursoAulaDto extends PartialType(CreateAsignacionDocenteCursoAulaDto) {}
