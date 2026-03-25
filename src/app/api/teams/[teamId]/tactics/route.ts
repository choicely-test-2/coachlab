import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { incrementUserActivity } from '@/lib/achievements';

// All endpoints require authentication via NextAuth session cookie.
// CSRF protection is provided by NextAuth by default.
// Additionally, we enforce team membership for all data access.

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
    include: { tactics: { orderBy: { createdAt: 'desc' } } },
  });

  if (!team) {
    return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
  }

  // Parse the data field from JSON string to object for client convenience
  const tactics = team.tactics.map(t => ({
    ...t,
    data: JSON.parse(t.data as string),
  }));

  return NextResponse.json(tactics);
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

  const { name, description, data, visibility } = body;

  if (!name || !data) {
    return NextResponse.json({ error: 'Name and data are required' }, { status: 400 });
  }

  // Validate visibility if provided, default to PRIVATE
  const validVisibilities = ['PRIVATE', 'TEAM', 'PUBLIC'] as const;
  const vis = visibility && validVisibilities.includes(visibility) ? visibility : 'PRIVATE';

  // Convert data to JSON string for storage
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);

  const tactic = await prisma.tactic.create({
    data: {
      name,
      description,
      data: dataString,
      teamId: params.teamId,
      createdBy: user.id,
      visibility: vis,
    },
  });

  // Award 10 points for creating a tactic
  await prisma.user.update({
    where: { id: user.id },
    data: { points: { increment: 10 } },
  });

  // Record activity for streak tracking
  await incrementUserActivity(user.id).catch(err => console.error('Failed to increment activity:', err));

  // Return tactic with parsed data and visibility
  const responseTactic = {
    ...tactic,
    data: JSON.parse(tactic.data as string),
  };

  return NextResponse.json(responseTactic, { status: 201 });
}
