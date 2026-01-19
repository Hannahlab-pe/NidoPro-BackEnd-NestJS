import {
    Controller,
    Post,
    Delete,
    Get,
    Body,
    Param,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    BadRequestException,
    Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { StorageService } from './storage.service';

@ApiTags('Storage - Google Cloud')
@Controller('storage')
export class StorageController {
    constructor(private readonly storageService: StorageService) { }

    @Post('upload')
    @ApiOperation({
        summary: 'Subir un archivo a Google Cloud Storage',
        description: 'Sube un solo archivo y devuelve la URL pública'
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Archivo a subir'
                },
                folder: {
                    type: 'string',
                    description: 'Carpeta destino (ej: tareas, vouchers, planificaciones)',
                    example: 'tareas'
                }
            },
            required: ['file']
        }
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('folder') folder?: string
    ) {
        if (!file) {
            throw new BadRequestException('No se proporcionó ningún archivo');
        }

        const url = await this.storageService.uploadFile(file, folder || 'general');

        return {
            success: true,
            message: 'Archivo subido correctamente',
            data: {
                url,
                fileName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                folder: folder || 'general'
            }
        };
    }

    @Post('upload-multiple')
    @ApiOperation({
        summary: 'Subir múltiples archivos a Google Cloud Storage',
        description: 'Sube varios archivos y devuelve un array de URLs públicas'
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary'
                    },
                    description: 'Archivos a subir'
                },
                folder: {
                    type: 'string',
                    description: 'Carpeta destino',
                    example: 'tareas'
                }
            },
            required: ['files']
        }
    })
    @UseInterceptors(FilesInterceptor('files', 10)) // Máximo 10 archivos
    async uploadMultipleFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Body('folder') folder?: string
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No se proporcionaron archivos');
        }

        const urls = await this.storageService.uploadMultipleFiles(files, folder || 'general');

        return {
            success: true,
            message: `${files.length} archivo(s) subido(s) correctamente`,
            data: {
                urls,
                count: files.length,
                files: files.map((file, index) => ({
                    url: urls[index],
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size
                }))
            }
        };
    }

    @Delete('delete')
    @ApiOperation({
        summary: 'Eliminar un archivo de Google Cloud Storage',
        description: 'Elimina un archivo usando su URL pública'
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                fileUrl: {
                    type: 'string',
                    description: 'URL pública del archivo a eliminar',
                    example: 'https://storage.googleapis.com/mi-bucket/tareas/1234567890-documento.pdf'
                }
            },
            required: ['fileUrl']
        }
    })
    async deleteFile(@Body('fileUrl') fileUrl: string) {
        if (!fileUrl) {
            throw new BadRequestException('Se requiere la URL del archivo');
        }

        const deleted = await this.storageService.deleteFile(fileUrl);

        return {
            success: deleted,
            message: deleted ? 'Archivo eliminado correctamente' : 'No se pudo eliminar el archivo',
            data: { fileUrl }
        };
    }

    @Get('signed-url')
    @ApiOperation({
        summary: 'Obtener URL firmada para acceso temporal',
        description: 'Genera una URL firmada que expira después de cierto tiempo'
    })
    @ApiQuery({
        name: 'fileUrl',
        description: 'URL pública del archivo',
        example: 'https://storage.googleapis.com/mi-bucket/tareas/1234567890-documento.pdf'
    })
    @ApiQuery({
        name: 'expiresInMinutes',
        description: 'Tiempo de expiración en minutos',
        example: 60,
        required: false
    })
    async getSignedUrl(
        @Query('fileUrl') fileUrl: string,
        @Query('expiresInMinutes') expiresInMinutes?: number
    ) {
        if (!fileUrl) {
            throw new BadRequestException('Se requiere la URL del archivo');
        }

        const signedUrl = await this.storageService.getSignedUrl(
            fileUrl,
            expiresInMinutes ? parseInt(String(expiresInMinutes)) : 60
        );

        return {
            success: true,
            message: 'URL firmada generada correctamente',
            data: {
                signedUrl,
                expiresInMinutes: expiresInMinutes || 60,
                originalUrl: fileUrl
            }
        };
    }

    @Get('exists')
    @ApiOperation({
        summary: 'Verificar si un archivo existe',
        description: 'Verifica si un archivo existe en Google Cloud Storage'
    })
    @ApiQuery({
        name: 'fileUrl',
        description: 'URL pública del archivo',
        example: 'https://storage.googleapis.com/mi-bucket/tareas/1234567890-documento.pdf'
    })
    async fileExists(@Query('fileUrl') fileUrl: string) {
        if (!fileUrl) {
            throw new BadRequestException('Se requiere la URL del archivo');
        }

        const exists = await this.storageService.fileExists(fileUrl);

        return {
            success: true,
            message: exists ? 'El archivo existe' : 'El archivo no existe',
            data: {
                exists,
                fileUrl
            }
        };
    }

    @Get('list/:folder')
    @ApiOperation({
        summary: 'Listar archivos en una carpeta',
        description: 'Obtiene la lista de archivos en una carpeta específica'
    })
    @ApiParam({
        name: 'folder',
        description: 'Nombre de la carpeta',
        example: 'tareas'
    })
    async listFiles(@Param('folder') folder: string) {
        const files = await this.storageService.listFiles(folder);

        return {
            success: true,
            message: `${files.length} archivo(s) encontrado(s)`,
            data: {
                folder,
                count: files.length,
                files
            }
        };
    }

    @Get('list')
    @ApiOperation({
        summary: 'Listar todos los archivos',
        description: 'Obtiene la lista de todos los archivos en el bucket'
    })
    async listAllFiles() {
        const files = await this.storageService.listFiles('');

        return {
            success: true,
            message: `${files.length} archivo(s) encontrado(s)`,
            data: {
                count: files.length,
                files
            }
        };
    }
}
