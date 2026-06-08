import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
    private readonly s3: S3Client;
    private readonly bucket: string;
    private readonly publicUrl: string;
    private readonly backendBaseUrl: string;

    constructor(private readonly configService: ConfigService) {
        const bucket = this.configService.get<string>('RAILWAY_BUCKET_NAME');
        const endpoint = this.configService.get<string>('RAILWAY_S3_ENDPOINT');
        const accessKeyId = this.configService.get<string>('RAILWAY_S3_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('RAILWAY_S3_SECRET_ACCESS_KEY');
        const region = this.configService.get<string>('RAILWAY_S3_REGION', 'us-east-1');
        const publicUrl = this.configService.get<string>('RAILWAY_S3_PUBLIC_URL');
        const backendBaseUrl = this.configService.get<string>('BACKEND_BASE_URL', 'http://127.0.0.1:3000');

        if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
            throw new Error(
                'Missing S3 configuration: RAILWAY_BUCKET_NAME, RAILWAY_S3_ENDPOINT, RAILWAY_S3_ACCESS_KEY_ID, and RAILWAY_S3_SECRET_ACCESS_KEY are required.',
            );
        }

        this.bucket = bucket;
        // Build a guaranteed storage base URL: prefer explicit env var, fallback to endpoint+bucket
        this.publicUrl = (publicUrl ?? `${endpoint.replace(/\/$/, '')}/${bucket}`).replace(/\/$/, '');
        this.backendBaseUrl = backendBaseUrl.replace(/\/$/, '');

        this.s3 = new S3Client({
            region,
            endpoint,
            forcePathStyle: true,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }

    /**
     * Upload a file to S3 and return the backend proxy URL for it.
     * The backend proxy URL is used instead of a direct S3 URL so that
     * the bucket does not need to be publicly accessible.
     */
    async uploadFile(file: Express.Multer.File): Promise<string> {
        const extension = extname(file.originalname) || '';
        const key = `uploads/${uuidv4()}${extension}`;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        try {
            await this.s3.send(command);
        } catch (error) {
            throw new InternalServerErrorException('Error al subir el archivo al bucket.');
        }

        // Return a backend proxy URL instead of a direct S3 URL
        return this.buildProxyUrl(key);
    }

    /**
     * Stream a file from S3 using backend credentials.
     * Returns { stream, contentType } so the controller can pipe it.
     */
    async streamFile(key: string): Promise<{ stream: Readable; contentType: string }> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        try {
            const response = await this.s3.send(command);
            return {
                stream: response.Body as Readable,
                contentType: response.ContentType ?? 'application/octet-stream',
            };
        } catch (error: any) {
            if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
                throw new NotFoundException(`Archivo no encontrado: ${key}`);
            }
            throw new InternalServerErrorException('Error al obtener el archivo del bucket.');
        }
    }

    /**
     * Converts any image path or URL stored in DB to a backend proxy URL.
     * Handles three cases:
     *   1. null / undefined                          -> returns null
     *   2. Already a backend /upload/file/... URL   -> returned as-is
     *   3. Relative path OR direct S3 URL           -> extract key and build proxy URL
     */
    resolveImageUrl(raw: string | null | undefined): string | null {
        if (!raw) return null;

        // Already a proxy URL from our own backend
        if (raw.includes('/upload/file/')) return raw;

        let key: string;

        if (/^https?:\/\//i.test(raw)) {
            // Direct S3 URL — extract the key after the bucket name
            try {
                const url = new URL(raw);
                // Path is like /bucket-name/uploads/uuid.jpg  or  /uploads/uuid.jpg
                const parts = url.pathname.replace(/^\//, '').split('/');
                // Drop the bucket segment if it matches our bucket name
                key = parts[0] === this.bucket ? parts.slice(1).join('/') : parts.join('/');
            } catch {
                return null;
            }
        } else {
            // Relative path stored in DB, e.g. "uploads/uuid.jpg"
            key = raw.replace(/^\//, '');
        }

        return this.buildProxyUrl(key);
    }

    private buildProxyUrl(key: string): string {
        return `${this.backendBaseUrl}/upload/file/${key}`;
    }
}
