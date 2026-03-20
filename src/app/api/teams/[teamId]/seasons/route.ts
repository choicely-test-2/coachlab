import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { teamId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const team = await prisma.team.findFirst({
    where: { id: params.teamId, members: { some: { userId: user.id } } },
    include: { seasons: { orderBy: { startDate: 'desc' } } },
  });

  if (!team) {
    return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
  }

  return NextResponse.json(team.seasons);
}

export async function POST(request: NextRequest, { params }: { params: { teamId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const team = await prisma.team.findFirst({
    where: { id: params.teamId, members: { some: { userId: user.id } } },
  });
  if (!team) {
    return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, startDate, endDate } = body;

  if (!name || !startDate || !endDate) {
    return NextResponse.json({ error: 'Name, startDate, and endDate are required' }, { status: 400 });
  }

  // Validate date format and that startDate is before endDate
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }
  if (start > end) {
    return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
  }

  const season = await prisma.season.create({
    data: {
      name,
      startDate: start,
      endDate: end,
      teamId: params.teamId,
    },
  });

  return NextResponse.json(season, { status: 201 });
}
