import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding MiTurnoRD database...');

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

    // ─── 2. Institution Types ───
    const institutionTypes = [
        {
            name: 'Clínica / Hospital',
            description: 'Centros de salud, clínicas médicas y hospitales',
            icon: '🏥',
            fields: [
                { label: 'Nombre del Paciente', field_type: 'TEXT', required: true, placeholder: 'Ej: Juan Pérez', order: 1 },
                { label: 'Cédula / Pasaporte', field_type: 'TEXT', required: true, placeholder: 'Ej: 001-0000000-0', order: 2 },
                { label: 'Fecha de Nacimiento', field_type: 'DATE', required: true, placeholder: '', order: 3 },
                { label: 'Seguro Médico', field_type: 'SELECT', required: false, options: JSON.stringify(['ARS Humano', 'ARS Senasa', 'ARS Universal', 'ARS Banreservas', 'Ninguno']), order: 4 },
                { label: 'Motivo de Consulta', field_type: 'TEXT', required: true, placeholder: 'Describa brevemente su motivo', order: 5 },
                { label: 'Teléfono de Contacto', field_type: 'PHONE', required: true, placeholder: '809-000-0000', order: 6 },
            ],
        },
        {
            name: 'Centro Educativo',
            description: 'Colegios, universidades y centros de aprendizaje',
            icon: '🏫',
            fields: [
                { label: 'Nombre del Estudiante', field_type: 'TEXT', required: true, placeholder: 'Nombre completo', order: 1 },
                { label: 'Matrícula', field_type: 'TEXT', required: true, placeholder: 'Número de matrícula', order: 2 },
                { label: 'Grado / Carrera', field_type: 'TEXT', required: true, placeholder: 'Ej: 2do Bachillerato / Ingeniería', order: 3 },
                { label: 'Nombre del Tutor', field_type: 'TEXT', required: false, placeholder: 'Nombre del representante', order: 4 },
                { label: 'Teléfono del Tutor', field_type: 'PHONE', required: false, placeholder: '809-000-0000', order: 5 },
                { label: 'Motivo de la Cita', field_type: 'SELECT', required: true, options: JSON.stringify(['Orientación académica', 'Trámite administrativo', 'Reunión con docente', 'Asunto disciplinario', 'Otro']), order: 6 },
            ],
        },
        {
            name: 'Banco / Institución Financiera',
            description: 'Bancos, cooperativas y entidades financieras',
            icon: '🏦',
            fields: [
                { label: 'Nombre del Titular', field_type: 'TEXT', required: true, placeholder: 'Nombre completo', order: 1 },
                { label: 'Cédula / Pasaporte', field_type: 'TEXT', required: true, placeholder: '001-0000000-0', order: 2 },
                { label: 'Número de Cuenta', field_type: 'NUMBER', required: false, placeholder: 'Número de cuenta (si aplica)', order: 3 },
                { label: 'Tipo de Trámite', field_type: 'SELECT', required: true, options: JSON.stringify(['Apertura de cuenta', 'Préstamo personal', 'Tarjeta de crédito', 'Inversión', 'Transferencia internacional', 'Atención al cliente']), order: 4 },
                { label: 'Teléfono', field_type: 'PHONE', required: true, placeholder: '809-000-0000', order: 5 },
            ],
        },
        {
            name: 'Oficina Gubernamental',
            description: 'Instituciones del gobierno, ministerios y organismos públicos',
            icon: '🏛️',
            fields: [
                { label: 'Nombre Completo', field_type: 'TEXT', required: true, placeholder: 'Nombre completo del ciudadano', order: 1 },
                { label: 'Cédula de Identidad', field_type: 'TEXT', required: true, placeholder: '001-0000000-0', order: 2 },
                { label: 'Tipo de Gestión', field_type: 'SELECT', required: true, options: JSON.stringify(['Solicitud de documentos', 'Registro civil', 'Licencias y permisos', 'Trámite fiscal', 'Consulta informativa', 'Otro']), order: 3 },
                { label: 'Correo Electrónico', field_type: 'EMAIL', required: false, placeholder: 'correo@ejemplo.com', order: 4 },
                { label: 'Teléfono', field_type: 'PHONE', required: true, placeholder: '809-000-0000', order: 5 },
            ],
        },
        {
            name: 'Salón de Belleza / Spa',
            description: 'Salones de estética, peluquerías y spas',
            icon: '💈',
            fields: [
                { label: 'Nombre del Cliente', field_type: 'TEXT', required: true, placeholder: 'Su nombre', order: 1 },
                { label: 'Teléfono', field_type: 'PHONE', required: true, placeholder: '809-000-0000', order: 2 },
                { label: 'Tipo de Servicio', field_type: 'SELECT', required: true, options: JSON.stringify(['Corte de cabello', 'Coloración', 'Manicure', 'Pedicure', 'Tratamiento capilar', 'Spa facial', 'Otro']), order: 3 },
                { label: 'Nota Adicional', field_type: 'TEXT', required: false, placeholder: 'Preferencias o alergias', order: 4 },
            ],
        },
        {
            name: 'Taller Mecánico',
            description: 'Talleres de reparación y mantenimiento vehicular',
            icon: '🔧',
            fields: [
                { label: 'Nombre del Propietario', field_type: 'TEXT', required: true, placeholder: 'Nombre completo', order: 1 },
                { label: 'Teléfono', field_type: 'PHONE', required: true, placeholder: '809-000-0000', order: 2 },
                { label: 'Marca del Vehículo', field_type: 'TEXT', required: true, placeholder: 'Ej: Toyota Corolla', order: 3 },
                { label: 'Placa / Tablilla', field_type: 'TEXT', required: true, placeholder: 'Ej: A123456', order: 4 },
                { label: 'Año del Vehículo', field_type: 'NUMBER', required: true, placeholder: 'Ej: 2020', order: 5 },
                { label: 'Tipo de Servicio', field_type: 'SELECT', required: true, options: JSON.stringify(['Cambio de aceite', 'Revisión general', 'Frenos', 'Sistema eléctrico', 'Transmisión', 'Otro']), order: 6 },
                { label: 'Descripción del Problema', field_type: 'TEXT', required: false, placeholder: 'Describa el problema del vehículo', order: 7 },
            ],
        },
        {
            name: 'Consultora / Asesoría',
            description: 'Firmas de consultoría legal, financiera o empresarial',
            icon: '💼',
            fields: [
                { label: 'Nombre Completo', field_type: 'TEXT', required: true, placeholder: 'Nombre del cliente', order: 1 },
                { label: 'Correo Electrónico', field_type: 'EMAIL', required: true, placeholder: 'correo@empresa.com', order: 2 },
                { label: 'Empresa (si aplica)', field_type: 'TEXT', required: false, placeholder: 'Nombre de la empresa', order: 3 },
                { label: 'Área de Consulta', field_type: 'SELECT', required: true, options: JSON.stringify(['Legal / Jurídica', 'Contabilidad / Finanzas', 'Recursos Humanos', 'Tecnología', 'Marketing', 'Otro']), order: 4 },
                { label: 'Descripción Breve', field_type: 'TEXT', required: true, placeholder: 'Describa brevemente su situación', order: 5 },
            ],
        },
    ];

    for (const typeData of institutionTypes) {
        const { fields, ...typeInfo } = typeData;
        const instType = await prisma.institutionType.upsert({
            where: { name: typeInfo.name },
            update: { description: typeInfo.description, icon: typeInfo.icon },
            create: typeInfo,
        });

        for (const field of fields) {
            await prisma.customField.upsert({
                where: { id: `${instType.id}-field-${field.order}` },
                update: {},
                create: {
                    id: `${instType.id}-field-${field.order}`,
                    label: field.label,
                    field_type: field.field_type as any,
                    required: field.required,
                    placeholder: field.placeholder,
                    options: (field as any).options || null,
                    order: field.order,
                    institution_type_id: instType.id,
                },
            });
        }
        console.log(`  ✅ Type: ${typeInfo.icon} ${typeInfo.name} (${fields.length} fields)`);
    }

    console.log('\n✅ All institution types and fields seeded!');
    console.log('🚀 MiTurnoRD database is ready.');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });