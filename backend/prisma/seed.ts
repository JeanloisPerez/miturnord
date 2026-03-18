import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

import { DEFAULT_INSTITUTION_TYPES } from '../src/constants/institution-types';

async function main() {
    console.log('🌱 Seeding MiTurnoRD database (sector-based types)...');

    // ─── 1. Roles ───
    const roles = [
        { id: 1, name: 'CLIENT' },
        { id: 2, name: 'INSTITUTION_OWNER' },
        { id: 3, name: 'SAAS_ADMIN' },
    ];
    for (const role of roles) {
        await prisma.role.upsert({ where: { name: role.name }, update: {}, create: role });
    }
    console.log('✅ Roles seeded');

    // ─── 2. Institution Types (upsert by name) ───
    for (const typeData of DEFAULT_INSTITUTION_TYPES) {
        const { fields, ...typeInfo } = typeData;
        const instType = await prisma.institutionType.upsert({
            where: { name: typeInfo.name },
            update: { description: typeInfo.description, icon: typeInfo.icon },
            create: typeInfo,
        });

        console.log(`  ✅ Sector: ${typeInfo.icon} ${typeInfo.name}`);
    }

    console.log('\n✅ All sectors seeded!');
    console.log('🚀 MiTurnoRD database is ready.');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });