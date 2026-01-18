import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateTrabajadorDto } from './dto/create-trabajador.dto';
import { CreateTrabajadorTransactionalDto } from './dto/create-trabajador-transactional.dto';
import { UpdateTrabajadorDto } from './dto/update-trabajador.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Trabajador } from './entities/trabajador.entity';
import { DataSource, Repository, In } from 'typeorm';
import { UsuarioService } from '../usuario/usuario.service';
import { Rol } from '../rol/entities/rol.entity';
import { UserRole } from '../enums/roles.enum';
import { SueldoTrabajador } from 'src/sueldo-trabajador/entities/sueldo-trabajador.entity';
import { ContratoTrabajador } from 'src/contrato-trabajador/entities/contrato-trabajador.entity';

@Injectable()
export class TrabajadorService {
  constructor(
    @InjectRepository(Trabajador)
    private readonly trabajadorRepository: Repository<Trabajador>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    private readonly usuarioService: UsuarioService,
    private readonly dataSource: DataSource,
  ) { }

  async createTrabajadorTransactional(
    createTrabajadorTransactionalDto: CreateTrabajadorTransactionalDto,
    currentUserId?: string
  ): Promise<{ success: boolean; message: string; trabajador: Trabajador; contrato?: any; sueldo?: any }> {
    // Validar que el rol existe y es válido para trabajadores
    const rol = await this.rolRepository.findOne({
      where: { idRol: createTrabajadorTransactionalDto.idRol, estaActivo: true },
    });

    if (!rol) {
      throw new BadRequestException(
        'El rol especificado no existe o está inactivo',
      );
    }

    // Validar que el rol es apropiado para trabajadores (no ESTUDIANTE ni APODERADO)
    const rolesValidosParaTrabajadores = [
      UserRole.DIRECTORA,
      UserRole.SECRETARIA,
      UserRole.DOCENTE,
      UserRole.COORDINADOR,
      UserRole.AUXILIAR,
      UserRole.PSICOLOGO,
      UserRole.ADMINISTRADOR,
      UserRole.ESPECIALISTA,
    ];

    if (!rolesValidosParaTrabajadores.includes(rol.nombre as UserRole)) {
      throw new BadRequestException(
        `El rol "${rol.nombre}" no es válido para trabajadores. Roles válidos: ${rolesValidosParaTrabajadores.join(', ')}`,
      );
    }

    // Verificar que no exista un trabajador con el mismo número de documento
    const trabajadorExistente = await this.trabajadorRepository.findOne({
      where: { nroDocumento: createTrabajadorTransactionalDto.nroDocumento },
    });

    if (trabajadorExistente) {
      throw new BadRequestException(
        `Ya existe un trabajador con el número de documento: ${createTrabajadorTransactionalDto.nroDocumento}`,
      );
    }

    // Crear un queryRunner para manejar TODA la transacción completa
    const queryRunner = this.dataSource.createQueryRunner();

    // Establecer conexión y comenzar transacción
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let trabajadorCreado: Trabajador;
    let sueldo, contrato;

    try {
      // 1. Crear usuario dentro de la transacción
      const nuevoUsuario = await this.usuarioService.createWithQueryRunner(
        {
          usuario: createTrabajadorTransactionalDto.nroDocumento,
          contrasena: createTrabajadorTransactionalDto.nroDocumento,
          estaActivo: true,
        },
        queryRunner,
      );

      // 2. Crear trabajador dentro de la transacción
      const trabajador = queryRunner.manager.create(Trabajador, {
        nombre: createTrabajadorTransactionalDto.nombre,
        apellido: createTrabajadorTransactionalDto.apellido,
        tipoDocumento: createTrabajadorTransactionalDto.tipoDocumento,
        nroDocumento: createTrabajadorTransactionalDto.nroDocumento,
        direccion: createTrabajadorTransactionalDto.direccion,
        correo: createTrabajadorTransactionalDto.correo,
        telefono: createTrabajadorTransactionalDto.telefono,
        estaActivo: createTrabajadorTransactionalDto.estaActivo ?? true,
        imagenUrl: createTrabajadorTransactionalDto.imagenUrl,
        idRol: { idRol: createTrabajadorTransactionalDto.idRol } as any,
        idUsuario: { idUsuario: nuevoUsuario.usuario.idUsuario } as any,
      });

      trabajadorCreado = await queryRunner.manager.save(trabajador);

      // 3. Crear sueldo dentro de la misma transacción      
      const sueldoEntity = queryRunner.manager.create(SueldoTrabajador, {
        idTrabajador: { idTrabajador: trabajadorCreado.idTrabajador } as any,
        sueldoBase: createTrabajadorTransactionalDto.sueldoBase.sueldoBase,
        bonificacionFamiliar: createTrabajadorTransactionalDto.sueldoBase.bonificacionFamiliar,
        asignacionFamiliar: createTrabajadorTransactionalDto.sueldoBase.asignacionFamiliar,
        fechaVigenciaDesde: createTrabajadorTransactionalDto.sueldoBase.fechaVigenciaDesde,
        fechaVigenciaHasta: createTrabajadorTransactionalDto.sueldoBase.fechaVigenciaHasta,
        estaActivo: createTrabajadorTransactionalDto.sueldoBase.estaActivo ?? true,
        observaciones: createTrabajadorTransactionalDto.sueldoBase.observaciones,
        creadoPor: { idTrabajador: currentUserId || trabajadorCreado.idTrabajador } as any,
      });

      const sueldoCreado = await queryRunner.manager.save(sueldoEntity);
      sueldo = { sueldo: sueldoCreado };

      const fechaInicioContrato = sueldoCreado.fechaVigenciaDesde;
      const fechaFinContrato = sueldoCreado.fechaVigenciaHasta;
      const sueldoBase = sueldoCreado.sueldoBase;

      // 4. Crear contrato dentro de la misma transacción      
      const contratoEntity = queryRunner.manager.create(ContratoTrabajador, {
        idTrabajador2: { idTrabajador: trabajadorCreado.idTrabajador } as any,
        idTipoContrato: { idTipoContrato: createTrabajadorTransactionalDto.contrato.idTipoContrato } as any,
        numeroContrato: createTrabajadorTransactionalDto.contrato.numeroContrato,
        fechaInicio: fechaInicioContrato ?? createTrabajadorTransactionalDto.contrato.fechaInicio,
        fechaFin: fechaFinContrato ?? createTrabajadorTransactionalDto.contrato.fechaFin,
        fechaFinPeriodoPrueba: createTrabajadorTransactionalDto.contrato.fechaFinPeriodoPrueba,
        sueldoContratado: sueldoBase,
        jornadaLaboral: createTrabajadorTransactionalDto.contrato.jornadaLaboral,
        horasSemanales: createTrabajadorTransactionalDto.contrato.horasSemanales,
        cargoContrato: createTrabajadorTransactionalDto.contrato.cargoContrato,
        descripcionFunciones: createTrabajadorTransactionalDto.contrato.descripcionFunciones,
        lugarTrabajo: createTrabajadorTransactionalDto.contrato.lugarTrabajo,
        estadoContrato: createTrabajadorTransactionalDto.contrato.estadoContrato ?? 'activo',
        archivoContratoUrl: createTrabajadorTransactionalDto.contrato.archivoContratoUrl,
        archivoFirmadoUrl: createTrabajadorTransactionalDto.contrato.archivoFirmadoUrl,
        renovacionAutomatica: createTrabajadorTransactionalDto.contrato.renovacionAutomatica ?? false,
        diasAvisoRenovacion: createTrabajadorTransactionalDto.contrato.diasAvisoRenovacion,
        fechaAprobacion: createTrabajadorTransactionalDto.contrato.fechaAprobacion,
        creadoPor: { idTrabajador: currentUserId || trabajadorCreado.idTrabajador } as any,
        aprobadoPor: { idTrabajador: currentUserId || trabajadorCreado.idTrabajador } as any,
      });

      const contratoCreado = await queryRunner.manager.save(contratoEntity);
      contrato = contratoCreado;

      // Si llegamos hasta aquí, todo salió bien - confirmar la transacción completa
      await queryRunner.commitTransaction();

    } catch (error) {
      // Si cualquier paso falla, hacer rollback de TODA la transacción
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        'Error en la creación transaccional: ' + error.message,
      );
    } finally {
      // Liberar el queryRunner
      await queryRunner.release();
    }

    // Cargar el trabajador completo con relaciones
    const trabajadorCompleto = await this.trabajadorRepository.findOne({
      where: { idTrabajador: trabajadorCreado.idTrabajador },
      relations: ['idRol', 'idUsuario'],
    });

    if (!trabajadorCompleto) {
      throw new BadRequestException('Error al cargar el trabajador creado');
    }

    return {
      success: true,
      message: `Trabajador creado correctamente con rol: ${rol.nombre}. ` +
        `Usuario: ${createTrabajadorTransactionalDto.nroDocumento}, ` +
        `Contraseña temporal: ${createTrabajadorTransactionalDto.nroDocumento}. ` +
        `Sueldo base: ${createTrabajadorTransactionalDto.sueldoBase.sueldoBase}. ` +
        `Contrato: ${createTrabajadorTransactionalDto.contrato.numeroContrato}`,
      trabajador: trabajadorCompleto,
      contrato: contrato,
      sueldo: sueldo,
    };
  }


  async create(
    createTrabajadorDto: CreateTrabajadorDto,
  ): Promise<{ success: boolean; message: string; trabajador: Trabajador }> {
    // Validar que el rol existe y es válido para trabajadores
    const rol = await this.rolRepository.findOne({
      where: { idRol: createTrabajadorDto.idRol, estaActivo: true },
    });

    if (!rol) {
      throw new BadRequestException(
        'El rol especificado no existe o está inactivo',
      );
    }

    // Validar que el rol es apropiado para trabajadores (no ESTUDIANTE ni APODERADO)
    const rolesValidosParaTrabajadores = [
      UserRole.DIRECTORA,
      UserRole.SECRETARIA,
      UserRole.DOCENTE,
      UserRole.COORDINADOR,
      UserRole.AUXILIAR,
      UserRole.PSICOLOGO,
      UserRole.ADMINISTRADOR,
      UserRole.ESPECIALISTA,
    ];

    if (!rolesValidosParaTrabajadores.includes(rol.nombre as UserRole)) {
      throw new BadRequestException(
        `El rol "${rol.nombre}" no es válido para trabajadores. Roles válidos: ${rolesValidosParaTrabajadores.join(', ')}`,
      );
    }

    // Verificar que no exista un trabajador con el mismo número de documento
    const trabajadorExistente = await this.trabajadorRepository.findOne({
      where: { nroDocumento: createTrabajadorDto.nroDocumento },
    });

    if (trabajadorExistente) {
      throw new BadRequestException(
        `Ya existe un trabajador con el número de documento: ${createTrabajadorDto.nroDocumento}`,
      );
    }

    // Crear un queryRunner para manejar la transacción
    const queryRunner = this.dataSource.createQueryRunner();

    // Establecer conexión y comenzar transacción
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear usuario dentro de la transacción
      const nuevoUsuario = await this.usuarioService.createWithQueryRunner(
        {
          usuario: createTrabajadorDto.nroDocumento,
          contrasena: createTrabajadorDto.nroDocumento, // Contraseña temporal = número de documento
          estaActivo: true,
        },
        queryRunner,
      );

      // Crear trabajador dentro de la misma transacción
      const trabajador = queryRunner.manager.create(Trabajador, {
        ...createTrabajadorDto,
        idRol: { idRol: createTrabajadorDto.idRol } as any,
        idUsuario: { idUsuario: nuevoUsuario.usuario.idUsuario } as any,
      });

      const savedTrabajador = await queryRunner.manager.save(trabajador);

      // Si todo sale bien, confirmar la transacción
      await queryRunner.commitTransaction();

      // Cargar el trabajador completo con relaciones
      const trabajadorCompleto = await this.trabajadorRepository.findOne({
        where: { idTrabajador: savedTrabajador.idTrabajador },
        relations: ['idRol', 'idUsuario'],
      });

      if (!trabajadorCompleto) {
        throw new BadRequestException('Error al cargar el trabajador creado');
      }

      return {
        success: true,
        message: `Trabajador creado correctamente con rol: ${rol.nombre}. Usuario: ${createTrabajadorDto.nroDocumento}, Contraseña temporal: ${createTrabajadorDto.nroDocumento}`,
        trabajador: trabajadorCompleto,
      };
    } catch (error) {
      // Si algo falla, hacer rollback
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        'Error al crear trabajador: ' + error.message,
      );
    } finally {
      // Liberar el queryRunner
      await queryRunner.release();
    }
  }

  async findAll(): Promise<{
    sucess: boolean;
    message: string;
    trabajadores: Trabajador[];
  }> {
    const trabajadores = await this.trabajadorRepository.find({
      relations: [
        'idRol',
        'contratoTrabajadors3.idTipoContrato'
      ],
    });
    return {
      sucess: true,
      message: 'Trabajadores encontrados correctamente',
      trabajadores,
    };
  }

  async findOne(id: string): Promise<Trabajador> {
    const trabajador = await this.trabajadorRepository.findOne({
      where: { idTrabajador: id, estaActivo: true },
      relations: [
        // Relaciones principales
        'idRol',
        'idUsuario',
        // Asignaciones
        'asignacionAulas',
        'asignacionAulas.idAula',
        'asignacionAulas.idAula.idGrado',
        'asignacionCursos',
        'asignacionCursos.idCurso',
        // Contratos y seguros
        'contratoTrabajadors3', // Como trabajador
        'seguroTrabajadors2', // Como trabajador asegurado
        'sueldoTrabajadors2', // Como trabajador con sueldo
        // Cronogramas y tareas
        'cronogramas',
        'tareas',
        // Planillas y detalles
        'detallePlanillas',
        'programacionMensuals',
        // Evaluaciones y observaciones como docente
        'evaluacionDocenteBimestrals2',
        'observacionDocentes2',
        // Informes
        'informes',
      ],
    });
    if (!trabajador) {
      throw new NotFoundException(`Trabajador con ID ${id} no encontrado`);
    }
    return trabajador;
  }

  async findByIds(ids: string[]): Promise<Trabajador[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    const trabajadores = await this.trabajadorRepository.find({
      where: {
        idTrabajador: In(ids),
        estaActivo: true,
      },
      relations: ['idRol', 'idUsuario'],
    });

    return trabajadores;
  }

  async update(
    id: string,
    updateTrabajadorDto: UpdateTrabajadorDto,
  ): Promise<{ sucess: boolean; message: string; trabajador: Trabajador }> {
    const trabajador = await this.findOne(id);
    const updateData: any = { ...updateTrabajadorDto };

    if (updateTrabajadorDto.idRol) {
      updateData.idRol = { idRol: updateTrabajadorDto.idRol };
    }

    await this.trabajadorRepository.update(id, updateData);
    const updatedTrabajador = await this.findOne(id);
    return {
      sucess: true,
      message: 'Trabajador actualizado correctamente',
      trabajador: updatedTrabajador,
    };
  }

  async remove(id: string): Promise<{ message: string }> {
    const trabajador = await this.findOne(id);

    // Solo actualizar el campo estaActivo, no todo el objeto trabajador
    await this.trabajadorRepository.update(id, { estaActivo: false });

    return {
      message: `Trabajador ${trabajador.nombre} ${trabajador.apellido} desactivado correctamente`,
    };
  }

  async findAulasPorTrabajador(
    idTrabajador: string,
  ): Promise<{ success: boolean; message: string; aulas: any[] }> {
    try {
      // Validar que el ID del trabajador esté presente
      if (!idTrabajador) {
        throw new BadRequestException('El ID del trabajador es requerido');
      }

      // Ejecutar la consulta SQL personalizada
      const aulas = await this.dataSource.query(
        `
        SELECT t.nombre, au.id_aula, au.seccion, g.grado   
        FROM trabajador t
        INNER JOIN asignacion_aula aa ON aa.id_trabajador = t.id_trabajador 
        INNER JOIN aula au ON au.id_aula = aa.id_aula 
        INNER JOIN grado g ON g.id_grado = au.id_grado 
        WHERE t.id_trabajador = $1
        ORDER BY g.grado, au.seccion;
      `,
        [idTrabajador],
      );

      return {
        success: true,
        message:
          aulas.length > 0
            ? `Se encontraron ${aulas.length} aula(s) asignada(s) al trabajador`
            : 'No se encontraron aulas asignadas a este trabajador',
        aulas,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error al buscar aulas por trabajador: ${error.message}`,
      );
    }
  }

  async findTrabajadorSinDetallePlanilla() {
    return await this.trabajadorRepository.createQueryBuilder('trabajador')
      .leftJoin('trabajador.detallePlanillas', 'detallePlanilla')
      .where('detallePlanilla.idDetallePlanilla IS NULL')
      .andWhere('trabajador.estaActivo = :estaActivo', { estaActivo: true })
      .getMany();
  }

  async findTrabajadorSinDetallePorContratoPlanilla(mes?: number, anio?: number) {
    let queryBuilder = this.trabajadorRepository.createQueryBuilder('trabajador')
      .innerJoinAndSelect('trabajador.contratoTrabajadors3', 'contrato')
      .innerJoinAndSelect('contrato.idTipoContrato', 'tipoContrato')
      .leftJoin('trabajador.detallePlanillas', 'detallePlanilla')
      .leftJoin('detallePlanilla.idPlanillaMensual2', 'planillaMensual')
      .where('tipoContrato.nombreTipo = :nombreTipo', { nombreTipo: 'CONTRATO_PLANILLA' });

    // Si se proporcionan mes y año, filtrar por planilla específica
    if (mes && anio) {
      queryBuilder = queryBuilder
        .andWhere('(planillaMensual.idPlanillaMensual IS NULL OR (planillaMensual.mes != :mes OR planillaMensual.anio != :anio))', { mes, anio });
    } else {
      // Si no se especifica mes/año, buscar trabajadores sin ningún detalle de planilla
      queryBuilder = queryBuilder
        .andWhere('detallePlanilla.idDetallePlanilla IS NULL');
    }

    return await queryBuilder
      .orderBy('trabajador.apellido', 'ASC')
      .addOrderBy('trabajador.nombre', 'ASC')
      .getMany();
  }
}
