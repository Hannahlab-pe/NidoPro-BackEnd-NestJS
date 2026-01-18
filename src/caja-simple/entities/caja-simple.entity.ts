import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Estudiante } from 'src/estudiante/entities/estudiante.entity';
import { Trabajador } from 'src/trabajador/entities/trabajador.entity';
import { PensionEstudiante } from 'src/pension-estudiante/entities/pension-estudiante.entity';

@Index("idx_caja_simple_fecha", ["fecha", "hora"], {})
@Index("idx_caja_simple_tipo_categoria", ["tipo", "categoria", "estado"], {})
@Index("caja_simple_pkey", ["idMovimiento"], { unique: true })
@Entity("caja_simple", { schema: "public" })
export class CajaSimple {
    @PrimaryColumn("uuid", {
        name: "id_movimiento",
        default: () => "uuid_generate_v4()",
    })
    idMovimiento: string;

    @Column("date", {
        name: "fecha",
        default: () => "CURRENT_DATE"
    })
    fecha: Date;

    @Column("time without time zone", {
        name: "hora",
        default: () => "CURRENT_TIME",
    })
    hora: string;

    @Column("varchar", {
        name: "tipo",
        length: 10,
        comment: "INGRESO o EGRESO"
    })
    tipo: string;

    @Column("varchar", {
        name: "concepto",
        length: 200
    })
    concepto: string;

    @Column("text", {
        name: "descripcion",
        nullable: true
    })
    descripcion: string | null;

    @Column("numeric", {
        name: "monto",
        precision: 10,
        scale: 2
    })
    monto: number;

    @Column("varchar", {
        name: "categoria",
        length: 50
    })
    categoria: string;

    @Column("varchar", {
        name: "subcategoria",
        length: 100,
        nullable: true
    })
    subcategoria: string | null;

    @Column("varchar", {
        name: "metodo_pago",
        length: 50,
        nullable: true
    })
    metodoPago: string | null;

    @Column("varchar", {
        name: "comprobante",
        length: 50,
        nullable: true
    })
    comprobante: string | null;

    @Column("uuid", {
        name: "id_estudiante",
        nullable: true
    })
    idEstudiante: string | null;

    @Column("uuid", {
        name: "id_trabajador_beneficiario",
        nullable: true
    })
    idTrabajadorBeneficiario: string | null;

    @Column("uuid", {
        name: "registrado_por"
    })
    registradoPor: string;

    @Column("varchar", {
        name: "estado",
        length: 15,
        default: () => "'CONFIRMADO'",
        comment: "CONFIRMADO, PENDIENTE, ANULADO"
    })
    estado: string;

    @Column("timestamp without time zone", {
        name: "creado",
        default: () => "CURRENT_TIMESTAMP",
    })
    creado: Date;

    @Column("timestamp without time zone", {
        name: "anulado_en",
        nullable: true,
    })
    anuladoEn: Date | null;

    @Column("uuid", {
        name: "anulado_por",
        nullable: true
    })
    anuladoPor: string | null;

    @Column("text", {
        name: "motivo_anulacion",
        nullable: true
    })
    motivoAnulacion: string | null;

    // Relaciones
    @ManyToOne(() => Estudiante, { nullable: true })
    @JoinColumn({ name: "id_estudiante" })
    estudiante: Estudiante;

    @ManyToOne(() => Trabajador, { nullable: true })
    @JoinColumn({ name: "id_trabajador_beneficiario" })
    trabajadorBeneficiario: Trabajador;

    @ManyToOne(() => Trabajador, { nullable: false })
    @JoinColumn({ name: "registrado_por" })
    registradoPorTrabajador: Trabajador;

    @ManyToOne(() => Trabajador, { nullable: true })
    @JoinColumn({ name: "anulado_por" })
    anuladoPorTrabajador: Trabajador;


    @Column("uuid", {
        name: "id_pension_relacionada",
        nullable: true
    })
    idPensionRelacionada: string | null;

    @Column("varchar", {
        name: "numero_transaccion",
        length: 20,
        nullable: true
    })
    numeroTransaccion: string | null;

    @Column("varchar", {
        name: "referencia_externa",
        length: 50,
        nullable: true
    })
    referenciaExterna: string | null;

    // Relación opcional con pensión
    @ManyToOne(() => PensionEstudiante, { nullable: true })
    @JoinColumn({ name: "id_pension_relacionada" })
    pensionRelacionada: PensionEstudiante;
}
