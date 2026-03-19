import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const userId = session.user.id;

    // Get all achievements with user's progress
    const achievements = await prisma.achievement.findMany({
      include: {
        userAchievements: {
          where: { userId },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Transform to include progress and earned status
    const achievementsWithProgress = achievements.map(achievement => {
      const userAchievement = achievement.userAchievements[0];
      const earned = !!userAchievement?.earnedAt;
      const progress = userAchievement?.progress ?? 0;

      // Calculate requirement
      let requirement = null;
      try {
        requirement = JSON.parse(achievement.requirement);
      } catch (e) {
        requirement = {};
      }

      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        points: achievement.points,
        requirement,
        earned,
        earnedAt: userAchievement?.earnedAt || null,
        progress,
      };
    });

    return NextResponse.json(achievementsWithProgress);
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}
