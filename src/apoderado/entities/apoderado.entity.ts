import { Matricula } from "src/matricula/entities/matricula.entity";
import { Column, Entity, Index, OneToMany } from "typeorm";

@Index("idx_apoderado_fechas", ["actualizado", "creado"], {})
@Index("idx_apoderado_info", ["apellido", "correo", "nombre", "numero"], {})
@Index("apoderado_pkey", ["idApoderado"], { unique: true })
@Entity("apoderado", { schema: "public" })
export class Apoderado {
    @Column("uuid", {
        primary: true,
        name: "id_apoderado",
        default: () => "uuid_generate_v4()",
    })
    idApoderado: string;

    @Column("character varying", { name: "nombre", length: 100 })
    nombre: string;

    @Column("character varying", { name: "apellido", length: 100 })
    apellido: string;

    @Column("character varying", { name: "numero", nullable: true, length: 20 })
    numero: string | null;

    @Column("character varying", { name: "correo", nullable: true, length: 255 })
    correo: string | null;

    @Column("text", { name: "direccion", nullable: true })
    direccion: string | null;

    @Column("character varying", {
        name: "documento_identidad",
        length: 8,
        unique: true,
    })
    documentoIdentidad: string;

    @Column("character varying", {
        name: "tipo_documento_identidad",
        length: 25,
        unique: true,
    })
    tipoDocumentoIdentidad: string;

    @Column("boolean", {
        name: "es_principal",
        default: () => "true",
    })
    esPrincipal: boolean;

    @Column("character varying", {
        name: "tipo_apoderado",
        length: 50,
        default: () => "'principal'",
    })
    tipoApoderado: string;

    @Column("date", {
        name: "creado",
        nullable: true,
        default: () => "CURRENT_DATE",
    })
    creado: string | null;

    @Column("date", {
        name: "actualizado",
        nullable: true,
        default: () => "CURRENT_DATE",
    })
    actualizado: string | null;

    @OneToMany(() => Matricula, (matricula) => matricula.idApoderado)
    matriculas: Matricula[];
}
