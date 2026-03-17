import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'demo@example.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const hashedPassword = await bcrypt.hash('password', 10);
    await prisma.user.create({
      data: {
        email,
        name: 'Demo Coach',
        password: hashedPassword,
      },
    });
    console.log('Demo user created');
  } else {
    console.log('Demo user already exists');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
