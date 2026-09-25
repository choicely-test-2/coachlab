import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  const email = 'test@example.com';
  const password = 'test123';
  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log('Test user already exists:', existing.email);
      return;
    }

    const user = await prisma.user.create({
      data: {
        id: 'clg5x2m9k00001abcdef',
        email,
        name: 'Test User',
        password: hashedPassword,
        emailVerified: new Date(),
        createdAt: new Date(),
      },
    });

    console.log('Created test user:', user.email);
    console.log('Password:', password);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
