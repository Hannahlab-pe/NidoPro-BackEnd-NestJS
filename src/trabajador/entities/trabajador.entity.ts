import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { AsignacionAula } from 'src/asignacion-aula/entities/asignacion-aula.entity';
import { AsignacionCurso } from 'src/asignacion-curso/entities/asignacion-curso.entity';
import { ContratoTrabajador } from 'src/contrato-trabajador/entities/contrato-trabajador.entity';
import { Cronograma } from 'src/cronograma/entities/cronograma.entity';
import { DetallePlanilla } from 'src/detalle-planilla/entities/detalle-planilla.entity';
import { EvaluacionDocenteBimestral } from 'src/evualuacion-docente-bimestral/entities/evualuacion-docente-bimestral.entity';
import { HistorialContrato } from 'src/historial-contrato/entities/historial-contrato.entity';
import { Informe } from 'src/informe/entities/informe.entity';
import { ObservacionDocente } from 'src/observacion-docente/entities/observacion-docente.entity';
import { PensionEstudiante } from 'src/pension-estudiante/entities/pension-estudiante.entity';
import { PlanillaMensual } from 'src/planilla-mensual/entities/planilla-mensual.entity';
import { ProgramacionMensual } from 'src/programacion-mensual/entities/programacion-mensual.entity';
import { RenovacionContrato } from 'src/renovacion-contrato/entities/renovacion-contrato.entity';
import { Rol } from 'src/rol/entities/rol.entity';
import { SeguroTrabajador } from 'src/seguro-trabajador/entities/seguro-trabajador.entity';
import { SueldoTrabajador } from 'src/sueldo-trabajador/entities/sueldo-trabajador.entity';
import { Tarea } from 'src/tarea/entities/tarea.entity';
import { Notificacion } from 'src/notificacion/entities/notificacion.entity';
import { AsignacionDocenteCursoAula } from 'src/asignacion-docente-curso-aula/entities/asignacion-docente-curso-aula.entity';

@Index(
  'idx_trabajador_info',
  ['apellido', 'estaActivo', 'nombre', 'nroDocumento', 'tipoDocumento'],
  {},
)
@Index('idx_trabajador_contacto', ['correo', 'telefono'], {})
@Index('trabajador_correo_key', ['correo'], { unique: true })
@Index('trabajador_pkey', ['idTrabajador'], { unique: true })
@Index('trabajador_nro_documento_key', ['nroDocumento'], { unique: true })
@Index('trabajador_telefono_key', ['telefono'], { unique: true })
@Entity('trabajador', { schema: 'public' })
export class Trabajador {
  @Column('uuid', {
    primary: true,
    name: 'id_trabajador',
    default: () => 'uuid_generate_v4()',
  })
  idTrabajador: string;

  @Column('character varying', { name: 'nombre', length: 100 })
  nombre: string;

  @Column('character varying', { name: 'apellido', length: 100 })
  apellido: string;

  @Column('character varying', { name: 'tipo_documento', length: 20 })
  tipoDocumento: string;

  @Column('character varying', {
    name: 'nro_documento',
    unique: true,
    length: 20,
  })
  nroDocumento: string;

  @Column('text', { name: 'direccion', nullable: true })
  direccion: string | null;

  @Column('character varying', {
    name: 'correo',
    nullable: true,
    unique: true,
    length: 255,
  })
  correo: string | null;

  @Column('character varying', {
    name: 'telefono',
    nullable: true,
    unique: true,
    length: 20,
  })
  telefono: string | null;

  @Column('boolean', {
    name: 'esta_activo',
    nullable: true,
    default: () => 'true',
  })
  estaActivo: boolean | null;

  @Column('text', { name: 'imagen_url', nullable: true })
  imagenUrl: string | null;

  @OneToMany(
    () => AsignacionAula,
    (asignacionAula) => asignacionAula.idTrabajador,
  )
  asignacionAulas: AsignacionAula[];

  @OneToMany(
    () => AsignacionCurso,
    (asignacionCurso) => asignacionCurso.idTrabajador,
  )
  asignacionCursos: AsignacionCurso[];

  @OneToMany(
    () => AsignacionDocenteCursoAula,
    (asignacionDocenteCursoAula) => asignacionDocenteCursoAula.idTrabajador,
  )
  asignacionDocenteCursoAulas: AsignacionDocenteCursoAula[];

  @OneToMany(
    () => ContratoTrabajador,
    (contratoTrabajador) => contratoTrabajador.aprobadoPor,
  )
  contratoTrabajadors: ContratoTrabajador[];

  @OneToMany(
    () => ContratoTrabajador,
    (contratoTrabajador) => contratoTrabajador.creadoPor,
  )
  contratoTrabajadors2: ContratoTrabajador[];

  @OneToMany(
    () => ContratoTrabajador,
    (contratoTrabajador) => contratoTrabajador.idTrabajador2,
  )
  contratoTrabajadors3: ContratoTrabajador[];

  @OneToMany(() => Cronograma, (cronograma) => cronograma.idTrabajador)
  cronogramas: Cronograma[];

  @OneToMany(
    () => DetallePlanilla,
    (detallePlanilla) => detallePlanilla.idTrabajador2,
  )
  detallePlanillas: DetallePlanilla[];

  @OneToMany(
    () => EvaluacionDocenteBimestral,
    (evaluacionDocenteBimestral) => evaluacionDocenteBimestral.idCoordinador,
  )
  evaluacionDocenteBimestrals: EvaluacionDocenteBimestral[];

  @OneToMany(
    () => EvaluacionDocenteBimestral,
    (evaluacionDocenteBimestral) => evaluacionDocenteBimestral.idTrabajador2,
  )
  evaluacionDocenteBimestrals2: EvaluacionDocenteBimestral[];

  @OneToMany(
    () => HistorialContrato,
    (historialContrato) => historialContrato.idTrabajador2,
  )
  historialContratoes: HistorialContrato[];

  @OneToMany(
    () => HistorialContrato,
    (historialContrato) => historialContrato.realizadoPor,
  )
  historialContratoes2: HistorialContrato[];

  @OneToMany(() => Informe, (informe) => informe.idTrabajador)
  informes: Informe[];

  @OneToMany(
    () => ObservacionDocente,
    (observacionDocente) => observacionDocente.idCoordinador,
  )
  observacionDocentes: ObservacionDocente[];

  @OneToMany(
    () => ObservacionDocente,
    (observacionDocente) => observacionDocente.idTrabajador,
  )
  observacionDocentes2: ObservacionDocente[];

  @OneToMany(
    () => PensionEstudiante,
    (pensionEstudiante) => pensionEstudiante.registradoPor,
  )
  pensionEstudiantes: PensionEstudiante[];

  @OneToMany(
    () => PlanillaMensual,
    (planillaMensual) => planillaMensual.aprobadoPor,
  )
  planillaMensuals: PlanillaMensual[];

  @OneToMany(
    () => PlanillaMensual,
    (planillaMensual) => planillaMensual.generadoPor,
  )
  planillaMensuals2: PlanillaMensual[];

  @OneToMany(
    () => PlanillaMensual,
    (planillaMensual) => planillaMensual.pagadoPor,
  )
  planillaMensuals3: PlanillaMensual[];

  @OneToMany(
    () => ProgramacionMensual,
    (programacionMensual) => programacionMensual.trabajador,
  )
  programacionMensuals: ProgramacionMensual[];

  @OneToMany(
    () => RenovacionContrato,
    (renovacionContrato) => renovacionContrato.aprobadoPor,
  )
  renovacionContratoes: RenovacionContrato[];

  @OneToMany(
    () => SeguroTrabajador,
    (seguroTrabajador) => seguroTrabajador.creadoPor,
  )
  seguroTrabajadors: SeguroTrabajador[];

  @OneToMany(
    () => SeguroTrabajador,
    (seguroTrabajador) => seguroTrabajador.idTrabajador2,
  )
  seguroTrabajadors2: SeguroTrabajador[];

  @OneToMany(
    () => SueldoTrabajador,
    (sueldoTrabajador) => sueldoTrabajador.creadoPor,
  )
  sueldoTrabajadors: SueldoTrabajador[];

  @OneToMany(
    () => SueldoTrabajador,
    (sueldoTrabajador) => sueldoTrabajador.idTrabajador,
  )
  sueldoTrabajadors2: SueldoTrabajador[];

  @OneToMany(() => Tarea, (tarea) => tarea.idTrabajador)
  tareas: Tarea[];

  @OneToMany(
    () => Notificacion,
    (notificacion) => notificacion.usuarioGenerador,
  )
  notificacionesGeneradas: Notificacion[];

  @ManyToOne(() => Rol, (rol) => rol.trabajadores, { onDelete: 'RESTRICT' })
  @JoinColumn([{ name: 'id_rol', referencedColumnName: 'idRol' }])
  idRol: Rol;

  @ManyToOne(() => Usuario, (usuario) => usuario.trabajadores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'id_usuario', referencedColumnName: 'idUsuario' }])
  idUsuario: Usuario;
}
