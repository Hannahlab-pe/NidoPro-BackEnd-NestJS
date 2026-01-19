import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AsignacionDocenteCursoAulaService } from './asignacion-docente-curso-aula.service';
import { CreateAsignacionDocenteCursoAulaDto } from './dto/create-asignacion-docente-curso-aula.dto';
import { UpdateAsignacionDocenteCursoAulaDto } from './dto/update-asignacion-docente-curso-aula.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Asignación Docente-Curso-Aula')
@Controller('asignacion-docente-curso-aula')
export class AsignacionDocenteCursoAulaController {
  constructor(private readonly asignacionService: AsignacionDocenteCursoAulaService) { }

  @Post()
  @ApiOperation({ summary: 'Asignar un docente a un curso en un aula específica' })
  async create(@Body() createDto: CreateAsignacionDocenteCursoAulaDto) {
    return await this.asignacionService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las asignaciones docente-curso-aula' })
  async findAll() {
    return await this.asignacionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una asignación específica por ID' })
  async findOne(@Param('id') id: string) {
    const asignacion = await this.asignacionService.findOne(id);
    return {
      success: true,
      message: 'Asignación obtenida correctamente',
      data: asignacion
    };
  }

  @Get('docente/:idTrabajador')
  @ApiOperation({ summary: 'Obtener todas las asignaciones de un docente específico' })
  async findByDocente(@Param('idTrabajador') idTrabajador: string) {
    return await this.asignacionService.findByDocente(idTrabajador);
  }

  @Get('aula/:idAula')
  @ApiOperation({ summary: 'Obtener todas las asignaciones de un aula (horario del aula)' })
  async findByAula(@Param('idAula') idAula: string) {
    return await this.asignacionService.findByAula(idAula);
  }

  @Get('curso/:idCurso')
  @ApiOperation({ summary: 'Obtener todas las asignaciones de un curso' })
  async findByCurso(@Param('idCurso') idCurso: string) {
    return await this.asignacionService.findByCurso(idCurso);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una asignación' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateAsignacionDocenteCursoAulaDto) {
    return await this.asignacionService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar una asignación (eliminación lógica)' })
  async remove(@Param('id') id: string) {
    return await this.asignacionService.remove(id);
  }
}
