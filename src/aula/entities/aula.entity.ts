import { AsignacionAula } from "src/asignacion-aula/entities/asignacion-aula.entity";
import { Asistencia } from "src/asistencia/entities/asistencia.entity";
import { Cronograma } from "src/cronograma/entities/cronograma.entity";
import { Grado } from "src/grado/entities/grado.entity";
import { LibretaBimestral } from "src/libreta-bimestral/entities/libreta-bimestral.entity";
import { MatriculaAula } from "src/matricula-aula/entities/matricula-aula.entity";
import { ProgramacionMensual } from "src/programacion-mensual/entities/programacion-mensual.entity";
import { Tarea } from "src/tarea/entities/tarea.entity";
import { AsignacionDocenteCursoAula } from "src/asignacion-docente-curso-aula/entities/asignacion-docente-curso-aula.entity";
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
} from "typeorm";

@Index("idx_aula_info", ["cantidadEstudiantes", "seccion"], {})
@Index("aula_pkey", ["idAula"], { unique: true })
@Entity("aula", { schema: "public" })
export class Aula {
    @Column("uuid", {
        primary: true,
        name: "id_aula",
        default: () => "uuid_generate_v4()",
    })
    idAula: string;

    @Column("character varying", { name: "seccion", length: 10 })
    seccion: string;

    @Column("integer", {
        name: "cantidad_estudiantes",
        nullable: true,
        default: () => "0",
    })
    cantidadEstudiantes: number | null;

    @OneToMany(() => AsignacionAula, (asignacionAula) => asignacionAula.idAula)
    asignacionAulas: AsignacionAula[];

    @OneToMany(() => Asistencia, (asistencia) => asistencia.idAula)
    asistencias: Asistencia[];

    @ManyToOne(() => Grado, (grado) => grado.aulas, { onDelete: "RESTRICT" })
    @JoinColumn([{ name: "id_grado", referencedColumnName: "idGrado" }])
    idGrado: Grado;

    @OneToMany(() => Cronograma, (cronograma) => cronograma.idAula)
    cronogramas: Cronograma[];

    @OneToMany(() => MatriculaAula, (matriculaAula) => matriculaAula.aula)
    matriculaAula: MatriculaAula;

    @OneToMany(() => Tarea, (tarea) => tarea.aula)
    tareas: Tarea[];

    @OneToMany(
        () => ProgramacionMensual,
        (programacionMensual) => programacionMensual.aula
    )
    programacionMensuals: ProgramacionMensual[];

    @OneToMany(
        () => LibretaBimestral,
        (libretaBimestral) => libretaBimestral.idAula
    )
    libretaBimestrals: LibretaBimestral[];

    @OneToMany(
        () => AsignacionDocenteCursoAula,
        (asignacionDocenteCursoAula) => asignacionDocenteCursoAula.idAula
    )
    asignacionDocenteCursoAulas: AsignacionDocenteCursoAula[];
}
