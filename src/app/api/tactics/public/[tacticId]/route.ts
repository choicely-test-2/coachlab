import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { tacticId: string } }
) {
  try {
    const tactic = await prisma.tactic.findUnique({
      where: { id: params.tacticId },
      include: { team: true },
    });

    if (!tactic || tactic.visibility !== 'PUBLIC') {
      return NextResponse.json({ error: 'Tactic not found' }, { status: 404 });
    }

    // Parse the stored JSON string to object for client
    const parsedData = JSON.parse(tactic.data as string);

    const response = {
      ...tactic,
      data: parsedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching public tactic:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tactic' },
      { status: 500 }
    );
  }
}
