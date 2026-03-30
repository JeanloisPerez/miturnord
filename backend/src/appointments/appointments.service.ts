import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingEngineService } from '../scheduling-engine/scheduling-engine.service';
import { EmailsService } from '../emails/emails.service';

const APPOINTMENT_INCLUDE = {
  service: { select: { id: true, name: true, duration: true, price: true } },
  institution: { select: { id: true, name: true, slug: true, institution_type: { select: { name: true, icon: true } } } },
  branch: { select: { id: true, name: true, address: true, city: true } },
  user: { select: { id: true, full_name: true, email: true, phone: true } },
  responses: { include: { field: { select: { label: true, field_type: true } } } },
};

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private schedulingEngine: SchedulingEngineService,
    private emailsService: EmailsService,
  ) { }

  async create(dto: CreateAppointmentDto, userId: string) {
    // Determina el userId final: staff puede pasar un user_id explícito o crear un walk-in
    const isWalkIn = dto.booked_by_staff && !dto.user_id && !!dto.walk_in_name;
    const effectiveUserId = dto.booked_by_staff
      ? (dto.user_id ?? null)   // staff puede pasar user_id o dejarlo null (walk-in)
      : userId;                  // cliente normal siempre usa su propio id

    const service = await this.prisma.service.findFirst({
      where: { id: dto.service_id, institution_id: dto.institution_id, active: true },
    });
    if (!service) throw new BadRequestException('El servicio no pertenece a esta institución o no está activo');

    // 2. valida que la institution existe
    const institution = await this.prisma.institution.findUnique({
      where: { id: dto.institution_id },
    });
    if (!institution) throw new NotFoundException('Institución no encontrada');

    // 3. Valida que los campos requeridos para esta institución (y servicio si aplica) estén presentes
    const institutionFields = await this.prisma.customField.findMany({
      where: {
        institution_id: dto.institution_id,
        OR: [{ service_id: null }, { service_id: dto.service_id }]
      }
    });
    const requiredFields = institutionFields.filter((f) => f.required);
    const providedFieldIds = new Set((dto.field_responses || []).map((r) => r.field_id));
    const missingFields = requiredFields.filter((f) => !providedFieldIds.has(f.id));
    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Campos requeridos faltantes: ${missingFields.map((f) => f.label).join(', ')}`,
      );
    }

    // 4. Ejecuta la validación del motor de programación
    const appointmentDate = new Date(dto.date);
    const validation = await this.schedulingEngine.validateSlot({
      institutionId: dto.institution_id,
      branchId: dto.branch_id,
      serviceId: dto.service_id,
      dateTime: appointmentDate,
    });

    if (!validation.available) {
      throw new ConflictException({
        message: validation.message || 'Horario no disponible',
        alternatives: (validation.alternatives || []).map((d) => d.toISOString()),
      });
    }

    // 5. Crea la cita en una transacción
    const result = await this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          institution_id: dto.institution_id,
          service_id: dto.service_id,
          user_id: effectiveUserId,
          branch_id: dto.branch_id || null,
          date: appointmentDate,
          notes: dto.notes,
          status: validation.status as any,
          booked_by_staff: dto.booked_by_staff ?? false,
          walk_in_name: dto.walk_in_name ?? null,
          walk_in_phone: dto.walk_in_phone ?? null,
          walk_in_email: dto.walk_in_email ?? null,
        },
      });

      if (dto.field_responses && dto.field_responses.length > 0) {
        await tx.appointmentFieldResponse.createMany({
          data: dto.field_responses.map((r) => ({
            appointment_id: appointment.id,
            field_id: r.field_id,
            value: r.value,
          })),
        });
      }

      return tx.appointment.findUnique({ where: { id: appointment.id }, include: APPOINTMENT_INCLUDE });
    });

    if (result && result.status === 'CONFIRMED') {
      const recipientEmail = result.user?.email ?? dto.walk_in_email;
      const recipientName = result.user?.full_name ?? dto.walk_in_name ?? 'Cliente';

      if (recipientEmail) {
        const formattedDate = result.date.toLocaleString('es-DO', { dateStyle: 'full', timeStyle: 'short', hour12: false });
        this.emailsService.sendAppointmentConfirmation(
          recipientEmail,
          recipientName,
          formattedDate,
          result.service.name,
          result.institution.name
        ).catch(e => console.error('Fallo al enviar correo desde AppointmentsService:', e));
      }
    }

    return result;
  }

  findAll(userId: string, role: string, institutionId?: string) {
    let where: any = {};
    if (role === 'CLIENT') {
      where.user_id = userId;
    } else if (role === 'INSTITUTION_OWNER') {
      where.institution_id = institutionId;
    }

    return this.prisma.appointment.findMany({
      where,
      include: APPOINTMENT_INCLUDE,
      orderBy: { date: 'desc' },
    });
  }

  async findAllByInstitution(institutionId: string, filters: { status?: string; branchId?: string; date?: string }) {
    const where: any = { institution_id: institutionId };

    if (filters.status) where.status = filters.status;
    if (filters.branchId) where.branch_id = filters.branchId;
    if (filters.date) {
      const d = new Date(filters.date);
      where.date = {
        gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
      };
    }

    return this.prisma.appointment.findMany({
      where,
      include: APPOINTMENT_INCLUDE,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: string, institutionId?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: APPOINTMENT_INCLUDE,
    });
    if (!appointment) throw new NotFoundException(`Cita ${id} no encontrada`);

    if (role === 'CLIENT' && appointment.user_id !== userId)
      throw new NotFoundException(`Cita ${id} no encontrada`);
    if (role === 'INSTITUTION_OWNER' && appointment.institution_id !== institutionId)
      throw new NotFoundException(`Cita ${id} no encontrada`);

    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto, userId: string, role: string, institutionId?: string) {
    const appointment = await this.findOne(id, userId, role, institutionId);

    let newStatus = dto.status;
    let newDate = appointment.date;

    // Si se está cambiando la fecha 
    if (dto.date) {
      newDate = new Date(dto.date);
      const validation = await this.schedulingEngine.validateSlot({
        institutionId: appointment.institution_id,
        branchId: appointment.branch_id || undefined,
        serviceId: appointment.service_id,
        dateTime: newDate,
        excludeAppointmentId: id
      });

      if (!validation.available) {
        throw new ConflictException({
          message: validation.message || 'El nuevo horario no está disponible',
          alternatives: (validation.alternatives || []).map((d) => d.toISOString()),
        });
      }
      newStatus = validation.status; // CONFIRMED o PENDING según reglas de negocio
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        ...(dto.date !== undefined && { date: newDate }),
        ...(newStatus !== undefined && { status: newStatus as any }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: APPOINTMENT_INCLUDE,
    });

    // Si se reagendó y quedó confirmada, enviar nuevo correo
    if (dto.date && updated.status === 'CONFIRMED' && updated.user?.email) {
      const formattedDate = updated.date.toLocaleString('es-DO', {
        dateStyle: 'full', timeStyle: 'short', hour12: false
      });
      // Notificar por correo el cambio de horario
      this.emailsService.sendAppointmentConfirmation(
        updated.user.email,
        updated.user.full_name,
        `NUEVO HORARIO: ${formattedDate}`,
        updated.service.name,
        updated.institution.name
      ).catch(e => console.error('Error al enviar correo de reagendamiento:', e));
    }

    return updated;
  }

  async cancel(id: string, userId: string, role?: string, institutionId?: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException(`Cita ${id} no encontrada`);
    
    // Auth checks
    if (role === 'CLIENT' && appointment.user_id !== userId) {
        throw new ForbiddenException('Solo puedes cancelar tus propias citas');
    }
    if (role === 'INSTITUTION_OWNER' && appointment.institution_id !== institutionId) {
        throw new ForbiddenException('No tienes acceso a esta cita');
    }

    if (!['PENDING', 'CONFIRMED'].includes(appointment.status))
      throw new BadRequestException('Solo se pueden cancelar citas pendientes o confirmadas');

    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: APPOINTMENT_INCLUDE,
    });
  }

  async getInstitutionClients(institutionId: string, userId: string, userRole: string) {
    if (userRole !== 'SAAS_ADMIN') {
      const membership = await this.prisma.institutionUser.findFirst({
        where: { institution_id: institutionId, user_id: userId, role: 'OWNER' },
      });
      if (!membership) throw new ForbiddenException('Sin acceso');
    }

    const appointments = await this.prisma.appointment.findMany({
      where: { institution_id: institutionId },
      include: {
        user: { select: { id: true, full_name: true, email: true, phone: true, created_at: true } },
        service: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Group by user
    const clientMap: Record<string, any> = {};
    appointments.forEach((appt) => {
      if (!appt.user) return;
      const uid = appt.user.id;
      if (!clientMap[uid]) {
        clientMap[uid] = { ...appt.user, appointments: [] };
      }
      clientMap[uid].appointments.push({
        id: appt.id,
        date: appt.date,
        status: appt.status,
        service: appt.service.name,
      });
    });

    return Object.values(clientMap);
  }

  async remove(id: string) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw new NotFoundException(`Cita ${id} no encontrada`);
    return this.prisma.appointment.delete({ where: { id } });
  }
}
