// src/contacto-emergencia/entities/contacto-emergencia.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Estudiante } from "src/estudiante/entities/estudiante.entity";

@Index("contacto_emergencia_pkey", ["idContactoEmergencia"], { unique: true })
@Index("idx_contacto_estudiante", ["idEstudiante"], {})
@Entity("contacto_emergencia", { schema: "public" })
export class ContactoEmergencia {
    @Column("uuid", {
        primary: true,
        name: "id_contacto_emergencia",
        default: () => "uuid_generate_v4()",
    })
    idContactoEmergencia: string;

    @Column("character varying", { name: "nombre", length: 100 })
    nombre: string;

    @Column("character varying", { name: "apellido", length: 100 })
    apellido: string;

    @Column("character varying", { name: "telefono", length: 20 })
    telefono: string;

    @Column("character varying", { name: "email", nullable: true, length: 255 })
    email: string | null;

    @Column("character varying", { name: "tipo_contacto", length: 50 })
    tipoContacto: string; // padre, madre, tio, abuelo, tutor, etc.

    @Column("character varying", { name: "relacion_estudiante", length: 50 })
    relacionEstudiante: string; // Relación específica con el estudiante

    @Column("boolean", { name: "es_principal", default: () => "false" })
    esPrincipal: boolean; // Para identificar el contacto principal

    @Column("integer", { name: "prioridad", default: () => "1" })
    prioridad: number; // Orden de contacto (1 = primera opción)

    @Column("text", { name: "observaciones", nullable: true })
    observaciones: string | null;

    @Column("boolean", { name: "esta_activo", default: () => "true" })
    estaActivo: boolean;

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

    // Relación con estudiante
    @ManyToOne(() => Estudiante, (estudiante) => estudiante.contactosEmergencia, {
        onDelete: "CASCADE"
    })
    @JoinColumn([{ name: "id_estudiante", referencedColumnName: "idEstudiante" }])
    idEstudiante: Estudiante;
}