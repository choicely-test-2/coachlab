import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed achievements
  const achievements = [
    {
      name: 'First Tactic',
      description: 'Create your first tactic.',
      icon: '🎯',
      requirement: JSON.stringify({ type: 'tactics_count', threshold: 1 }),
      points: 10,
    },
    {
      name: 'Tactics Master',
      description: 'Create 10 tactics.',
      icon: '📋',
      requirement: JSON.stringify({ type: 'tactics_count', threshold: 10 }),
      points: 50,
    },
    {
      name: 'First Season Completed',
      description: 'Complete your first season.',
      icon: '🏆',
      requirement: JSON.stringify({ type: 'season_complete', threshold: 1 }),
      points: 30,
    },
    {
      name: '7-Day Streak',
      description: 'Be active for 7 consecutive days.',
      icon: '🔥',
      requirement: JSON.stringify({ type: 'streak_days', threshold: 7 }),
      points: 40,
    },
    {
      name: 'First Export',
      description: 'Export your first tactic to PDF.',
      icon: '📤',
      requirement: JSON.stringify({ type: 'export_count', threshold: 1 }),
      points: 15,
    },
    // Additional achievements for variety
    {
      name: 'Team Creator',
      description: 'Create your first team.',
      icon: '👥',
      requirement: JSON.stringify({ type: 'teams_count', threshold: 1 }),
      points: 20,
    },
    {
      name: 'Share a Tactic',
      description: 'Share a tactic publicly.',
      icon: '🌐',
      requirement: JSON.stringify({ type: 'shared_tactics_count', threshold: 1 }),
      points: 15,
    },
  ];

  for (const achievement of achievements) {
    const existing = await prisma.achievement.findFirst({
      where: { name: achievement.name },
    });
    if (!existing) {
      await prisma.achievement.create({
        data: achievement,
      });
      console.log(`Created achievement: ${achievement.name}`);
    } else {
      console.log(`Achievement already exists: ${achievement.name}`);
    }
  }

  // Seed tactics with different visibilities for testing
  // Find a user to be the creator
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found, skipping tactic seeding');
    return;
  }

  // Find or create a team for this user
  let team = await prisma.team.findFirst({
    where: { ownerId: user.id },
  });

  if (!team) {
    team = await prisma.team.create({
      data: {
        name: 'Test Team',
        description: 'A team for testing',
        ownerId: user.id,
      },
    });
    console.log(`Created team: ${team.name}`);
  }

  // Ensure user is a member of the team
  await prisma.userTeam.upsert({
    where: {
      userId_teamId: {
        userId: user.id,
        teamId: team.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      teamId: team.id,
      role: 'owner',
    },
  });

  // Seed tactics with different visibilities if none exist
  const existingTacticsCount = await prisma.tactic.count({
    where: { teamId: team.id },
  });

  if (existingTacticsCount === 0) {
    const tacticData = [
      {
        name: 'Private Formation',
        description: 'A private tactic',
        data: JSON.stringify({ positions: [{ id: '1', x: 50, y: 50, label: 'P' }], formation: 'custom' }),
        visibility: 'PRIVATE' as const,
      },
      {
        name: 'Team Tactic',
        description: 'A team-visible tactic',
        data: JSON.stringify({ positions: [{ id: '2', x: 100, y: 100, label: 'P' }], formation: '4-4-2' }),
        visibility: 'TEAM' as const,
      },
      {
        name: 'Public Strategy',
        description: 'A public tactic',
        data: JSON.stringify({ positions: [{ id: '3', x: 150, y: 150, label: 'P' }], formation: '3-5-2' }),
        visibility: 'PUBLIC' as const,
      },
    ];

    for (const tactic of tacticData) {
      await prisma.tactic.create({
        data: {
          ...tactic,
          teamId: team.id,
          createdBy: user.id,
        },
      });
      console.log(`Created tactic: ${tactic.name} (${tactic.visibility})`);
    }
  } else {
    console.log(`Team already has ${existingTacticsCount} tactics, skipping seeding`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

