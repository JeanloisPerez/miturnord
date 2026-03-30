import {
    Controller, Get, Patch, Body, UseGuards, Request, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

class UpdateProfileDto {
    @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo', required: false })
    full_name?: string;
    @ApiProperty({ example: '8091234567', description: 'Teléfono', required: false })
    phone?: string;
}

export class ChangePasswordDto {
    @ApiProperty({ example: 'OldPassword123!', description: 'Contraseña actual' })
    current_password: string;
    @ApiProperty({ example: 'NewPassword123!', description: 'Nueva contraseña' })
    new_password: string;
}

@ApiTags('Usuarios - Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /** GET /users/me — devuelve el perfil del usuario autenticado */
    @Get('userDetails')
    @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
    @ApiResponse({ status: 200, description: 'Perfil obtenido correctamente.' })
    @ApiResponse({ status: 401, description: 'No autorizado / Token inválido.' })
    getMe(@Request() req: any) {
        return this.usersService.findById(req.user.sub);
    }

    /** PATCH /users/me — actualiza nombre y teléfono */
    @Patch('updateUserDetails')
    @ApiOperation({ summary: 'Actualizar nombre y teléfono del perfil autenticado' })
    @ApiResponse({ status: 200, description: 'Perfil actualizado correctamente.' })
    @ApiResponse({ status: 401, description: 'No autorizado / Token inválido.' })
    updateMe(@Request() req: any, @Body() dto: UpdateProfileDto) {
        return this.usersService.updateProfile(req.user.sub, dto);
    }

    /** PATCH /users/me/password — cambia la contraseña */
    @Patch('changeUserPassword')
    @ApiOperation({ summary: 'Cambiar la contraseña del usuario autenticado' })
    changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
        return this.usersService.changePassword(
            req.user.sub,
            dto.current_password,
            dto.new_password,
        );
    }

    /** GET /users/adminList — lista todos los usuarios (Solo SAAS_ADMIN) */
    @Get('adminList')
    @UseGuards(RolesGuard)
    @Roles('SAAS_ADMIN')
    @ApiOperation({ summary: 'SAAS_ADMIN: Lista completa de todos los usuarios' })
    adminList() {
        return this.usersService.adminListUsers();
    }

    /** GET /users/search — búsqueda de clientes para reserva interna */
    @Get('search')
    @UseGuards(RolesGuard)
    @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER', 'STAFF')
    @ApiOperation({ summary: 'Buscar usuarios por nombre, email o teléfono (para agendamiento interno)' })
    searchUsers(@Query('q') query: string) {
        if (!query || query.length < 2) return [];
        return this.usersService.searchUsers(query);
    }
}
