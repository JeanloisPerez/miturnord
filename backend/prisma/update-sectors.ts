/**
 * update-sectors.ts
 * Renames old institution type names to new sector-based names in the DB.
 * Run with: npx ts-node -e "require('./prisma/update-sectors.ts')"
 * Or: npx tsx prisma/update-sectors.ts
 */
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Map old name → new name + new description + new icon
const renames: Array<{ from: string; to: string; description: string; icon: string }> = [
    { from: 'Clínica / Hospital', to: 'Salud', icon: '🏥', description: 'Clínicas, hospitales, dentistas, laboratorios y servicios médicos' },
    { from: 'Banco / Institución Financiera', to: 'Finanzas', icon: '🏦', description: 'Bancos, cooperativas, seguros y entidades financieras' },
    { from: 'Oficina Gubernamental', to: 'Gobierno', icon: '🏛️', description: 'Ministerios, oficinas gubernamentales, registro civil y organismos públicos' },
    { from: 'Centro Educativo', to: 'Educación', icon: '🎓', description: 'Colegios, universidades, academias y centros de capacitación' },
    { from: 'Salón de Belleza / Spa', to: 'Bienestar', icon: '✂️', description: 'Salones de belleza, spas, barberías y centros de bienestar' },
    { from: 'Consultora / Asesoría', to: 'Servicios Profesionales', icon: '💼', description: 'Consultorios legales, contables, notarías y consultoría empresarial' },
    { from: 'Taller Mecánico', to: 'Automotriz', icon: '🔧', description: 'Talleres mecánicos, concesionarios y servicios automotrices' },
];

async function main() {
    console.log('🔄 Updating institution type sector names...\n');
    for (const r of renames) {
        const existing = await prisma.institutionType.findUnique({ where: { name: r.from } });
        if (existing) {
            await prisma.institutionType.update({
                where: { name: r.from },
                data: { name: r.to, description: r.description, icon: r.icon },
            });
            console.log(`  ✅ "${r.from}" → "${r.to}"`);
        } else {
            console.log(`  ⏭️  "${r.from}" no encontrado en BD (ya fue renombrado o no existe)`);
        }
    }
    console.log('\n✅ Sector names updated!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
