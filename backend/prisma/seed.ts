import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
    const roles = [
        { id: 1, name: 'CLIENT' },
        { id: 2, name: 'INSTITUTION_USER' },
        { id: 3, name: 'ADMIN' },
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {},
            create: role,
        });
    }

    console.log('Roles seeded dynamically');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });