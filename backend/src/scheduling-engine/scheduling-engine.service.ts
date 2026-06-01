import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleCalendarService } from '../google-calendar/google-calendar.service';

export interface SlotValidationResult {
    available: boolean;
    status: 'CONFIRMED' | 'PENDING' | 'REJECTED';
    alternatives?: Date[];
    message?: string;
}

@Injectable()
export class SchedulingEngineService {
    constructor(
        private prisma: PrismaService,
        private googleCalendar: GoogleCalendarService,
    ) { }

    /**
     * Devuelve los espacios (slots) HH:MM disponibles para una sucursal, servicio y fecha dados.
     * Si branchId es null, recurre a los horarios de nivel de institución.
     */
    async getAvailableSlots(params: {
        institutionId: string;
        branchId?: string;
        serviceId: string;
        date: string; // YYYYY-MM-DD
        excludeAppointmentId?: string;
    }): Promise<string[]> {
        const { institutionId, branchId, serviceId, date, excludeAppointmentId } = params;

        // 1. Obtener duración del servicio
        const service = await this.prisma.service.findFirst({
            where: { id: serviceId, institution_id: institutionId, active: true },
        });
        if (!service) return [];

        // Si se especifica una sucursal, verificar que el servicio esté asignado a ella
        if (branchId) {
            const branchAssignment = await this.prisma.branchService.findUnique({
                where: { branch_id_service_id: { branch_id: branchId, service_id: serviceId } },
            });
            if (!branchAssignment || !branchAssignment.active) return [];
        }

        // Obtener reglas de negocio para el buffer
        const rule = await this.prisma.businessRule.findUnique({
            where: { institution_id: institutionId },
        });
        const bufferMinutes = rule?.buffer_minutes ?? 0;
        const maxPerSlot = rule?.max_per_slot ?? 1;
        const slotStepMinutes = service.duration + bufferMinutes;

        // Obtener el horario para ese día de la semana
        const [y, mo, d] = date.split('-').map(Number);
        const dayOfWeek = new Date(Date.UTC(y, mo - 1, d)).getUTCDay(); // UTC-safe day-of-week
        const scheduleWhere: any = {
            institution_id: institutionId,
            day_of_week: dayOfWeek,
            active: true,
        };
        if (branchId) scheduleWhere.branch_id = branchId;
        else scheduleWhere.branch_id = null;

        let schedule = await this.prisma.schedule.findFirst({ where: scheduleWhere });

        // fallback: si la sucursal no tiene horario, intentar a nivel de institución
        if (!schedule && branchId) {
            schedule = await this.prisma.schedule.findFirst({
                where: { institution_id: institutionId, day_of_week: dayOfWeek, active: true, branch_id: null },
            });
        }
        if (!schedule) return [];

        // Generar todos los espacios posibles desde el inicio hasta el fin
        const allSlots: string[] = [];
        const [startH, startM] = schedule.start_time.split(':').map(Number);
        const [endH, endM] = schedule.end_time.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        for (let m = startMinutes; m + service.duration <= endMinutes; m += slotStepMinutes) {
            const h = Math.floor(m / 60).toString().padStart(2, '0');
            const min = (m % 60).toString().padStart(2, '0');
            allSlots.push(`${h}:${min}`);
        }

        //Obtener citas existentes para esa fecha
        const dayStart = new Date(`${date}T00:00:00.000Z`);
        const dayEnd = new Date(`${date}T23:59:59.999Z`);
        const existingAppointments = await this.prisma.appointment.findMany({
            where: {
                institution_id: institutionId,
                ...(branchId ? { branch_id: branchId } : {}),
                status: { in: ['PENDING', 'CONFIRMED'] },
                date: { gte: dayStart, lte: dayEnd },
                ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
            },
        });

        // Filtrar tiempos bloqueados
        let blockedSlots: { start: number; end: number }[] = [];
        if (branchId) {
            const blocked = await this.prisma.blockedTime.findMany({
                where: { branch_id: branchId, date: dayStart },
            });
            blockedSlots = blocked.map((b) => ({
                start: this.timeToMinutes(b.start_time),
                end: this.timeToMinutes(b.end_time),
            }));
        }

        // Obtener tiempos ocupados en Google Calendar de los empleados vinculados
        const staffMembers = await this.prisma.institutionUser.findMany({
            where: {
                institution_id: institutionId,
                user: {
                    NOT: { google_refresh_token: null },
                },
            },
        });

        const googleBusySlots: { start: number; end: number }[] = [];
        for (const staff of staffMembers) {
            const busyList = await this.googleCalendar.getBusySlots(
                staff.user_id,
                dayStart,
                dayEnd
            );
            for (const busy of busyList) {
                const startM = busy.start.getUTCHours() * 60 + busy.start.getUTCMinutes();
                const endM = busy.end.getUTCHours() * 60 + busy.end.getUTCMinutes();
                googleBusySlots.push({ start: startM, end: endM });
            }
        }

        // 7. Eliminar espacios que colisionan con citas existentes, tiempos bloqueados o Google Calendar
        const availableSlots = allSlots.filter((slot) => {
            const slotStart = this.timeToMinutes(slot);
            const slotEnd = slotStart + service.duration;

            // Revisar tiempos bloqueados de administración
            const isBlocked = blockedSlots.some((b) => slotStart < b.end && slotEnd > b.start);
            if (isBlocked) return false;

            // Revisar tiempos bloqueados en Google Calendar
            const isGoogleBusy = googleBusySlots.some((b) => slotStart < b.end && slotEnd > b.start);
            if (isGoogleBusy) return false;

            // Contar ocupación para este slot
            const occupancy = existingAppointments.filter((appt) => {
                const apptStart = appt.date.getUTCHours() * 60 + appt.date.getUTCMinutes();
                const apptEnd = apptStart + service.duration;
                return slotStart < apptEnd && slotEnd > apptStart;
            }).length;

            return occupancy < maxPerSlot;
        });

        return availableSlots;
    }

    /**
     * Valida si un datetime específico está disponible.
     * Devuelve el estado de disponibilidad y alternativas si no está disponible.
     */
    async validateSlot(params: {
        institutionId: string;
        branchId?: string;
        serviceId: string;
        dateTime: Date; // Full datetime
        excludeAppointmentId?: string;
    }): Promise<SlotValidationResult> {
        const { institutionId, branchId, serviceId, dateTime, excludeAppointmentId } = params;

        const date = dateTime.toISOString().split('T')[0]; // Fecha UTC en formato YYYY-MM-DD
        const requestedTime = `${dateTime.getUTCHours().toString().padStart(2, '0')}:${dateTime.getUTCMinutes().toString().padStart(2, '0')}`;

        const availableSlots = await this.getAvailableSlots({ institutionId, branchId, serviceId, date, excludeAppointmentId });

        if (availableSlots.includes(requestedTime)) {
            const rule = await this.prisma.businessRule.findUnique({
                where: { institution_id: institutionId },
            });
            const autoConfirm = rule?.auto_confirm ?? true;
            return {
                available: true,
                status: autoConfirm ? 'CONFIRMED' : 'PENDING',
            };
        }

        // Espacio no disponible — encontrar alternativas (próximos 3 disponibles en el mismo día o los siguientes 2 días)
        const alternatives: Date[] = [];
        for (let dayOffset = 0; dayOffset <= 2 && alternatives.length < 3; dayOffset++) {
            const altDate = new Date(dateTime);
            altDate.setDate(altDate.getDate() + dayOffset);
            const altDateStr = altDate.toISOString().split('T')[0];
            const altSlots = await this.getAvailableSlots({ institutionId, branchId, serviceId, date: altDateStr });

            for (const slot of altSlots) {
                if (alternatives.length >= 3) break;
                const [h, m] = slot.split(':').map(Number);
                const altDateTime = new Date(altDate);
                altDateTime.setHours(h, m, 0, 0);
                // Saltar horarios en el pasado y el horario solicitado originalmente
                if (dayOffset === 0 && this.timeToMinutes(slot) <= this.timeToMinutes(requestedTime)) continue;
                alternatives.push(altDateTime);
            }
        }

        return {
            available: false,
            status: 'REJECTED',
            alternatives,
            message: 'El horario solicitado no está disponible.',
        };
    }

    private timeToMinutes(time: string): number {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }

    async debugSlots(params: { institutionId: string; branchId?: string; serviceId: string; date: string }) {
        const { institutionId, branchId, serviceId, date } = params;
        const trace: any = { params };

        const service = await this.prisma.service.findFirst({
            where: { id: serviceId, institution_id: institutionId, active: true },
        });
        trace.service = service ? { id: service.id, name: service.name, duration: service.duration } : null;
        if (!service) return { ...trace, failAt: 'servicio no encontrado o inactivo' };

        if (branchId) {
            const branchAssignment = await this.prisma.branchService.findUnique({
                where: { branch_id_service_id: { branch_id: branchId, service_id: serviceId } },
            });
            trace.branchServiceAssignment = branchAssignment;
            if (!branchAssignment || !branchAssignment.active) return { ...trace, failAt: 'servicio no asignado/activo en esta sucursal' };
        }

        const rule = await this.prisma.businessRule.findUnique({ where: { institution_id: institutionId } });
        trace.businessRule = rule;

        const [y, mo, d] = date.split('-').map(Number);
        const dayOfWeek = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
        trace.dayOfWeek = dayOfWeek;

        const scheduleWhere: any = { institution_id: institutionId, day_of_week: dayOfWeek, active: true };
        if (branchId) scheduleWhere.branch_id = branchId;
        else scheduleWhere.branch_id = null;

        let schedule = await this.prisma.schedule.findFirst({ where: scheduleWhere });
        trace.scheduleLookup = { where: scheduleWhere, found: schedule };

        if (!schedule && branchId) {
            schedule = await this.prisma.schedule.findFirst({
                where: { institution_id: institutionId, day_of_week: dayOfWeek, active: true, branch_id: null },
            });
            trace.scheduleInstitutionFallback = schedule;
        }

        if (!schedule) return { ...trace, failAt: 'no schedule encontrada para este dia de la semana' };

        const bufferMinutes = rule?.buffer_minutes ?? 0;
        const slotStepMinutes = service.duration + bufferMinutes;
        const [startH, startM] = schedule.start_time.split(':').map(Number);
        const [endH, endM] = schedule.end_time.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        const allSlots: string[] = [];
        for (let m = startMinutes; m + service.duration <= endMinutes; m += slotStepMinutes) {
            allSlots.push(`${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`);
        }
        trace.schedule = { start: schedule.start_time, end: schedule.end_time, generatedSlots: allSlots };

        return { ...trace, failAt: null, result: 'slots generados exitosamente' };
    }
}
