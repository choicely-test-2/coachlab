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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
