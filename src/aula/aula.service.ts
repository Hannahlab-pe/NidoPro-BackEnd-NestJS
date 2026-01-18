import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Aula } from './entities/aula.entity';
import { Repository } from 'typeorm';
import { AsignacionAula } from 'src/asignacion-aula/entities/asignacion-aula.entity';

@Injectable()
export class AulaService {

  constructor(@InjectRepository(Aula) private readonly aulaRepository: Repository<Aula>) { }


  async create(createAulaDto: CreateAulaDto): Promise<Aula> {
    // Validar que no exista otra aula con la misma sección en el mismo grado
    const aulaExistente = await this.aulaRepository
      .createQueryBuilder('aula')
      .leftJoinAndSelect('aula.idGrado', 'grado')
      .where('aula.seccion = :seccion', { seccion: createAulaDto.seccion })
      .andWhere('grado.idGrado = :idGrado', { idGrado: createAulaDto.idGrado })
      .getOne();

    if (aulaExistente) {
      throw new ConflictException(`Ya existe un aula con la sección ${createAulaDto.seccion} en el grado ${createAulaDto.idGrado}`);
    }

    const aulaData = {
      seccion: createAulaDto.seccion,
      cantidadEstudiantes: createAulaDto.cantidadEstudiantes,
      idGrado: { idGrado: createAulaDto.idGrado }
    };
    const aula = this.aulaRepository.create(aulaData);
    return await this.aulaRepository.save(aula);
  }

  async findAll(): Promise<Aula[]> {
    return await this.aulaRepository.find({ relations: ['idGrado'] });
  }

  async findOne(id: string): Promise<Aula | null> {
    return await this.aulaRepository.findOne({ where: { idAula: id } });
  }

  // Verificar que el aula existe y pertenece al grado correcto
  async aulaEspecifica(id: string, idGrado: string): Promise<Aula | null> {
    return await this.aulaRepository
      .createQueryBuilder('aula')
      .leftJoinAndSelect('aula.idGrado', 'grado')
      .where('aula.idAula = :idAula', { idAula: id })
      .andWhere('grado.idGrado = :idGrado', { idGrado: idGrado })
      .getOne();
  }

  async buscarPorCantidadGrado(idGrado: string): Promise<Aula[]> {
    const aulasDisponibles = await this.aulaRepository
      .createQueryBuilder('aula')
      .leftJoin('aula.matriculaAula', 'ma', 'ma.estado = :estado', { estado: 'activo' })
      .where('aula.idGrado = :idGrado', { idGrado: idGrado })
      .groupBy('aula.idAula, aula.seccion, aula.cantidadEstudiantes')
      .having('COUNT(ma.idMatriculaAula) < aula.cantidadEstudiantes OR aula.cantidadEstudiantes IS NULL')
      .orderBy('COUNT(ma.idMatriculaAula)', 'ASC')
      .addOrderBy('aula.seccion', 'ASC')
      .getMany();

    return aulasDisponibles;
  }

  async update(id: string, updateAulaDto: UpdateAulaDto): Promise<Aula | null> {
    const aulaFound = await this.aulaRepository.findOne({ where: { idAula: id } });
    if (!aulaFound) {
      throw new NotFoundException(`Aula with id ${id} not found`);
    }

    const updateData: any = {
      seccion: updateAulaDto.seccion,
      cantidadEstudiantes: updateAulaDto.cantidadEstudiantes,
    };

    if (updateAulaDto.idGrado) {
      updateData.idGrado = { idGrado: updateAulaDto.idGrado };
    }

    await this.aulaRepository.update({ idAula: id }, updateData);
    return this.findOne(id);
  }

  async getAsignacionesDeAula(idAula: string): Promise<AsignacionAula[]> {
    const aula = await this.aulaRepository.findOne({
      where: { idAula: idAula },
      relations: ['asignacionAulas', 'asignacionAulas.idTrabajador'],
    });
    if (!aula) {
      throw new NotFoundException(`Aula with id ${idAula} not found`);
    }
    return aula.asignacionAulas;
  }

  async getAulasDisponiblesConDetalles(idGrado: string): Promise<any[]> {
    const aulasConDetalles = this.aulaRepository
      .createQueryBuilder('aula')
      .innerJoin('aula.idGrado', 'grado')
      .leftJoin('aula.matriculaAula', 'ma', 'ma.estado = :estado', { estado: 'activo' })
      .where('grado.idGrado = :idGrado', { idGrado: idGrado })
      .select([
        'aula.idAula as id_aula',
        'aula.seccion as seccion',
        'grado.grado as grado',
        'aula.cantidadEstudiantes as cantidad_estudiantes',
        'COUNT(ma.idMatricula) as estudiantes_asignados'
      ])
      .groupBy('aula.idAula, aula.seccion, grado.grado, aula.cantidadEstudiantes')
      .orderBy('grado.grado', 'ASC')
      .addOrderBy('aula.seccion', 'ASC')
      .getRawMany();

    const resultado = await aulasConDetalles;

    // Transformar los datos para agregar cupos disponibles
    return resultado.map(aula => ({
      idAula: aula.id_aula,
      seccion: aula.seccion,
      grado: aula.grado,
      cantidadEstudiantes: parseInt(aula.cantidad_estudiantes) || 0,
      estudiantesAsignados: parseInt(aula.estudiantes_asignados) || 0,
      cuposDisponibles: (parseInt(aula.cantidad_estudiantes) || 0) - (parseInt(aula.estudiantes_asignados) || 0)
    }));
  }

  async validarCuposDisponibles(idAula: string): Promise<{ tieneEspacio: boolean, detalles: any }> {
    // Obtener el grado del aula para poder usar getAulasDisponiblesConDetalles
    const aula = await this.aulaRepository.findOne({
      where: { idAula: idAula },
      relations: ['idGrado']
    });

    if (!aula) {
      throw new NotFoundException(`Aula con ID ${idAula} no encontrada`);
    }

    // Usar el método existente para obtener detalles con cupos disponibles
    const aulasConDetalles = await this.getAulasDisponiblesConDetalles(aula.idGrado.idGrado);

    // Buscar el aula específica en los resultados
    const aulaDetallada = aulasConDetalles.find(aulaDetalle => aulaDetalle.idAula === idAula);

    if (!aulaDetallada) {
      return {
        tieneEspacio: false,
        detalles: null
      };
    }

    return {
      tieneEspacio: aulaDetallada.cuposDisponibles > 0,
      detalles: aulaDetallada
    };
  }

  async findAulasPorPensionGrado(): Promise<Aula[]> {
    return await this.aulaRepository
      .createQueryBuilder('aula')
      .innerJoin('aula.idGrado', 'grado')
      .innerJoin('grado.idPension', 'pension')
      .select(['aula', 'grado', 'pension'])
      .getMany();
  }

  async findAulasSinAsignacion(): Promise<Aula[]> {
    return await this.aulaRepository
      .createQueryBuilder('aula')
      .leftJoin('aula.asignacionAulas', 'aa')
      .where('aa.idAsignacionAula IS NULL')
      .getMany();
  }

}
