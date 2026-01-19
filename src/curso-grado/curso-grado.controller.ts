import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CursoGradoService } from './curso-grado.service';
import { CreateCursoGradoDto } from './dto/create-curso-grado.dto';
import { UpdateCursoGradoDto } from './dto/update-curso-grado.dto';

@Controller('curso-grado')
export class CursoGradoController {
  constructor(private readonly cursoGradoService: CursoGradoService) { }

  @Post()
  async create(@Body() createCursoGradoDto: CreateCursoGradoDto) {
    const cursogradoCreate = await this.cursoGradoService.create(createCursoGradoDto);
    return {
      success: true,
      message: "curso asignado correctamente",
      data: cursogradoCreate
    }
  }

  @Get()
  async findAll() {
    const asignaciones = await this.cursoGradoService.findAll();
    return {
      success: true,
      message: "Asignaciones obtenidas correctamente",
      data: asignaciones
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const asignacion = await this.cursoGradoService.findOne(id);
    return {
      success: true,
      message: "Asignación obtenida correctamente",
      data: asignacion
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCursoGradoDto: UpdateCursoGradoDto) {
    const asignacionActualizada = await this.cursoGradoService.update(id, updateCursoGradoDto);
    return {
      success: true,
      message: "Asignación actualizada correctamente",
      data: asignacionActualizada
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.cursoGradoService.remove(id);
    return {
      success: true,
      message: "Asignación eliminada correctamente"
    }
  }

}
