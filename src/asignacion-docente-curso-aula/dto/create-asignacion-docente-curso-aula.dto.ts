import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsDateString, IsNotEmpty } from "class-validator";

export class CreateAsignacionDocenteCursoAulaDto {
    @ApiProperty({ example: "uuid-trabajador-id", description: "ID del docente" })
    @IsString()
    @IsNotEmpty()
    idTrabajador: string;

    @ApiProperty({ example: "uuid-curso-id", description: "ID del curso a asignar" })
    @IsString()
    @IsNotEmpty()
    idCurso: string;

    @ApiProperty({ example: "uuid-aula-id", description: "ID del aula donde se impartirá" })
    @IsString()
    @IsNotEmpty()
    idAula: string;

    @ApiProperty({ example: "2024-03-01", description: "Fecha de asignación", required: false })
    @IsDateString()
    @IsOptional()
    fechaAsignacion?: string;

    @ApiProperty({ example: true, description: "Estado activo de la asignación", required: false })
    @IsBoolean()
    @IsOptional()
    estaActivo?: boolean;
}
