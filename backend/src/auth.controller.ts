import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth/auth.service';
import { RegisterDto } from './auth/dto/register.dto';
import { LoginDto } from './auth/dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('registerUser')
    @ApiOperation({ summary: 'Registrar un nuevo usuario' })
    @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente.' })
    @ApiResponse({ status: 400, description: 'Datos inválidos.' })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('loginUser')
    @ApiOperation({ summary: 'Iniciar sesión' })
    @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso.' })
    @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto.email, dto.password);
    }

    @Post('admin/login')
    @ApiOperation({ summary: 'Iniciar sesión (SAAS Admin)' })
    @ApiResponse({ status: 200, description: 'Inicio de sesión de administrador exitoso.' })
    @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
    adminLogin(@Body() dto: LoginDto) {
        return this.authService.adminLogin(dto.email, dto.password);
    }
}