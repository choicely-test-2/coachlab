import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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
