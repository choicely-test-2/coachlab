import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const publicTactics = await prisma.tactic.findMany({
      where: { visibility: 'PUBLIC' },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            name: true,
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(publicTactics);
  } catch (error) {
    console.error('Error fetching public tactics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public tactics' },
      { status: 500 }
    );
  }
}
