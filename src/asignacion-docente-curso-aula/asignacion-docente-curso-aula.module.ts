import { Module } from '@nestjs/common';
import { AsignacionDocenteCursoAulaService } from './asignacion-docente-curso-aula.service';
import { AsignacionDocenteCursoAulaController } from './asignacion-docente-curso-aula.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsignacionDocenteCursoAula } from './entities/asignacion-docente-curso-aula.entity';
import { TrabajadorModule } from 'src/trabajador/trabajador.module';
import { CursoModule } from 'src/curso/curso.module';
import { AulaModule } from 'src/aula/aula.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AsignacionDocenteCursoAula]),
    TrabajadorModule,
    CursoModule,
    AulaModule
  ],
  controllers: [AsignacionDocenteCursoAulaController],
  providers: [AsignacionDocenteCursoAulaService],
  exports: [AsignacionDocenteCursoAulaService],
})
export class AsignacionDocenteCursoAulaModule { }
