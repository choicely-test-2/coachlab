import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { teamId: string; tacticId: string } }) {
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

  // Ensure tactic belongs to team
  const existingTactic = await prisma.tactic.findFirst({
    where: { id: params.tacticId, teamId: params.teamId },
  });
  if (!existingTactic) {
    return NextResponse.json({ error: 'Tactic not found' }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, description, data, visibility } = body;

  // If no fields provided, return error
  if (name === undefined && description === undefined && data === undefined && visibility === undefined) {
    return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (data !== undefined) {
    updateData.data = typeof data === 'string' ? data : JSON.stringify(data);
  }
  if (visibility !== undefined) {
    const validVisibilities = ['PRIVATE', 'TEAM', 'PUBLIC'] as const;
    if (validVisibilities.includes(visibility)) {
      updateData.visibility = visibility;
    } else {
      return NextResponse.json({ error: 'Invalid visibility value' }, { status: 400 });
    }
  }

  const updatedTactic = await prisma.tactic.update({
    where: { id: params.tacticId },
    data: updateData,
  });

  // Return with parsed data
  const responseTactic = {
    ...updatedTactic,
    data: JSON.parse(updatedTactic.data as string),
  };

  return NextResponse.json(responseTactic);
}

export async function DELETE(request: NextRequest, { params }: { params: { teamId: string; tacticId: string } }) {
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

  // Ensure tactic belongs to team
  const tactic = await prisma.tactic.findFirst({
    where: { id: params.tacticId, teamId: params.teamId },
  });
  if (!tactic) {
    return NextResponse.json({ error: 'Tactic not found' }, { status: 404 });
  }

  await prisma.tactic.delete({ where: { id: params.tacticId } });

  return NextResponse.json({ success: true });
}
