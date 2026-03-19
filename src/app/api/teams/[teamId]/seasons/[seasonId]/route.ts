import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string; seasonId: string } }
) {
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

  const season = await prisma.season.findFirst({
    where: { id: params.seasonId, teamId: params.teamId },
    include: { matches: { orderBy: { date: 'asc' } } },
  });

  if (!season) {
    return NextResponse.json({ error: 'Season not found' }, { status: 404 });
  }

  return NextResponse.json(season);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { teamId: string; seasonId: string } }
) {
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

  const season = await prisma.season.findFirst({
    where: { id: params.seasonId, teamId: params.teamId },
  });
  if (!season) {
    return NextResponse.json({ error: 'Season not found' }, { status: 404 });
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

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }
  if (start > end) {
    return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
  }

  const updated = await prisma.season.update({
    where: { id: params.seasonId },
    data: {
      name,
      startDate: start,
      endDate: end,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string; seasonId: string } }
) {
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

  const season = await prisma.season.findFirst({
    where: { id: params.seasonId, teamId: params.teamId },
  });
  if (!season) {
    return NextResponse.json({ error: 'Season not found' }, { status: 404 });
  }

  // Cascade delete all matches belonging to this season
  await prisma.match.deleteMany({ where: { seasonId: params.seasonId } });

  await prisma.season.delete({ where: { id: params.seasonId } });

  return NextResponse.json({ success: true });
}
