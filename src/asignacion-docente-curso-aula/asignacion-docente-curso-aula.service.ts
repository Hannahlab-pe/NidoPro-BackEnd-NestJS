import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateAsignacionDocenteCursoAulaDto } from './dto/create-asignacion-docente-curso-aula.dto';
import { UpdateAsignacionDocenteCursoAulaDto } from './dto/update-asignacion-docente-curso-aula.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AsignacionDocenteCursoAula } from './entities/asignacion-docente-curso-aula.entity';
import { Repository } from 'typeorm';
import { TrabajadorService } from 'src/trabajador/trabajador.service';
import { CursoService } from 'src/curso/curso.service';
import { AulaService } from 'src/aula/aula.service';

@Injectable()
export class AsignacionDocenteCursoAulaService {
  constructor(
    @InjectRepository(AsignacionDocenteCursoAula)
    private readonly asignacionRepository: Repository<AsignacionDocenteCursoAula>,
    private readonly trabajadorService: TrabajadorService,
    private readonly cursoService: CursoService,
    private readonly aulaService: AulaService,
  ) { }

  async create(createDto: CreateAsignacionDocenteCursoAulaDto): Promise<{ success: boolean; message: string; data: AsignacionDocenteCursoAula }> {
    // 1. Validar que el trabajador existe y es docente
    const trabajador = await this.trabajadorService.findOne(createDto.idTrabajador);
    if (!trabajador) {
      throw new NotFoundException(`Trabajador con ID ${createDto.idTrabajador} no encontrado`);
    }

    if (trabajador.idRol.nombre !== 'DOCENTE') {
      throw new BadRequestException(`El trabajador con ID ${createDto.idTrabajador} no tiene el rol de DOCENTE`);
    }

    // 2. Validar que el curso existe
    const curso = await this.cursoService.findOne(createDto.idCurso);
    if (!curso) {
      throw new NotFoundException(`Curso con ID ${createDto.idCurso} no encontrado`);
    }

    // 3. Validar que el aula existe
    const aula = await this.aulaService.findOne(createDto.idAula);
    if (!aula) {
      throw new NotFoundException(`Aula con ID ${createDto.idAula} no encontrada`);
    }

    // 4. Validar que no exista una asignación activa duplicada
    const asignacionExistente = await this.asignacionRepository
      .createQueryBuilder('asignacion')
      .where('asignacion.id_trabajador = :idTrabajador', { idTrabajador: createDto.idTrabajador })
      .andWhere('asignacion.id_curso = :idCurso', { idCurso: createDto.idCurso })
      .andWhere('asignacion.id_aula = :idAula', { idAula: createDto.idAula })
      .andWhere('asignacion.esta_activo = :estaActivo', { estaActivo: true })
      .getOne();

    if (asignacionExistente) {
      throw new ConflictException(
        `Ya existe una asignación activa del docente ${trabajador.nombre} ${trabajador.apellido} para el curso ${curso.nombreCurso} en el aula ${aula.seccion}`
      );
    }

    // 5. Crear la asignación
    const nuevaAsignacion = this.asignacionRepository.create({
      idTrabajador: trabajador,
      idCurso: curso,
      idAula: aula,
      fechaAsignacion: createDto.fechaAsignacion || new Date().toISOString().split('T')[0],
      estaActivo: createDto.estaActivo ?? true
    });

    const asignacionGuardada = await this.asignacionRepository.save(nuevaAsignacion);

    return {
      success: true,
      message: 'Asignación creada correctamente',
      data: asignacionGuardada
    };
  }

  async findAll(): Promise<{ success: boolean; message: string; data: AsignacionDocenteCursoAula[] }> {
    const asignaciones = await this.asignacionRepository.find({
      relations: ['idTrabajador', 'idTrabajador.idRol', 'idCurso', 'idAula'],
      order: {
        fechaAsignacion: 'DESC'
      }
    });

    return {
      success: true,
      message: 'Asignaciones obtenidas correctamente',
      data: asignaciones
    };
  }

  async findOne(id: string): Promise<AsignacionDocenteCursoAula> {
    const asignacion = await this.asignacionRepository.findOne({
      where: { idAsignacionDocenteCursoAula: id },
      relations: ['idTrabajador', 'idTrabajador.idRol', 'idCurso', 'idAula']
    });

    if (!asignacion) {
      throw new NotFoundException(`Asignación con ID ${id} no encontrada`);
    }

    return asignacion;
  }

  // Obtener asignaciones por docente
  async findByDocente(idTrabajador: string): Promise<{ success: boolean; message: string; data: AsignacionDocenteCursoAula[] }> {
    const asignaciones = await this.asignacionRepository.find({
      where: {
        idTrabajador: { idTrabajador },
        estaActivo: true
      },
      relations: ['idTrabajador', 'idCurso', 'idAula']
    });

    return {
      success: true,
      message: 'Asignaciones del docente obtenidas correctamente',
      data: asignaciones
    };
  }

  // Obtener asignaciones por aula
  async findByAula(idAula: string): Promise<{ success: boolean; message: string; data: AsignacionDocenteCursoAula[] }> {
    const asignaciones = await this.asignacionRepository.find({
      where: {
        idAula: { idAula },
        estaActivo: true
      },
      relations: ['idTrabajador', 'idTrabajador.idRol', 'idCurso', 'idAula']
    });

    return {
      success: true,
      message: 'Asignaciones del aula obtenidas correctamente',
      data: asignaciones
    };
  }

  // Obtener asignaciones por curso
  async findByCurso(idCurso: string): Promise<{ success: boolean; message: string; data: AsignacionDocenteCursoAula[] }> {
    const asignaciones = await this.asignacionRepository.find({
      where: {
        idCurso: { idCurso },
        estaActivo: true
      },
      relations: ['idTrabajador', 'idTrabajador.idRol', 'idCurso', 'idAula']
    });

    return {
      success: true,
      message: 'Asignaciones del curso obtenidas correctamente',
      data: asignaciones
    };
  }

  async update(id: string, updateDto: UpdateAsignacionDocenteCursoAulaDto): Promise<{ success: boolean; message: string; data: AsignacionDocenteCursoAula }> {
    const asignacion = await this.findOne(id);

    // Validaciones si se actualiza el trabajador
    if (updateDto.idTrabajador) {
      const trabajador = await this.trabajadorService.findOne(updateDto.idTrabajador);
      if (!trabajador) {
        throw new NotFoundException(`Trabajador con ID ${updateDto.idTrabajador} no encontrado`);
      }
      if (trabajador.idRol.nombre !== 'DOCENTE') {
        throw new BadRequestException(`El trabajador no tiene el rol de DOCENTE`);
      }
      asignacion.idTrabajador = trabajador;
    }

    // Validaciones si se actualiza el curso
    if (updateDto.idCurso) {
      const curso = await this.cursoService.findOne(updateDto.idCurso);
      if (!curso) {
        throw new NotFoundException(`Curso con ID ${updateDto.idCurso} no encontrado`);
      }
      asignacion.idCurso = curso;
    }

    // Validaciones si se actualiza el aula
    if (updateDto.idAula) {
      const aula = await this.aulaService.findOne(updateDto.idAula);
      if (!aula) {
        throw new NotFoundException(`Aula con ID ${updateDto.idAula} no encontrada`);
      }
      asignacion.idAula = aula;
    }

    if (updateDto.fechaAsignacion !== undefined) {
      asignacion.fechaAsignacion = updateDto.fechaAsignacion;
    }

    if (updateDto.estaActivo !== undefined) {
      asignacion.estaActivo = updateDto.estaActivo;
    }

    const asignacionActualizada = await this.asignacionRepository.save(asignacion);

    return {
      success: true,
      message: 'Asignación actualizada correctamente',
      data: asignacionActualizada
    };
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const asignacion = await this.findOne(id);
    
    // Soft delete
    asignacion.estaActivo = false;
    await this.asignacionRepository.save(asignacion);

    return {
      success: true,
      message: 'Asignación desactivada correctamente'
    };
  }
}
