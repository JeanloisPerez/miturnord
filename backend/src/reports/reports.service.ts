import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getSummary(
        institutionId: string,
        range: 'week' | 'month',
        userId: string,
        userRole: string,
        startDate?: string,
        endDate?: string,
        serviceId?: string,
        branchId?: string,
    ) {
        // Ownership check
        if (userRole !== 'SAAS_ADMIN') {
            const membership = await this.prisma.institutionUser.findFirst({
                where: { institution_id: institutionId, user_id: userId, role: 'OWNER' },
            });
            if (!membership) throw new ForbiddenException('Sin acceso a los reportes de esta institución');
        }

        const now = new Date();

        // Today boundaries
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

        // Extra filters
        const extraWhere: any = {};
        if (serviceId) extraWhere.service_id = serviceId;
        if (branchId) extraWhere.branch_id = branchId;

        // Range boundaries
        let rangeStart: Date;
        let rangeEnd: Date = now;
        let rangeDays: number;
        let rangeLabel = '';

        if (startDate && endDate) {
            rangeStart = new Date(startDate + 'T00:00:00');
            rangeEnd = new Date(endDate + 'T23:59:59');
            rangeDays = Math.max(1, Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)));
            rangeLabel = `${startDate} a ${endDate}`;
        } else {
            rangeDays = range === 'month' ? 30 : 7;
            rangeStart = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);
            rangeLabel = range === 'month' ? 'Últimos 30 días' : 'Últimos 7 días';
        }

        const [todayAppts, rangeAppts, allAppts] = await Promise.all([
            // Today
            this.prisma.appointment.findMany({
                where: { institution_id: institutionId, date: { gte: todayStart, lte: todayEnd }, ...extraWhere },
                include: { service: { select: { name: true } }, user: { select: { id: true, full_name: true, email: true } } },
                orderBy: { date: 'asc' },
            }),
            // Range
            this.prisma.appointment.findMany({
                where: { institution_id: institutionId, date: { gte: rangeStart, lte: rangeEnd }, ...extraWhere },
                include: { service: { select: { id: true, name: true } } },
            }),
            // All time for status breakdown
            this.prisma.appointment.findMany({
                where: { institution_id: institutionId, ...extraWhere },
                select: { status: true, date: true, service: { select: { id: true, name: true } } },
            }),
        ]);

        // Status counts (range)
        const statusCounts = {
            PENDING: 0, CONFIRMED: 0, CANCELLED: 0, COMPLETED: 0, NO_SHOW: 0, RESCHEDULED: 0,
        };
        rangeAppts.forEach((a) => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });

        // Top services (range)
        const serviceMap: Record<string, { name: string; count: number }> = {};
        rangeAppts.forEach((a) => {
            const sid = a.service.id;
            if (!serviceMap[sid]) serviceMap[sid] = { name: a.service.name, count: 0 };
            serviceMap[sid].count++;
        });
        const topServices = Object.values(serviceMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Appointments by day (range) for chart
        const byDay: Record<string, number> = {};
        for (let i = rangeDays - 1; i >= 0; i--) {
            const d = new Date(rangeEnd.getTime() - i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().split('T')[0];
            byDay[key] = 0;
        }
        rangeAppts.forEach((a) => {
            const key = a.date.toISOString().split('T')[0];
            if (byDay[key] !== undefined) byDay[key]++;
        });

        // Busiest hours
        const hourMap: Record<number, number> = {};
        rangeAppts.forEach((a) => {
            const h = a.date.getHours();
            hourMap[h] = (hourMap[h] || 0) + 1;
        });
        const busiestHours = Object.entries(hourMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([hour, count]) => ({ hour: Number(hour), count }));

        // Unique clients (range)
        const uniqueClients = new Set(rangeAppts.map((a) => a.user_id)).size;

        return {
            today: {
                total: todayAppts.length,
                upcoming: todayAppts.filter((a) => a.date > now),
                list: todayAppts,
            },
            range: {
                label: rangeLabel,
                total: rangeAppts.length,
                statusCounts,
                uniqueClients,
            },
            topServices,
            busiestHours,
            byDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
        };
    }
}
