import { Estudiante } from "src/estudiante/entities/estudiante.entity";
import { Trabajador } from "src/trabajador/entities/trabajador.entity";
import { Column, Entity, Index, OneToMany } from "typeorm";

@Index("rol_pkey", ["idRol"], { unique: true })
@Index("idx_rol_nombre", ["nombre"], {})
@Entity("rol", { schema: "public" })
export class Rol {
    @Column("uuid", {
        primary: true,
        name: "id_rol",
        default: () => "uuid_generate_v4()",
    })
    idRol: string;

    @Column("character varying", { name: "nombre", length: 100 })
    nombre: string;

    @Column("text", { name: "descripcion", nullable: true })
    descripcion: string | null;

    @Column("boolean", { name: "esta_activo", default: () => "true" })
    estaActivo: boolean;

    @OneToMany(() => Trabajador, (trabajador) => trabajador.idRol)
    trabajadores: Trabajador[];

    @OneToMany(() => Estudiante, (estudiante) => estudiante.idRol)
    estudiantes: Estudiante[];
}
