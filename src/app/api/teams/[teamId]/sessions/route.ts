import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { incrementUserActivity } from '@/lib/achievements';

// GET /api/teams/[teamId]/sessions
// List sessions for a team (accessible to team members only)
export async function GET(request: NextRequest, { params }: { params: { teamId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Verify team membership: user must be owner or member
  const team = await prisma.team.findFirst({
    where: { id: params.teamId, members: { some: { userId: user.id } } },
  });

  if (!team) {
    return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
  }

  // Fetch practice sessions for the team, ordered by date descending (newest first)
  const sessions = await prisma.practiceSession.findMany({
    where: { teamId: params.teamId },
    include: {
      coach: { select: { name: true, email: true } },
    },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json(sessions);
}

// POST /api/teams/[teamId]/sessions
// Create a new session (coachId = current user)
export async function POST(request: NextRequest, { params }: { params: { teamId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Verify team membership
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

  const { date, notes } = body;

  if (!date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }

  // Create the practice session, linking team and coach (current user)
  const newSession = await prisma.practiceSession.create({
    data: {
      date: new Date(date),
      notes: notes ?? null,
      teamId: params.teamId,
      coachId: user.id,
    },
    include: {
      coach: { select: { name: true, email: true } },
    },
  });

  // Award 20 points for completing a practice session
  await prisma.user.update({
    where: { id: user.id },
    data: { points: { increment: 20 } },
  });

  // Record activity for streak tracking
  await incrementUserActivity(user.id).catch(err => console.error('Failed to increment activity:', err));

  return NextResponse.json(newSession, { status: 201 });
}
