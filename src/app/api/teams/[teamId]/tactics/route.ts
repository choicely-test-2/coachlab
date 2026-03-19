import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
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
    include: { tactics: { orderBy: { createdAt: 'desc' } } },
  });

  if (!team) {
    return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
  }

  return NextResponse.json(team.tactics);
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

  const { name, description, data } = body;

  if (!name || !data) {
    return NextResponse.json({ error: 'Name and data are required' }, { status: 400 });
  }

  const tactic = await prisma.tactic.create({
    data: {
      name,
      description,
      data: JSON.stringify(data),
      teamId: params.teamId,
      createdBy: user.id,
    },
  });

  return NextResponse.json(tactic, { status: 201 });
}
