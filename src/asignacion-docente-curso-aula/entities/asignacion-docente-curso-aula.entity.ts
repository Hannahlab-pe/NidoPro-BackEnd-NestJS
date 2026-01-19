import { Aula } from "src/aula/entities/aula.entity";
import { Curso } from "src/curso/entities/curso.entity";
import { Trabajador } from "src/trabajador/entities/trabajador.entity";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";

@Index("asignacion_docente_curso_aula_pkey", ["idAsignacionDocenteCursoAula"], { unique: true })
@Index("uq_docente_curso_aula_activo", ["idTrabajador", "idCurso", "idAula", "estaActivo"], { unique: true })
@Entity("asignacion_docente_curso_aula", { schema: "public" })
export class AsignacionDocenteCursoAula {
    @Column("uuid", {
        primary: true,
        name: "id_asignacion_docente_curso_aula",
        default: () => "uuid_generate_v4()",
    })
    idAsignacionDocenteCursoAula: string;

    @Column("date", {
        name: "fecha_asignacion",
        nullable: true,
        default: () => "CURRENT_DATE",
    })
    fechaAsignacion: string | null;

    @Column("boolean", {
        name: "esta_activo",
        nullable: true,
        default: () => "true",
    })
    estaActivo: boolean | null;

    @ManyToOne(() => Trabajador, (trabajador) => trabajador.asignacionDocenteCursoAulas, {
        onDelete: "CASCADE",
    })
    @JoinColumn([{ name: "id_trabajador", referencedColumnName: "idTrabajador" }])
    idTrabajador: Trabajador;

    @ManyToOne(() => Curso, (curso) => curso.asignacionDocenteCursoAulas, {
        onDelete: "CASCADE",
    })
    @JoinColumn([{ name: "id_curso", referencedColumnName: "idCurso" }])
    idCurso: Curso;

    @ManyToOne(() => Aula, (aula) => aula.asignacionDocenteCursoAulas, {
        onDelete: "CASCADE",
    })
    @JoinColumn([{ name: "id_aula", referencedColumnName: "idAula" }])
    idAula: Aula;
}
