import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import * as path from 'path';

@Injectable()
export class StorageService {
    private storage: Storage;
    private bucketName: string;

    constructor() {
        // Obtener variables de entorno
        const projectId = process.env.GCS_PROJECT_ID;
        const keyFilename = process.env.GCS_KEY_FILE;
        const bucketName = process.env.GCS_BUCKET_NAME;
        const credentialsJson = process.env.GCS_CREDENTIALS;

        // Validar bucket name
        if (!bucketName) {
            throw new Error('GCS_BUCKET_NAME no está configurado en las variables de entorno');
        }
        this.bucketName = bucketName;

        // Configuración para Google Cloud Storage
        let storageConfig: any = {
            projectId: projectId,
        };

        // OPCIÓN 1: Usar credenciales desde variable de entorno (PRODUCCIÓN)
        if (credentialsJson) {
            try {
                const credentials = JSON.parse(credentialsJson);
                storageConfig.credentials = credentials;
                console.log('✅ Usando credenciales desde variable de entorno GCS_CREDENTIALS');
            } catch (error) {
                console.error('❌ Error al parsear GCS_CREDENTIALS:', error);
                throw new Error('GCS_CREDENTIALS tiene un formato JSON inválido');
            }
        }
        // OPCIÓN 2: Usar archivo de credenciales (DESARROLLO)
        else if (keyFilename) {
            storageConfig.keyFilename = keyFilename;
            console.log(`✅ Usando credenciales desde archivo: ${keyFilename}`);
        }
        // Sin credenciales configuradas
        else {
            console.warn('⚠️  No se encontraron credenciales de Google Cloud Storage');
            console.warn('   Configura GCS_CREDENTIALS (JSON) o GCS_KEY_FILE (ruta al archivo)');
        }

        // Inicializar Google Cloud Storage
        this.storage = new Storage(storageConfig);

        console.log(`✅ Google Cloud Storage inicializado - Bucket: ${this.bucketName}`);
    }

    /**
     * Subir un archivo a Google Cloud Storage
     * @param file - Archivo de Multer
     * @param folder - Carpeta destino (ej: 'tareas', 'planificaciones', 'vouchers')
     * @returns URL pública del archivo
     */
    async uploadFile(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
        if (!file) {
            throw new BadRequestException('No se proporcionó ningún archivo');
        }

        try {
            // Generar nombre único para el archivo
            const timestamp = Date.now();
            const fileExtension = path.extname(file.originalname);
            const fileName = `${folder}/${timestamp}-${file.originalname.replace(/\s/g, '-')}`;

            // Referencia al bucket
            const bucket = this.storage.bucket(this.bucketName);
            const blob = bucket.file(fileName);

            // Crear stream de escritura
            const blobStream = blob.createWriteStream({
                resumable: false,
                metadata: {
                    contentType: file.mimetype,
                    metadata: {
                        originalName: file.originalname,
                        uploadedAt: new Date().toISOString(),
                    }
                }
            });

            return new Promise((resolve, reject) => {
                blobStream.on('error', (error) => {
                    console.error('❌ Error al subir archivo a GCS:', error);
                    reject(new InternalServerErrorException('Error al subir el archivo'));
                });

                blobStream.on('finish', async () => {
                    // Hacer el archivo público (opcional, dependiendo de tus necesidades)
                    await blob.makePublic().catch(err => {
                        console.warn('⚠️  No se pudo hacer público el archivo:', err.message);
                    });

                    // URL pública del archivo
                    const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
                    console.log(`✅ Archivo subido: ${publicUrl}`);
                    resolve(publicUrl);
                });

                // Escribir el buffer del archivo
                blobStream.end(file.buffer);
            });

        } catch (error) {
            console.error('❌ Error en uploadFile:', error);
            throw new InternalServerErrorException('Error al procesar la subida del archivo');
        }
    }

    /**
     * Subir múltiples archivos
     * @param files - Array de archivos de Multer
     * @param folder - Carpeta destino
     * @returns Array de URLs públicas
     */
    async uploadMultipleFiles(files: Express.Multer.File[], folder: string = 'general'): Promise<string[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No se proporcionaron archivos');
        }

        const uploadPromises = files.map(file => this.uploadFile(file, folder));
        return Promise.all(uploadPromises);
    }

    /**
     * Eliminar un archivo de Google Cloud Storage
     * @param fileUrl - URL pública del archivo
     * @returns true si se eliminó correctamente
     */
    async deleteFile(fileUrl: string): Promise<boolean> {
        try {
            // Extraer el nombre del archivo de la URL
            const fileName = fileUrl.split(`${this.bucketName}/`)[1];

            if (!fileName) {
                throw new BadRequestException('URL de archivo inválida');
            }

            const bucket = this.storage.bucket(this.bucketName);
            await bucket.file(fileName).delete();

            console.log(`✅ Archivo eliminado: ${fileName}`);
            return true;

        } catch (error) {
            console.error('❌ Error al eliminar archivo:', error);
            throw new InternalServerErrorException('Error al eliminar el archivo');
        }
    }

    /**
     * Obtener URL firmada (signed URL) para acceso temporal
     * @param fileUrl - URL pública del archivo
     * @param expiresInMinutes - Tiempo de expiración en minutos (default: 60)
     * @returns URL firmada
     */
    async getSignedUrl(fileUrl: string, expiresInMinutes: number = 60): Promise<string> {
        try {
            const fileName = fileUrl.split(`${this.bucketName}/`)[1];

            if (!fileName) {
                throw new BadRequestException('URL de archivo inválida');
            }

            const bucket = this.storage.bucket(this.bucketName);
            const file = bucket.file(fileName);

            const [signedUrl] = await file.getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + expiresInMinutes * 60 * 1000,
            });

            return signedUrl;

        } catch (error) {
            console.error('❌ Error al generar URL firmada:', error);
            throw new InternalServerErrorException('Error al generar URL de acceso');
        }
    }

    /**
     * Verificar si un archivo existe
     * @param fileUrl - URL pública del archivo
     * @returns true si existe
     */
    async fileExists(fileUrl: string): Promise<boolean> {
        try {
            const fileName = fileUrl.split(`${this.bucketName}/`)[1];

            if (!fileName) {
                return false;
            }

            const bucket = this.storage.bucket(this.bucketName);
            const [exists] = await bucket.file(fileName).exists();

            return exists;

        } catch (error) {
            console.error('❌ Error al verificar existencia de archivo:', error);
            return false;
        }
    }

    /**
     * Listar archivos en una carpeta
     * @param folder - Nombre de la carpeta
     * @returns Array de nombres de archivos
     */
    async listFiles(folder: string = ''): Promise<string[]> {
        try {
            const bucket = this.storage.bucket(this.bucketName);
            const [files] = await bucket.getFiles({ prefix: folder });

            return files.map(file => `https://storage.googleapis.com/${this.bucketName}/${file.name}`);

        } catch (error) {
            console.error('❌ Error al listar archivos:', error);
            throw new InternalServerErrorException('Error al listar archivos');
        }
    }
}
