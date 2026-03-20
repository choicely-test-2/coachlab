import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { tacticId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Fetch the tactic to get its teamId
  const tactic = await prisma.tactic.findUnique({
    where: { id: params.tacticId },
  });

  if (!tactic) {
    return NextResponse.json({ error: 'Tactic not found' }, { status: 404 });
  }

  // Verify that the user is a member of the tactic's team
  const team = await prisma.team.findFirst({
    where: { id: tactic.teamId, members: { some: { userId: user.id } } },
  });
  if (!team) {
    return NextResponse.json({ error: 'Not a member of the tactic\'s team' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { visibility } = body;
  if (!visibility) {
    return NextResponse.json({ error: 'Visibility is required' }, { status: 400 });
  }

  const validVisibilities = ['PRIVATE', 'TEAM', 'PUBLIC'] as const;
  if (!validVisibilities.includes(visibility)) {
    return NextResponse.json({ error: 'Invalid visibility value' }, { status: 400 });
  }

  // Update only the visibility field
  const updatedTactic = await prisma.tactic.update({
    where: { id: params.tacticId },
    data: { visibility },
  });

  // Return with parsed data for consistency (though data unchanged)
  const responseTactic = {
    ...updatedTactic,
    data: JSON.parse(updatedTactic.data as string),
  };

  return NextResponse.json(responseTactic);
}
