import {
    Controller, Post, UploadedFile,
    UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Subida de Archivos - Uploads')
@Controller('upload')
export class UploadController {
    @Post('uploadFile')
    @ApiOperation({ summary: 'Subir una imagen al servidor' })
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
            storage: diskStorage({
                destination: './uploads',
                filename: (_req, file, cb) => {
                    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
                    cb(null, uniqueName);
                },
            }),
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype.startsWith('image/')) {
                    return cb(new BadRequestException('Solo se permiten imágenes'), false);
                }
                cb(null, true);
            },
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        }),
    )
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No se recibió ningún archivo');
        return { url: `/uploads/${file.filename}` };
    }
}
