import {
    Controller, Post, Get, Param, Res, Req, UploadedFile,
    UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response, Request } from 'express';
import { UploadService } from './upload.service';

@ApiTags('Subida de Archivos - Uploads')
@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post('uploadFile')
    @ApiOperation({ summary: 'Subir una imagen o PDF al servidor' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Archivo subido exitosamente, retorna la URL.' })
    @ApiResponse({ status: 400, description: 'No se recibió un archivo o formato no permitido.' })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            fileFilter: (_req, file, cb) => {
                const allowed = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
                if (!allowed) {
                    return cb(new BadRequestException('Solo se permiten imágenes y PDF'), false);
                }
                cb(null, true);
            },
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        }),
    )
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No se recibió ningún archivo');
        const url = await this.uploadService.uploadFile(file);
        return { url };
    }

    @Get('file/*key')
    @ApiOperation({ summary: 'Servir un archivo desde el almacenamiento privado' })
    @ApiResponse({ status: 200, description: 'Retorna el flujo de datos del archivo.' })
    @ApiResponse({ status: 404, description: 'Archivo no encontrado.' })
    async getFile(@Req() req: Request, @Res() res: Response) {
        const prefix = '/upload/file/';
        const rawKey = req.path.substring(req.path.indexOf(prefix) + prefix.length);
        const key = decodeURIComponent(rawKey);
        const { stream, contentType } = await this.uploadService.streamFile(key);
        res.setHeader('Content-Type', contentType);
        stream.pipe(res);
    }
}
