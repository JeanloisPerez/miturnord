import { PrismaClient } from './src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@miturnord.com';
  const plainPassword = 'admin123';
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  // Cleanup old user table record if exists
  const oldUser = await prisma.user.findUnique({ where: { email } });
  if (oldUser) {
    await prisma.userRole.deleteMany({ where: { user_id: oldUser.id } });
    await prisma.user.delete({ where: { id: oldUser.id } });
    console.log('Cleaned up legacy User table record for admin.');
  }

  let admin = await prisma.saasAdmin.findUnique({ where: { email } });
  
  if (!admin) {
    admin = await prisma.saasAdmin.create({
      data: {
        full_name: 'SAAS Administrator',
        email,
        password_hash: passwordHash,
      }
    });
    console.log(`Created SAAS Admin in new table: ${email}`);
  } else {
    // Force reset password just in case
    admin = await prisma.saasAdmin.update({
      where: { email },
      data: { password_hash: passwordHash }
    });
    console.log(`SAAS Admin ${email} already existed. Password reset to default.`);
  }

  console.log('\n--- SAAS ADMIN CREDENTIALS ---');
  console.log(`Email: ${email}`);
  console.log(`Password: ${plainPassword}`);
  console.log('------------------------------\n');
}

main()
  .catch((e) => {
    console.error('Error creating SAAS_ADMIN:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
