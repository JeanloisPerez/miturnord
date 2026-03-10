import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SlotValidationResult {
    available: boolean;
    status: 'CONFIRMED' | 'PENDING' | 'REJECTED';
    alternatives?: Date[];
    message?: string;
}

@Injectable()
export class SchedulingEngineService {
    constructor(private prisma: PrismaService) { }

    /**
     * Returns available HH:MM slots for a given branch, service, and date.
     * If branchId is null, falls back to institution-level schedules.
     */
    async getAvailableSlots(params: {
        institutionId: string;
        branchId?: string;
        serviceId: string;
        date: string; // YYYY-MM-DD
    }): Promise<string[]> {
        const { institutionId, branchId, serviceId, date } = params;

        // 1. Get service duration
        const service = await this.prisma.service.findFirst({
            where: { id: serviceId, institution_id: institutionId, active: true },
        });
        if (!service) return [];

        // 2. Get business rules for buffer
        const rule = await this.prisma.businessRule.findUnique({
            where: { institution_id: institutionId },
        });
        const bufferMinutes = rule?.buffer_minutes ?? 0;
        const maxPerSlot = rule?.max_per_slot ?? 1;
        const slotStepMinutes = service.duration + bufferMinutes;

        // 3. Get the schedule for that day of week
        const dayOfWeek = new Date(date + 'T12:00:00').getDay(); // safe mid-day parse
        const scheduleWhere: any = {
            institution_id: institutionId,
            day_of_week: dayOfWeek,
            active: true,
        };
        if (branchId) scheduleWhere.branch_id = branchId;
        else scheduleWhere.branch_id = null;

        let schedule = await this.prisma.schedule.findFirst({ where: scheduleWhere });

        // fallback: if branch has no schedule, try institution-level
        if (!schedule && branchId) {
            schedule = await this.prisma.schedule.findFirst({
                where: { institution_id: institutionId, day_of_week: dayOfWeek, active: true, branch_id: null },
            });
        }
        if (!schedule) return [];

        // 4. Generate all possible slots from start to end
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

        // 5. Get existing appointments for that date
        const dayStart = new Date(`${date}T00:00:00`);
        const dayEnd = new Date(`${date}T23:59:59`);
        const existingAppointments = await this.prisma.appointment.findMany({
            where: {
                institution_id: institutionId,
                ...(branchId ? { branch_id: branchId } : {}),
                status: { in: ['PENDING', 'CONFIRMED'] },
                date: { gte: dayStart, lte: dayEnd },
            },
        });

        // 6. Filter out blocked times
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

        // 7. Remove slots that collide with existing appointments or blocked times
        const availableSlots = allSlots.filter((slot) => {
            const slotStart = this.timeToMinutes(slot);
            const slotEnd = slotStart + service.duration;

            // Check blocked times
            const isBlocked = blockedSlots.some((b) => slotStart < b.end && slotEnd > b.start);
            if (isBlocked) return false;

            // Count occupancy for this slot
            const occupancy = existingAppointments.filter((appt) => {
                const apptStart = appt.date.getHours() * 60 + appt.date.getMinutes();
                const apptEnd = apptStart + service.duration;
                return slotStart < apptEnd && slotEnd > apptStart;
            }).length;

            return occupancy < maxPerSlot;
        });

        return availableSlots;
    }

    /**
     * Validates if a specific datetime is available.
     * Returns availability status and alternatives if not available.
     */
    async validateSlot(params: {
        institutionId: string;
        branchId?: string;
        serviceId: string;
        dateTime: Date; // Full datetime
    }): Promise<SlotValidationResult> {
        const { institutionId, branchId, serviceId, dateTime } = params;

        const date = dateTime.toISOString().split('T')[0];
        const requestedTime = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;

        const availableSlots = await this.getAvailableSlots({ institutionId, branchId, serviceId, date });

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

        // Slot not available — find alternatives (next 3 available in the same day or next 2 days)
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
                // Skip slots in the past and the originally requested time
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
}
