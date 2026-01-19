import { EvaluacionDocenteBimestral } from "src/evualuacion-docente-bimestral/entities/evualuacion-docente-bimestral.entity";
import { LibretaBimestral } from "src/libreta-bimestral/entities/libreta-bimestral.entity";
import { Nota } from "src/nota/entities/nota.entity";
import { ObservacionDocente } from "src/observacion-docente/entities/observacion-docente.entity";
import { PeriodoEscolar } from "src/periodo-escolar/entities/periodo-escolar.entity";
import { ProgramacionMensual } from "src/programacion-mensual/entities/programacion-mensual.entity";
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from "typeorm";

@Index(
    "idx_bimestre_info",
    ["estaActivo", "fechaFin", "fechaInicio", "numeroBimestre"],
    {}
)
@Index("bimestre_pkey", ["idBimestre"], { unique: true })
@Index("uq_bimestre_numero_periodo", ["idPeriodoEscolar", "numeroBimestre"], {
    unique: true,
})
@Entity("bimestre", { schema: "public" })
export class Bimestre {
    @Column("uuid", {
        primary: true,
        name: "id_bimestre",
        default: () => "uuid_generate_v4()",
    })
    idBimestre: string;

    @Column("integer", { name: "numero_bimestre" })
    numeroBimestre: number;

    @Column("character varying", { name: "nombre_bimestre", length: 50 })
    nombreBimestre: string;

    @Column("date", { name: "fecha_inicio" })
    fechaInicio: string;

    @Column("date", { name: "fecha_fin" })
    fechaFin: string;

    @Column("date", { name: "fecha_limite_programacion" })
    fechaLimiteProgramacion: string;

    @Column("boolean", {
        name: "esta_activo",
        nullable: true,
        default: () => "true",
    })
    estaActivo: boolean | null;

    @Column("uuid", { name: "id_periodo_escolar" })
    idPeriodoEscolar: string;

    @ManyToOne(
        () => PeriodoEscolar,
        (periodoEscolar) => periodoEscolar.bimestres,
        { onDelete: "CASCADE" }
    )
    @JoinColumn([
        { name: "id_periodo_escolar", referencedColumnName: "idPeriodoEscolar" },
    ])
    idPeriodoEscolar2: PeriodoEscolar;

    @OneToMany(
        () => EvaluacionDocenteBimestral,
        (evaluacionDocenteBimestral) => evaluacionDocenteBimestral.idBimestre2
    )
    evaluacionDocenteBimestrals: EvaluacionDocenteBimestral[];

    @OneToMany(
        () => LibretaBimestral,
        (libretaBimestral) => libretaBimestral.idBimestre2
    )
    libretaBimestrals: LibretaBimestral[];

    @OneToMany(() => Nota, (nota) => nota.idBimestre2)
    notas: Nota[];

    @OneToMany(
        () => ObservacionDocente,
        (observacionDocente) => observacionDocente.idBimestre
    )
    observacionDocentes: ObservacionDocente[];

    @OneToMany(
        () => ProgramacionMensual,
        (programacionMensual) => programacionMensual.bimestre
    )
    programacionMensuals: ProgramacionMensual[];
}
