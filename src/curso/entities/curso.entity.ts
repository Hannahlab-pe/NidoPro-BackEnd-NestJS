import { AsignacionCurso } from "src/asignacion-curso/entities/asignacion-curso.entity";
import { CursoGrado } from "src/curso-grado/entities/curso-grado.entity";
import { Evaluacion } from "src/evaluacion/entities/evaluacion.entity";
import { AsignacionDocenteCursoAula } from "src/asignacion-docente-curso-aula/entities/asignacion-docente-curso-aula.entity";
import { Column, Entity, Index, OneToMany } from "typeorm";

@Index("idx_curso_info", ["estaActivo", "nombreCurso"], {})
@Index("curso_pkey", ["idCurso"], { unique: true })
@Entity("curso", { schema: "public" })
export class Curso {
    @Column("uuid", {
        primary: true,
        name: "id_curso",
        default: () => "uuid_generate_v4()",
    })
    idCurso: string;

    @Column("character varying", { name: "nombre_curso", length: 100 })
    nombreCurso: string;

    @Column("text", { name: "descripcion", nullable: true })
    descripcion: string | null;

    @Column("boolean", {
        name: "esta_activo",
        nullable: true,
        default: () => "true",
    })
    estaActivo: boolean | null;

    @OneToMany(
        () => AsignacionCurso,
        (asignacionCurso) => asignacionCurso.idCurso
    )
    asignacionCursos: AsignacionCurso[];

    @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.idCurso)
    evaluacions: Evaluacion[];

    @OneToMany(() => CursoGrado, (cursoGrado) => cursoGrado.curso)
    cursoGrados: CursoGrado[];

    @OneToMany(
        () => AsignacionDocenteCursoAula,
        (asignacionDocenteCursoAula) => asignacionDocenteCursoAula.idCurso
    )
    asignacionDocenteCursoAulas: AsignacionDocenteCursoAula[];
}
