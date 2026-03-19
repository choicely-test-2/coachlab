import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string; seasonId: string; matchId: string } }
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

  const match = await prisma.match.findFirst({
    where: { id: params.matchId, seasonId: params.seasonId },
  });

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  return NextResponse.json(match);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { teamId: string; seasonId: string; matchId: string } }
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

  const match = await prisma.match.findFirst({
    where: { id: params.matchId, seasonId: params.seasonId },
  });
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { date, opponent, location, notes } = body;

  if (!date || !opponent || !location) {
    return NextResponse.json({ error: 'Date, opponent, and location are required' }, { status: 400 });
  }

  const matchDate = new Date(date);
  if (isNaN(matchDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }

  if (!['home', 'away', 'neutral'].includes(location)) {
    return NextResponse.json({ error: 'Location must be home, away, or neutral' }, { status: 400 });
  }

  const updated = await prisma.match.update({
    where: { id: params.matchId },
    data: {
      date: matchDate,
      opponent,
      location,
      notes,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string; seasonId: string; matchId: string } }
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

  const match = await prisma.match.findFirst({
    where: { id: params.matchId, seasonId: params.seasonId },
  });
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  await prisma.match.delete({ where: { id: params.matchId } });

  return NextResponse.json({ success: true });
}
