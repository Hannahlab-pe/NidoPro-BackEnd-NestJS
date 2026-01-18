import { DetallePlanilla } from 'src/detalle-planilla/entities/detalle-planilla.entity';
import { Trabajador } from 'src/trabajador/entities/trabajador.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Index('uq_planilla_mes_anio', ['anio', 'mes'], { unique: true })
@Index('planilla_mensual_pkey', ['idPlanillaMensual'], { unique: true })
@Entity('planilla_mensual', { schema: 'public' })
export class PlanillaMensual {
  @Column('uuid', {
    primary: true,
    name: 'id_planilla_mensual',
    default: () => 'uuid_generate_v4()',
  })
  idPlanillaMensual: string;

  @Column('integer', { name: 'mes', unique: true })
  mes: number;

  @Column('integer', { name: 'anio', unique: true })
  anio: number;

  @Column('date', {
    name: 'fecha_generacion',
    nullable: true,
    default: () => 'CURRENT_DATE',
  })
  fechaGeneracion: string | null;

  @Column('date', { name: 'fecha_pago_programada' })
  fechaPagoProgramada: string;

  @Column('date', { name: 'fecha_pago_real', nullable: true })
  fechaPagoReal: string | null;

  @Column('character varying', {
    name: 'estado_planilla',
    length: 30,
    default: () => "'GENERADA'",
  })
  estadoPlanilla: string;

  @Column('numeric', {
    name: 'total_ingresos',
    nullable: true,
    precision: 12,
    scale: 2,
    default: () => "0.0",
  })
  totalIngresos: number | null;

  @Column('numeric', {
    name: 'total_descuentos',
    nullable: true,
    precision: 12,
    scale: 2,
    default: () => "0.0",
  })
  totalDescuentos: number | null;

  @Column('numeric', {
    name: 'total_neto',
    nullable: true,
    precision: 12,
    scale: 2,
    default: () => "0.0",
  })
  totalNeto: number | null;

  @Column('text', { name: 'observaciones', nullable: true })
  observaciones: string | null;

  @Column('timestamp without time zone', {
    name: 'creado_en',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  creadoEn: Date | null;

  @Column('timestamp without time zone', {
    name: 'actualizado_en',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  actualizadoEn: Date | null;

  @OneToMany(
    () => DetallePlanilla,
    (detallePlanilla) => detallePlanilla.idPlanillaMensual2,
  )
  detallePlanillas: DetallePlanilla[];

  @ManyToOne(() => Trabajador, (trabajador) => trabajador.planillaMensuals, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn([{ name: 'aprobado_por', referencedColumnName: 'idTrabajador' }])
  aprobadoPor: Trabajador;

  @ManyToOne(() => Trabajador, (trabajador) => trabajador.planillaMensuals2, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn([{ name: 'generado_por', referencedColumnName: 'idTrabajador' }])
  generadoPor: Trabajador;

  @ManyToOne(() => Trabajador, (trabajador) => trabajador.planillaMensuals3, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn([{ name: 'pagado_por', referencedColumnName: 'idTrabajador' }])
  pagadoPor: Trabajador;
}
