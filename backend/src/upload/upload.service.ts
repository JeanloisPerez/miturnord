import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
    private readonly s3: S3Client;
    private readonly bucket: string;
    private readonly publicUrl?: string;

    constructor(private readonly configService: ConfigService) {
        const bucket = this.configService.get<string>('RAILWAY_BUCKET_NAME');
        const endpoint = this.configService.get<string>('RAILWAY_S3_ENDPOINT');
        const accessKeyId = this.configService.get<string>('RAILWAY_S3_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('RAILWAY_S3_SECRET_ACCESS_KEY');
        const region = this.configService.get<string>('RAILWAY_S3_REGION', 'us-east-1');
        const publicUrl = this.configService.get<string>('RAILWAY_S3_PUBLIC_URL');

        if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
            throw new Error(
                'Missing S3 configuration: RAILWAY_BUCKET_NAME, RAILWAY_S3_ENDPOINT, RAILWAY_S3_ACCESS_KEY_ID, and RAILWAY_S3_SECRET_ACCESS_KEY are required.',
            );
        }

        this.bucket = bucket;
        this.publicUrl = publicUrl;

        this.s3 = new S3Client({
            region,
            endpoint,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            forcePathStyle: true,
        });
    }

    async uploadFile(file: Express.Multer.File): Promise<string> {
        const extension = extname(file.originalname) || '';
        const key = `uploads/${uuidv4()}${extension}`;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        });

        try {
            await this.s3.send(command);
        } catch (error) {
            throw new InternalServerErrorException('Error al subir el archivo al bucket.');
        }

        // Return a public URL. We set ACL: 'public-read' above so objects should be publicly accessible.
        if (this.publicUrl) {
            return `${this.publicUrl.replace(/\/$/, '')}/${key}`;
        }
        const endpoint = this.configService.get<string>('RAILWAY_S3_ENDPOINT')!;
        return `${endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
    }
}
