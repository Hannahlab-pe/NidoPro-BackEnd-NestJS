import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ActualizarContactosMatriculaDto, CreateMatriculaDto } from './dto/create-matricula.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Matricula } from './entities/matricula.entity';
import { Repository, DataSource, SelectQueryBuilder, Not } from 'typeorm';
import { ApoderadoService } from 'src/apoderado/apoderado.service';
import { EstudianteService } from 'src/estudiante/estudiante.service';
import { GradoService } from 'src/grado/grado.service';
import { SearchMatriculaDto } from './dto/search-matricula.dto';
import { MatriculaAula } from 'src/matricula-aula/entities/matricula-aula.entity';
import { AulaService } from 'src/aula/aula.service';
import { ContactoEmergencia } from 'src/contacto-emergencia/entities/contacto-emergencia.entity';
import { CajaSimpleService } from 'src/caja-simple/caja-simple.service';
import { CrearIngresoPorMatriculaDto } from 'src/caja-simple/dto/crear-movimientos.dto';
import { Apoderado } from 'src/apoderado/entities/apoderado.entity';
import { Estudiante } from 'src/estudiante/entities/estudiante.entity';

@Injectable()
export class MatriculaService {
  constructor(
    @InjectRepository(Matricula)
    private matriculaRepository: Repository<Matricula>,

    private readonly aulaRepository: AulaService,
    private apoderadoService: ApoderadoService,
    private estudianteService: EstudianteService,
    private gradoService: GradoService,
    private cajaSimpleService: CajaSimpleService,
    private dataSource: DataSource
  ) { }

  async create(createMatriculaDto: CreateMatriculaDto): Promise<Matricula> {
    return await this.dataSource.transaction(async (manager) => {
      let apoderado: any = null;
      let estudiante: any = null;

      // === MANEJO DEL APODERADO ===
      if (createMatriculaDto.idApoderado) {
        apoderado = await this.apoderadoService.findOne(
          createMatriculaDto.idApoderado,
        );
      }

      if (!apoderado && createMatriculaDto.apoderadoData?.documentoIdentidad) {
        try {
          apoderado = await this.apoderadoService.findByDocumento(
            createMatriculaDto.apoderadoData.documentoIdentidad,
          );
        } catch (error) {
          apoderado = null;
        }
      }

      if (!apoderado) {
        if (!createMatriculaDto.apoderadoData) {
          throw new BadRequestException(
            'Se requiere proporcionar idApoderado o apoderadoData para crear la matrícula',
          );
        }

        if (
          !createMatriculaDto.apoderadoData.nombre ||
          !createMatriculaDto.apoderadoData.apellido ||
          !createMatriculaDto.apoderadoData.tipoDocumentoIdentidad ||
          !createMatriculaDto.apoderadoData.documentoIdentidad
        ) {
          throw new BadRequestException(
            'Para crear un apoderado son requeridos: nombre, apellido, tipoDocumentoIdentidad y documentoIdentidad',
          );
        }

        const createApoderadoDto: any = {
          nombre: createMatriculaDto.apoderadoData.nombre,
          apellido: createMatriculaDto.apoderadoData.apellido,
          numero: createMatriculaDto.apoderadoData.numero || null,
          correo: createMatriculaDto.apoderadoData.correo || null,
          direccion: createMatriculaDto.apoderadoData.direccion || null,
          tipoDocumentoIdentidad:
            createMatriculaDto.apoderadoData.tipoDocumentoIdentidad,
          documentoIdentidad:
            createMatriculaDto.apoderadoData.documentoIdentidad,
          esPrincipal: createMatriculaDto.apoderadoData.esPrincipal ?? true,
          tipoApoderado:
            createMatriculaDto.apoderadoData.tipoApoderado || 'principal',
        };

        apoderado = await this.apoderadoService.create(createApoderadoDto);
      }

      // === MANEJO DEL ESTUDIANTE ===
      if (createMatriculaDto.idEstudiante) {
        try {
          estudiante = await this.estudianteService.findOne(
            createMatriculaDto.idEstudiante,
          );
        } catch (error) {
          estudiante = null;
        }
      }

      if (!estudiante && createMatriculaDto.estudianteData?.nroDocumento) {
        try {
          estudiante = await this.estudianteService.findByDocumento(
            createMatriculaDto.estudianteData.nroDocumento,
          );
        } catch (error) {
          estudiante = null;
        }
      }

      if (!estudiante) {
        if (!createMatriculaDto.estudianteData) {
          throw new BadRequestException(
            'Se requiere proporcionar idEstudiante o estudianteData para crear la matrícula',
          );
        }

        if (
          !createMatriculaDto.estudianteData.nombre ||
          !createMatriculaDto.estudianteData.apellido ||
          !createMatriculaDto.estudianteData.nroDocumento
        ) {
          throw new BadRequestException(
            'Para crear un estudiante son requeridos: nombre, apellido y nroDocumento',
          );
        }

        const createEstudianteDto: any = {
          nombre: createMatriculaDto.estudianteData.nombre,
          apellido: createMatriculaDto.estudianteData.apellido,
          tipoDocumento:
            createMatriculaDto.estudianteData.tipoDocumento || null,
          nroDocumento: createMatriculaDto.estudianteData.nroDocumento,
          observaciones:
            createMatriculaDto.estudianteData.observaciones || null,
          // Buscar el rol de estudiante dinámicamente
          idRol: null, // Se asignará después
          imagen_estudiante:
            createMatriculaDto.estudianteData.imagen_estudiante || null,
        };

        // Buscar el ID del rol ESTUDIANTE desde la base de datos
        const rolEstudiante = await manager.query(
          "SELECT id_rol FROM rol WHERE LOWER(nombre) = 'estudiante' AND esta_activo = true LIMIT 1"
        );

        if (!rolEstudiante || rolEstudiante.length === 0) {
          throw new BadRequestException('No se encontró el rol de ESTUDIANTE en el sistema');
        }

        createEstudianteDto.idRol = rolEstudiante[0].id_rol;

        const resultadoEstudiante =
          await this.estudianteService.create(createEstudianteDto);
        estudiante = resultadoEstudiante.estudiante || resultadoEstudiante;
      }

      // === CREAR CONTACTOS DE EMERGENCIA ===
      if (createMatriculaDto.estudianteData?.contactosEmergencia && 
          createMatriculaDto.estudianteData.contactosEmergencia.length > 0) {
        for (const contactoData of createMatriculaDto.estudianteData.contactosEmergencia) {
          const contactoEmergencia = new ContactoEmergencia();
          contactoEmergencia.nombre = contactoData.nombre;
          contactoEmergencia.apellido = contactoData.apellido;
          contactoEmergencia.telefono = contactoData.telefono;
          contactoEmergencia.email = contactoData.email || null;
          contactoEmergencia.tipoContacto = contactoData.tipoContacto;
          contactoEmergencia.relacionEstudiante =
            contactoData.relacionEstudiante || contactoData.tipoContacto;
          contactoEmergencia.esPrincipal = contactoData.esPrincipal || false;
          contactoEmergencia.prioridad = contactoData.prioridad || 1;
          contactoEmergencia.idEstudiante = estudiante;

          await manager.save(ContactoEmergencia, contactoEmergencia);
        }
      }

      // === VALIDAR GRADO ===
      const grado = await this.gradoService.findOne(createMatriculaDto.idGrado);
      if (!grado) {
        throw new NotFoundException(
          'Grado no encontrado. Verifique que el ID del grado sea válido',
        );
      }

      // === VALIDAR DUPLICADOS ===
      const anioEscolarActual =
        createMatriculaDto.anioEscolar || new Date().getFullYear().toString();

      const matriculaExistente = await manager.findOne(Matricula, {
        where: {
          idEstudiante: estudiante.idEstudiante,
          anioEscolar: anioEscolarActual,
        },
        relations: ['matriculaAula', 'matriculaAula.aula'],
      });

      if (matriculaExistente) {
        const aulaInfo = matriculaExistente.matriculaAula?.aula
          ? ` en el aula sección ${matriculaExistente.matriculaAula.aula.seccion}`
          : '';
        throw new ConflictException(
          `El estudiante ${estudiante.nombre} ${estudiante.apellido} ya está matriculado en el año escolar ${anioEscolarActual}${aulaInfo}. No se puede registrar dos veces en el mismo año.`,
        );
      }

      // === CREAR MATRÍCULA ===
      const matricula = new Matricula();
      matricula.costoMatricula = createMatriculaDto.costoMatricula || '0';
      matricula.fechaIngreso = createMatriculaDto.fechaIngreso;
      matricula.metodoPago = createMatriculaDto.metodoPago ?? null;
      // Soporte para voucherImg o voucherUrl (compatibilidad)
      matricula.voucherImg = createMatriculaDto.voucherImg || createMatriculaDto.voucherUrl || null;
      matricula.anioEscolar = anioEscolarActual;
      matricula.idApoderado = apoderado;
      matricula.idEstudiante = estudiante;
      matricula.idGrado = grado;

      const matriculaGuardada = await manager.save(Matricula, matricula);

      // === CARGAR MATRÍCULA COMPLETA ===
      const matriculaCompleta = await manager.findOne(Matricula, {
        where: { idMatricula: matriculaGuardada.idMatricula },
        relations: [
          'idApoderado',
          'idEstudiante',
          'idEstudiante.idUsuario',
          'idEstudiante.contactosEmergencia',
          'idGrado',
          'idGrado.idPension',
        ],
      });

      if (!matriculaCompleta) {
        throw new BadRequestException('Error al recuperar la matrícula creada');
      }

      return matriculaCompleta;
    });
  }

  async findEstudiantesConApoderados(): Promise<any[]> {
    return await this.matriculaRepository.find({
      relations: [
        'idEstudiante',
        'idEstudiante.idUsuario',
        'idEstudiante.contactosEmergencia',
        'idApoderado',
        'idGrado',
        'idGrado.idPension',
        'matriculaAula',
        'matriculaAula.aula',
      ],
      select: {
        idMatricula: true,
        fechaIngreso: true,
        costoMatricula: true,
        metodoPago: true,
        voucherImg: true,
        idEstudiante: {
          idEstudiante: true,
          nombre: true,
          apellido: true,
          nroDocumento: true,
          observaciones: true,
          idUsuario: {
            idUsuario: true,
            usuario: true,
            estaActivo: true,
          },
          contactosEmergencia: {
            idContactoEmergencia: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true,
            tipoContacto: true,
            esPrincipal: true,
            prioridad: true,
          },
        },
        idApoderado: {
          idApoderado: true,
          nombre: true,
          apellido: true,
          numero: true,
          correo: true,
          direccion: true,
          documentoIdentidad: true,
          esPrincipal: true,
          tipoApoderado: true,
        },
        idGrado: {
          idGrado: true,
          grado: true,
          descripcion: true,
          idPension: {
            idPension: true,
            monto: true,
          },
        },
      },
    });
  }

  //MÉTODO PARA OBTENER ESTUDIANTES CON PADRE Y MADRE
  async findEstudiantesConPadres(): Promise<any[]> {
    return await this.matriculaRepository
      .createQueryBuilder('matricula')
      .leftJoinAndSelect('matricula.idEstudiante', 'estudiante')
      .leftJoinAndSelect('matricula.idApoderado', 'apoderado')
      .leftJoinAndSelect('matricula.idGrado', 'grado')
      .leftJoinAndSelect('matricula.matriculaAula', 'matriculaAula')
      .leftJoinAndSelect('matriculaAula.aula', 'aula')
      .leftJoinAndSelect('estudiante.contactosEmergencia', 'contactos')
      .leftJoinAndSelect('estudiante.idUsuario', 'usuario')
      .where('contactos.tipoContacto IN (:...tipos)', {
        tipos: ['padre', 'madre'],
      })
      .andWhere('contactos.estaActivo = :activo', { activo: true })
      .orderBy('contactos.prioridad', 'ASC')
      .addOrderBy('matricula.fechaIngreso', 'DESC')
      .getMany();
  }

  // MÉTODO PARA OBTENER SOLO CONTACTO PRINCIPAL
  async findEstudiantesConContactoPrincipal(): Promise<any[]> {
    return await this.matriculaRepository
      .createQueryBuilder('matricula')
      .leftJoinAndSelect('matricula.idEstudiante', 'estudiante')
      .leftJoinAndSelect('matricula.idApoderado', 'apoderado')
      .leftJoinAndSelect('matricula.idGrado', 'grado')
      .leftJoinAndSelect('matricula.matriculaAula', 'matriculaAula')
      .leftJoinAndSelect('matriculaAula.aula', 'aula')
      .leftJoinAndSelect('estudiante.contactosEmergencia', 'contactos')
      .leftJoinAndSelect('estudiante.idUsuario', 'usuario')
      .where('contactos.esPrincipal = :principal', { principal: true })
      .andWhere('contactos.estaActivo = :activo', { activo: true })
      .orderBy('matricula.fechaIngreso', 'DESC')
      .getMany();
  }

  // MÉTODO PARA OBTENER SOLO APODERADOS PRINCIPALES ===
  async findEstudiantesConApoderadosPrincipales(): Promise<any[]> {
    return await this.matriculaRepository
      .createQueryBuilder('matricula')
      .leftJoinAndSelect('matricula.idEstudiante', 'estudiante')
      .leftJoinAndSelect('matricula.idApoderado', 'apoderado')
      .leftJoinAndSelect('matricula.idGrado', 'grado')
      .leftJoinAndSelect('matricula.matriculaAula', 'matriculaAula')
      .leftJoinAndSelect('matriculaAula.aula', 'aula')
      .leftJoinAndSelect('estudiante.idUsuario', 'usuario')
      .leftJoinAndSelect('estudiante.contactosEmergencia', 'contactos')
      .where('apoderado.esPrincipal = :principal', { principal: true })
      .orderBy('matricula.fechaIngreso', 'DESC')
      .getMany();
  }

  async findAll(): Promise<Matricula[]> {
    return await this.matriculaRepository.find();
  }

  async findOne(id: string): Promise<Matricula | null> {
    return await this.matriculaRepository.findOne({
      where: { idMatricula: id },
      relations: [
        'idApoderado',
        'idEstudiante',
        'idEstudiante.idUsuario',
        'idEstudiante.contactosEmergencia',
        'idGrado',
        'idGrado.idPension',
        'matriculaAula',
        'matriculaAula.aula',
      ],
    });
  }

  remove(id: string) {
    return `This action removes a #${id} matricula`;
  }

  async search(searchDto: SearchMatriculaDto) {
    const {
      fechaIngresoDesde,
      fechaIngresoHasta,
      idGrado,
      idEstudiante,
      dniEstudiante,
      idApoderado,
      dniApoderado,
      metodoPago,
      costoMinimo,
      costoMaximo,
      nombreEstudiante,
      apellidoEstudiante,
      nombreApoderado,
      page = 1,
      limit = 10,
      sortBy = 'fechaIngreso',
      sortOrder = 'DESC',
    } = searchDto;

    let queryBuilder: SelectQueryBuilder<Matricula> = this.matriculaRepository
      .createQueryBuilder('matricula')
      .leftJoinAndSelect('matricula.idEstudiante', 'estudiante')
      .leftJoinAndSelect('matricula.idApoderado', 'apoderado')
      .leftJoinAndSelect('matricula.idGrado', 'grado')
      .leftJoinAndSelect('estudiante.idUsuario', 'usuario')
      .leftJoinAndSelect('estudiante.contactosEmergencia', 'contactos')
      .leftJoinAndSelect('matricula.matriculaAula', 'matriculaAula')
      .leftJoinAndSelect('matriculaAula.aula', 'aula');

    if (fechaIngresoDesde) {
      queryBuilder = queryBuilder.andWhere(
        'matricula.fechaIngreso >= :fechaDesde',
        {
          fechaDesde: fechaIngresoDesde,
        },
      );
    }

    if (fechaIngresoHasta) {
      queryBuilder = queryBuilder.andWhere(
        'matricula.fechaIngreso <= :fechaHasta',
        {
          fechaHasta: fechaIngresoHasta,
        },
      );
    }

    if (idGrado) {
      queryBuilder = queryBuilder.andWhere('matricula.idGrado = :idGrado', {
        idGrado,
      });
    }

    if (idEstudiante) {
      queryBuilder = queryBuilder.andWhere(
        'matricula.idEstudiante = :idEstudiante',
        { idEstudiante },
      );
    }

    if (idApoderado) {
      queryBuilder = queryBuilder.andWhere(
        'matricula.idApoderado = :idApoderado',
        { idApoderado },
      );
    }

    if (dniEstudiante) {
      queryBuilder = queryBuilder.andWhere(
        'estudiante.nroDocumento = :dniEstudiante',
        { dniEstudiante },
      );
    }

    if (dniApoderado) {
      queryBuilder = queryBuilder.andWhere(
        'apoderado.documentoIdentidad = :dniApoderado',
        { dniApoderado },
      );
    }

    if (metodoPago) {
      queryBuilder = queryBuilder.andWhere(
        'matricula.metodoPago = :metodoPago',
        { metodoPago },
      );
    }

    if (costoMinimo) {
      queryBuilder = queryBuilder.andWhere(
        'matricula.costoMatricula >= :costoMinimo',
        { costoMinimo },
      );
    }

    if (costoMaximo) {
      queryBuilder = queryBuilder.andWhere(
        'matricula.costoMatricula <= :costoMaximo',
        { costoMaximo },
      );
    }

    if (nombreEstudiante) {
      queryBuilder = queryBuilder.andWhere(
        'LOWER(estudiante.nombre) LIKE LOWER(:nombreEstudiante)',
        {
          nombreEstudiante: `%${nombreEstudiante}%`,
        },
      );
    }

    if (apellidoEstudiante) {
      queryBuilder = queryBuilder.andWhere(
        'LOWER(estudiante.apellido) LIKE LOWER(:apellidoEstudiante)',
        {
          apellidoEstudiante: `%${apellidoEstudiante}%`,
        },
      );
    }

    if (nombreApoderado) {
      queryBuilder = queryBuilder.andWhere(
        'LOWER(apoderado.nombre) LIKE LOWER(:nombreApoderado)',
        {
          nombreApoderado: `%${nombreApoderado}%`,
        },
      );
    }

    switch (sortBy) {
      case 'fechaIngreso':
        queryBuilder = queryBuilder.orderBy(
          'matricula.fechaIngreso',
          sortOrder,
        );
        break;
      case 'costoMatricula':
        queryBuilder = queryBuilder.orderBy(
          'matricula.costoMatricula',
          sortOrder,
        );
        break;
      case 'nombreEstudiante':
        queryBuilder = queryBuilder.orderBy('estudiante.nombre', sortOrder);
        break;
      case 'nombreApoderado':
        queryBuilder = queryBuilder.orderBy('apoderado.nombre', sortOrder);
        break;
      default:
        queryBuilder = queryBuilder.orderBy('matricula.fechaIngreso', 'DESC');
    }

    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).take(limit);

    const [matriculas, total] = await queryBuilder.getManyAndCount();

    return {
      data: matriculas,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
      filters: {
        applied: this.getAppliedFilters(searchDto),
        total: this.countAppliedFilters(searchDto),
      },
    };
  }

  private getAppliedFilters(searchDto: SearchMatriculaDto): string[] {
    const appliedFilters: string[] = [];

    if (searchDto.fechaIngresoDesde) appliedFilters.push('Fecha desde');
    if (searchDto.fechaIngresoHasta) appliedFilters.push('Fecha hasta');
    if (searchDto.idGrado) appliedFilters.push('Grado');
    if (searchDto.dniEstudiante) appliedFilters.push('DNI estudiante');
    if (searchDto.dniApoderado) appliedFilters.push('DNI apoderado');
    if (searchDto.metodoPago) appliedFilters.push('Método de pago');
    if (searchDto.costoMinimo) appliedFilters.push('Costo mínimo');
    if (searchDto.costoMaximo) appliedFilters.push('Costo máximo');
    if (searchDto.nombreEstudiante) appliedFilters.push('Nombre estudiante');
    if (searchDto.apellidoEstudiante)
      appliedFilters.push('Apellido estudiante');
    if (searchDto.nombreApoderado) appliedFilters.push('Nombre apoderado');

    return appliedFilters;
  }

  private countAppliedFilters(searchDto: SearchMatriculaDto): number {
    return this.getAppliedFilters(searchDto).length;
  }

  // MÉTODO PARA BÚSQUEDA RÁPIDA
  async quickSearch(term: string, limit: number = 5) {
    return await this.matriculaRepository
      .createQueryBuilder('matricula')
      .leftJoinAndSelect('matricula.idEstudiante', 'estudiante')
      .leftJoinAndSelect('matricula.idApoderado', 'apoderado')
      .leftJoinAndSelect('matricula.idGrado', 'grado')
      .leftJoinAndSelect('estudiante.idUsuario', 'usuario')
      .leftJoinAndSelect('estudiante.contactosEmergencia', 'contactos')
      .leftJoinAndSelect('matricula.matriculaAula', 'matriculaAula')
      .leftJoinAndSelect('matriculaAula.aula', 'aula')
      .where('LOWER(estudiante.nombre) LIKE LOWER(:term)', {
        term: `%${term}%`,
      })
      .orWhere('LOWER(estudiante.apellido) LIKE LOWER(:term)', {
        term: `%${term}%`,
      })
      .orWhere('LOWER(apoderado.nombre) LIKE LOWER(:term)', {
        term: `%${term}%`,
      })
      .orWhere('estudiante.nroDocumento LIKE :term', { term: `%${term}%` })
      .orWhere('apoderado.documentoIdentidad LIKE :term', { term: `%${term}%` })
      .orderBy('matricula.fechaIngreso', 'DESC')
      .take(limit)
      .getMany();
  }
  //MÉTODO PARA VERIFICAR SI UN ESTUDIANTE YA ESTÁ MATRICULADO EN UN AÑO
  async verificarMatriculaExistente(
    idEstudiante: string,
    anioEscolar?: string,
  ): Promise<{
    existeMatricula: boolean;
    matricula?: Matricula;
    detalles?: string;
  }> {
    const anio = anioEscolar || new Date().getFullYear().toString();

    const matriculaExistente = await this.matriculaRepository.findOne({
      where: {
        idEstudiante: { idEstudiante },
        anioEscolar: anio,
      },
      relations: [
        'idEstudiante',
        'idGrado',
        'matriculaAula',
        'matriculaAula.aula',
      ],
    });

    if (matriculaExistente) {
      const aulaInfo = matriculaExistente.matriculaAula?.aula
        ? ` - Aula: Sección ${matriculaExistente.matriculaAula.aula.seccion}`
        : '';

      return {
        existeMatricula: true,
        matricula: matriculaExistente,
        detalles: `Estudiante ya matriculado en ${anio} - Grado: ${matriculaExistente.idGrado.grado}${aulaInfo}`,
      };
    }

    return { existeMatricula: false };
  }

  // MÉTODO PARA OBTENER MATRÍCULAS POR AÑO ESCOLAR 
  async findMatriculasPorAnio(anioEscolar: string): Promise<Matricula[]> {
    return await this.matriculaRepository.find({
      where: { anioEscolar },
      relations: [
        'idApoderado',
        'idEstudiante',
        'idEstudiante.idUsuario',
        'idEstudiante.contactosEmergencia',
        'idGrado',
        'idGrado.idPension',
        'matriculaAula',
        'matriculaAula.aula',
      ],
      order: {
        fechaIngreso: 'DESC',
      },
    });
  }

  async findEstudiantesMatriculadosParaPensiones(anioEscolar: number) {
    return this.matriculaRepository
      .createQueryBuilder('matricula')
      .leftJoinAndSelect('matricula.idEstudiante', 'estudiante')
      .leftJoinAndSelect('matricula.idGrado', 'grado')
      .leftJoinAndSelect('grado.idPension', 'pension')
      .where('EXTRACT(YEAR FROM matricula.fechaIngreso) = :anio', {
        anio: anioEscolar,
      })
      .andWhere('grado.estaActivo = :gradoActivo', { gradoActivo: true })
      .andWhere('pension.idPension IS NOT NULL')
      .select([
        'matricula.idMatricula',
        'matricula.fechaIngreso',
        'estudiante.idEstudiante',
        'estudiante.nombre',
        'estudiante.apellido',
        'grado.idGrado',
        'grado.grado',
        'pension.idPension',
        'pension.monto',
      ])
      .getMany();
  }


  async registrarMatriculaEnCajaSimple(
    idMatricula: string,
    registradoPor: string,
    numeroComprobante?: string
  ): Promise<any> {
    try {
      // Buscar la matrícula completa
      const matricula = await this.findOne(idMatricula);

      if (!matricula) {
        throw new NotFoundException('Matrícula no encontrada');
      }

      // Verificar que tiene costo
      if (!matricula.costoMatricula || parseFloat(matricula.costoMatricula) <= 0) {
        throw new BadRequestException('La matrícula no tiene un costo válido para registrar en caja simple');
      }

      // Validar que el registradoPor existe en la tabla trabajador
      const trabajadorExiste = await this.dataSource.query(
        'SELECT id_trabajador FROM trabajador WHERE id_trabajador = $1',
        [registradoPor]
      );

      if (!trabajadorExiste || trabajadorExiste.length === 0) {
        throw new BadRequestException(`El trabajador con ID ${registradoPor} no existe en el sistema`);
      }

      // Preparar datos para el registro en caja simple
      const registroCajaDto: CrearIngresoPorMatriculaDto = {
        idEstudiante: matricula.idEstudiante.idEstudiante,
        monto: parseFloat(matricula.costoMatricula),
        metodoPago: matricula.metodoPago || 'EFECTIVO',
        numeroComprobante: numeroComprobante ||
          (matricula.voucherImg ? `MAT-${matricula.idMatricula.substring(0, 8)}` : undefined),
        registradoPor: registradoPor,
        periodoEscolar: new Date(matricula.fechaIngreso).getFullYear().toString()
      };

      const movimientoCaja = await this.cajaSimpleService.crearIngresoPorMatricula(registroCajaDto);

      return {
        success: true,
        message: 'Matrícula registrada exitosamente en caja simple',
        matricula: {
          id: matricula.idMatricula,
          estudiante: `${matricula.idEstudiante.nombre} ${matricula.idEstudiante.apellido}`,
          costo: matricula.costoMatricula,
          fecha: matricula.fechaIngreso
        },
        movimientoCaja: {
          id: movimientoCaja.idMovimiento,
          numeroTransaccion: movimientoCaja.numeroTransaccion,
          fecha: movimientoCaja.fecha,
          monto: movimientoCaja.monto
        }
      };
    } catch (error) {
      throw new BadRequestException(`No se pudo registrar la matrícula en caja simple: ${error.message}`);
    }
  }

  async getMatriculasSinRegistroEnCaja(): Promise<any[]> {
    const matriculas = await this.matriculaRepository
      .createQueryBuilder('matricula')
      .leftJoinAndSelect('matricula.idEstudiante', 'estudiante')
      .leftJoinAndSelect('matricula.idGrado', 'grado')
      .leftJoin('caja_simple', 'caja',
        'caja.id_estudiante = matricula.id_estudiante AND caja.categoria = :categoria',
        { categoria: 'MATRICULA' })
      .where('matricula.costoMatricula > :costo', { costo: 0 })
      .andWhere('caja.id_movimiento IS NULL')
      .select([
        'matricula.idMatricula',
        'matricula.costoMatricula',
        'matricula.fechaIngreso',
        'matricula.metodoPago',
        'matricula.voucherImg',
        'estudiante.idEstudiante',
        'estudiante.nombre',
        'estudiante.apellido',
        'grado.grado'
      ])
      .orderBy('matricula.fechaIngreso', 'DESC')
      .getMany();

    return matriculas.map(m => ({
      idMatricula: m.idMatricula,
      estudiante: `${m.idEstudiante.nombre} ${m.idEstudiante.apellido}`,
      grado: m.idGrado.grado,
      costo: m.costoMatricula,
      fecha: m.fechaIngreso,
      metodoPago: m.metodoPago,
      tieneVoucher: !!m.voucherImg
    }));
  }

  async actualizarDatosContacto(idMatricula: string, updateData: ActualizarContactosMatriculaDto) {
    return await this.dataSource.transaction(async (manager) => {

      // 1. Buscar matrícula con relaciones
      const matricula = await this.findOne(idMatricula);
      if (!matricula) {
        throw new NotFoundException('Matrícula no encontrada');
      }

      // 2. Actualizar datos del apoderado (solo campos permitidos: numero, direccion, correo)
      if (updateData.apoderadoData) {
        const updateApoderadoData: any = {};

        // Solo permitir actualizar estos campos específicos
        if (updateData.apoderadoData.numero !== undefined) {
          updateApoderadoData.numero = updateData.apoderadoData.numero;
        }
        if (updateData.apoderadoData.direccion !== undefined) {
          updateApoderadoData.direccion = updateData.apoderadoData.direccion;
        }
        if (updateData.apoderadoData.correo !== undefined) {
          updateApoderadoData.correo = updateData.apoderadoData.correo;
        }

        // Actualizar solo si hay campos válidos para actualizar
        if (Object.keys(updateApoderadoData).length > 0) {
          await manager.query(
            `UPDATE apoderado SET 
             numero = COALESCE($1, numero),
             direccion = COALESCE($2, direccion), 
             correo = COALESCE($3, correo)
             WHERE id_apoderado = $4`,
            [
              updateApoderadoData.numero || null,
              updateApoderadoData.direccion || null,
              updateApoderadoData.correo || null,
              matricula.idApoderado.idApoderado
            ]
          );

        }
      }

      // 2.1. Actualizar datos del estudiante (solo nombre y apellido)
      if (updateData.estudianteData) {
        const updateEstudianteData: any = {};

        // Solo permitir actualizar nombre y apellido
        if (updateData.estudianteData.nombre !== undefined) {
          updateEstudianteData.nombre = updateData.estudianteData.nombre;
        }
        if (updateData.estudianteData.apellido !== undefined) {
          updateEstudianteData.apellido = updateData.estudianteData.apellido;
        }

        // Actualizar solo si hay campos válidos para actualizar
        if (Object.keys(updateEstudianteData).length > 0) {
          await manager.query(
            `UPDATE estudiante SET 
             nombre = COALESCE($1, nombre),
             apellido = COALESCE($2, apellido)
             WHERE id_estudiante = $3`,
            [
              updateEstudianteData.nombre || null,
              updateEstudianteData.apellido || null,
              matricula.idEstudiante.idEstudiante
            ]
          );

        }
      }

      // 3. Gestionar contactos de emergencia existentes
      if (updateData.contactosEmergencia) {
        for (const contacto of updateData.contactosEmergencia) {
          if (contacto.idContactoEmergencia) {
            if (contacto.desactivar) {
              // Desactivar contacto (eliminado lógico)
              await manager.update(ContactoEmergencia, contacto.idContactoEmergencia, {
                estaActivo: false
              });
            } else {
              // Actualizar contacto existente
              const { idContactoEmergencia, desactivar, ...datosContacto } = contacto;
              await manager.update(ContactoEmergencia, idContactoEmergencia, {
                ...datosContacto,
                idEstudiante: matricula.idEstudiante
              });
            }
          } else {
            console.log('⚠️ Se intentó actualizar un contacto sin ID, ignorando...');
          }
        }
      }

      // 4. Crear nuevos contactos de emergencia
      if (updateData.nuevosContactos) {
        for (const nuevoContacto of updateData.nuevosContactos) {
          const contacto = new ContactoEmergencia();
          contacto.nombre = nuevoContacto.nombre;
          contacto.apellido = nuevoContacto.apellido;
          contacto.telefono = nuevoContacto.telefono;
          contacto.email = nuevoContacto.email || null;
          contacto.tipoContacto = nuevoContacto.tipoContacto;
          contacto.relacionEstudiante = nuevoContacto.relacionEstudiante || nuevoContacto.tipoContacto;
          contacto.esPrincipal = nuevoContacto.esPrincipal || false;
          contacto.prioridad = nuevoContacto.prioridad || 1;
          contacto.idEstudiante = matricula.idEstudiante;

          const contactoGuardado = await manager.save(ContactoEmergencia, contacto);
        }
      }

      // 5. Retornar matrícula actualizada con todos los datos
      return await this.findOne(idMatricula);
    });
  }

  async AnularMatricula(idMatricula: string): Promise<any> {
    const matriculaFound = await this.matriculaRepository.findOne({
      where: { idMatricula },
      relations: ['idApoderado', 'idEstudiante']
    });
    if (!matriculaFound) {
      throw new NotFoundException('Matrícula no encontrada');
    }
    try {

      //VALIDAMOS ELIMINACION DE APODERADO
      const tieneOtrasMatriculas = await this.matriculaRepository
        .createQueryBuilder('matricula')
        .where('matricula.idApoderado = :idApoderado', {
          idApoderado: matriculaFound.idApoderado.idApoderado
        })
        .andWhere('matricula.idMatricula != :idMatricula', {
          idMatricula
        })
        .getCount();

      //VALIDAREMOS PRIMERO SI TIENE OTRA MATRICULA Y ELIMINAREMOS SI ES LA UNICA
      await this.dataSource.transaction(async (manager) => {
        if (tieneOtrasMatriculas === 0) {
          //Buscaremos al apoderado en base a la matricula que se identifico
          const apoderado = await manager.findOne(Apoderado, {
            where: { idApoderado: matriculaFound.idApoderado.idApoderado }
          });
          //ELIMINAR APODERADO
          await manager.delete(Apoderado, { idApoderado: apoderado?.idApoderado });

          //Buscamos estudiante en base a la matricula que se identifico
          const estudiante = await manager.findOne(Estudiante, {
            where: { idEstudiante: matriculaFound.idEstudiante.idEstudiante }
          });

          //VERIFICAMOS SI EL ESTUDIANTE ESTA ASIGNADO A UN AULA EN MATRICULA_AULA
          const asignacionAula = await manager.findOne(MatriculaAula, {
            where: { idMatricula: idMatricula }
          });

          if (asignacionAula) {
            await manager.delete(MatriculaAula, { idMatricula: asignacionAula.idMatricula });
          }

          // ELIMINAR REGISTROS EN CAJA SIMPLE RELACIONADOS CON EL ESTUDIANTE
          await manager.query(
            'DELETE FROM caja_simple WHERE id_estudiante = $1',
            [estudiante?.idEstudiante]
          );

          // ELIMINAR CONTACTOS DE EMERGENCIA DEL ESTUDIANTE
          await manager.query(
            'DELETE FROM contacto_emergencia WHERE id_estudiante = $1',
            [estudiante?.idEstudiante]
          );

          // ELIMINAR ESTUDIANTE
          await manager.delete(Estudiante, { idEstudiante: estudiante?.idEstudiante });

          //ELIMINAR MATRÍCULA
          await manager.delete(Matricula, { idMatricula });

        }
        else {
          //Buscamos estudiante en base a la matricula que se identifico
          const estudiante = await manager.findOne(Estudiante, {
            where: { idEstudiante: matriculaFound.idEstudiante.idEstudiante }
          });

          // VERIFICAR Y ELIMINAR ASIGNACIÓN DE AULA
          const asignacionAula = await manager.findOne(MatriculaAula, {
            where: { idMatricula: idMatricula }
          });

          if (asignacionAula) {
            await manager.delete(MatriculaAula, { idMatricula: asignacionAula.idMatricula });
          }

          // ELIMINAR REGISTROS EN CAJA SIMPLE RELACIONADOS CON EL ESTUDIANTE
          await manager.query(
            'DELETE FROM caja_simple WHERE id_estudiante = $1',
            [estudiante?.idEstudiante]
          );

          // ELIMINAR CONTACTOS DE EMERGENCIA DEL ESTUDIANTE
          await manager.query(
            'DELETE FROM contacto_emergencia WHERE id_estudiante = $1',
            [estudiante?.idEstudiante]
          );

          //ELIMINAR MATRÍCULA
          await manager.delete(Matricula, { idMatricula });

          // ELIMINAR ESTUDIANTE
          await manager.delete(Estudiante, { idEstudiante: estudiante?.idEstudiante });

        }
      });

      return { message: `Matrícula anulada correctamente: ${idMatricula}` };


    } catch (error) {
      throw new InternalServerErrorException('Error al anular matrícula');
    }
  }

  // ===== NUEVO: ASIGNAR AULA A MATRÍCULA =====
  async asignarAula(idMatricula: string, idAula: string): Promise<any> {
    return await this.dataSource.transaction(async (manager) => {
      // Verificar que la matrícula existe
      const matricula = await manager.findOne(Matricula, {
        where: { idMatricula },
        relations: ['idGrado', 'idEstudiante', 'matriculaAula'],
      });

      if (!matricula) {
        throw new NotFoundException('Matrícula no encontrada');
      }

      // Verificar si ya tiene aula asignada
      if (matricula.matriculaAula) {
        throw new BadRequestException(
          `Esta matrícula ya tiene asignada el aula sección ${matricula.matriculaAula.aula?.seccion || 'N/A'}. ` +
          `Use el endpoint de actualización para cambiarla.`
        );
      }

      // Verificar que el aula existe y pertenece al grado correcto
      const aulaEspecifica = await this.aulaRepository.aulaEspecifica(
        idAula,
        matricula.idGrado.idGrado,
      );

      if (!aulaEspecifica) {
        throw new NotFoundException(
          'El aula especificada no existe o no pertenece al grado de la matrícula',
        );
      }

      // Validar cupos disponibles
      const validacionCupos = await this.aulaRepository.validarCuposDisponibles(idAula);

      if (!validacionCupos.tieneEspacio) {
        throw new BadRequestException(
          `El aula sección ${validacionCupos.detalles?.seccion || 'desconocida'} no tiene cupos disponibles. ` +
          `Capacidad: ${validacionCupos.detalles?.cantidadEstudiantes || 0}, ` +
          `Asignados: ${validacionCupos.detalles?.estudiantesAsignados || 0}, ` +
          `Cupos disponibles: ${validacionCupos.detalles?.cuposDisponibles || 0}`
        );
      }

      // Crear la asignación
      const asignacionAula = new MatriculaAula();
      asignacionAula.idMatricula = idMatricula;
      asignacionAula.idAula = idAula;
      asignacionAula.fechaAsignacion = new Date().toISOString().split('T')[0];
      asignacionAula.estado = 'activo';

      const asignacionGuardada = await manager.save(MatriculaAula, asignacionAula);

      // Cargar la asignación completa
      const asignacionCompleta = await manager.findOne(MatriculaAula, {
        where: { idMatriculaAula: asignacionGuardada.idMatriculaAula },
        relations: ['aula', 'aula.idGrado'],
      });

      if (!asignacionCompleta) {
        throw new BadRequestException('Error al cargar la asignación del aula');
      }

      return {
        success: true,
        message: 'Aula asignada correctamente',
        asignacion: {
          idMatriculaAula: asignacionCompleta.idMatriculaAula,
          estudiante: `${matricula.idEstudiante.nombre} ${matricula.idEstudiante.apellido}`,
          aula: {
            idAula: asignacionCompleta.aula.idAula,
            seccion: asignacionCompleta.aula.seccion,
            grado: asignacionCompleta.aula.idGrado.grado,
          },
          fechaAsignacion: asignacionCompleta.fechaAsignacion,
        },
      };
    });
  }

}
