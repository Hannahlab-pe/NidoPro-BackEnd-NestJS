import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToOne,
} from "typeorm";
import { Aula } from "../../aula/entities/aula.entity";
import { Matricula } from "../../matricula/entities/matricula.entity";

@Index("uq_matricula_aula", ["idAula", "idMatricula"], { unique: true })
@Index("matricula_aula_pkey", ["idMatriculaAula"], { unique: true })
@Entity("matricula_aula", { schema: "public" })
export class MatriculaAula {
    @Column("uuid", {
        primary: true,
        name: "id_matricula_aula",
        default: () => "uuid_generate_v4()",
    })
    idMatriculaAula: string;

    @Column("uuid", { name: "id_matricula" })
    idMatricula: string;

    @Column("uuid", { name: "id_aula" })
    idAula: string;

    @Column("date", {
        name: "fecha_asignacion",
        nullable: true,
        default: () => "CURRENT_DATE",
    })
    fechaAsignacion: string | null;

    @Column("character varying", {
        name: "estado",
        nullable: true,
        length: 20,
        default: () => "'activo'",
    })
    estado: string | null;

    @OneToOne(() => Aula, (aula) => aula.matriculaAula, { onDelete: "CASCADE" })
    @JoinColumn([{ name: "id_aula", referencedColumnName: "idAula" }])
    aula: Aula;

    @ManyToOne(() => Matricula, (matricula) => matricula.matriculaAula, {
        onDelete: "CASCADE",
    })
    @JoinColumn([{ name: "id_matricula", referencedColumnName: "idMatricula" }])
    matricula: Matricula;
}
