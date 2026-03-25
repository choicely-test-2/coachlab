import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { incrementUserActivity } from '@/lib/achievements';

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string; tacticId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Verify team membership or that user created the tactic
  const tactic = await prisma.tactic.findFirst({
    where: { id: params.tacticId, teamId: params.teamId },
    include: { team: true },
  });
  if (!tactic) {
    return NextResponse.json({ error: 'Tactic not found or access denied' }, { status: 404 });
  }

  // Check access: user must be team member or tactic creator
  const isTeamMember = tactic.team.members.some((m: any) => m.userId === user.id);
  const isCreator = tactic.createdBy === user.id;
  if (!isTeamMember && !isCreator) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Create export record
  await prisma.export.create({
    data: {
      userId: user.id,
      tacticId: params.tacticId,
    },
  });

  // Award 5 points for exporting a tactic
  await prisma.user.update({
    where: { id: user.id },
    data: { points: { increment: 5 } },
  });

  // Record activity for streak tracking
  await incrementUserActivity(user.id).catch(err => console.error('Failed to increment activity:', err));

  return NextResponse.json({ success: true });
}
