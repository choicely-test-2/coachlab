import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { name, description } = body;
    if (!name) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Create team with ownerId
    const team = await prisma.team.create({
      data: {
        name,
        description: description || '',
        ownerId: user.id,
      },
    });

    // Add owner as a member via UserTeam (role: 'owner')
    await prisma.userTeam.create({
      data: {
        userId: user.id,
        teamId: team.id,
        role: 'owner',
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Return teams where user is a member (including owned)
  const userTeams = await prisma.userTeam.findMany({
    where: { userId: user.id },
    include: { team: true },
  });

  const teams = userTeams.map(ut => ut.team);
  return NextResponse.json(teams);
}
