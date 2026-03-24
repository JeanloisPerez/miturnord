import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';

@ApiTags('System Settings')
@Controller('systemSettings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get('getSettings')
  @Roles('SAAS_ADMIN')
  @ApiOperation({ summary: 'Obtener la configuración global del sistema (Solo SAAS_ADMIN)' })
  getSettings() {
    return this.systemSettingsService.getSettings();
  }

  @Patch('updateSettings')
  @Roles('SAAS_ADMIN')
  @ApiOperation({ summary: 'Actualizar configuración global (Frecuencia de CRON, retención de logs)' })
  @ApiBody({
      schema: {
          type: 'object',
          properties: {
              cron_reminder_frequency_minutes: { type: 'number', example: 60 },
              log_retention_days: { type: 'number', example: 7 },
          }
      }
  })
  updateSettings(
    @Body() body: { cron_reminder_frequency_minutes?: number; log_retention_days?: number }
  ) {
    return this.systemSettingsService.updateSettings(body);
  }
}
