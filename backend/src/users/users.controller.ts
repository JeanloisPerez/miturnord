import {
    Controller, Get, Patch, Body, UseGuards, Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class UpdateProfileDto {
    full_name?: string;
    phone?: string;
}

class ChangePasswordDto {
    current_password: string;
    new_password: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /** GET /users/me — devuelve el perfil del usuario autenticado */
    @Get('me')
    getMe(@Request() req: any) {
        return this.usersService.findById(req.user.sub);
    }

    /** PATCH /users/me — actualiza nombre y teléfono */
    @Patch('me')
    updateMe(@Request() req: any, @Body() dto: UpdateProfileDto) {
        return this.usersService.updateProfile(req.user.sub, dto);
    }

    /** PATCH /users/me/password — cambia la contraseña */
    @Patch('me/password')
    changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
        return this.usersService.changePassword(
            req.user.sub,
            dto.current_password,
            dto.new_password,
        );
    }
}
