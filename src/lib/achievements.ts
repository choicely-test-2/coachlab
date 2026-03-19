import { prisma } from './prisma';

export async function incrementUserActivity(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.userActivity.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      actionCount: {
        increment: 1,
      },
    },
    create: {
      userId,
      date: today,
      actionCount: 1,
    },
  });
}

export async function checkAndAwardAchievements(userId: string) {
  // Fetch all achievements and user's current achievements
  const achievements = await prisma.achievement.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
  });

  const uaMap = new Map(userAchievements.map(ua => [ua.achievementId, ua]));

  // Helper to compute progress for each type
  const computeProgress = async (req: any): Promise<number> => {
    const { type } = req;

    switch (type) {
      case 'tactics_count': {
        const count = await prisma.tactic.count({
          where: { createdBy: userId },
        });
        return count;
      }

      case 'export_count': {
        const count = await prisma.export.count({
          where: { userId },
        });
        return count;
      }

      case 'season_complete': {
        const ownedTeams = await prisma.team.findMany({
          where: { ownerId: userId },
          select: { id: true },
        });
        const teamIds = ownedTeams.map(t => t.id);
        if (teamIds.length === 0) return 0;
        const seasons = await prisma.season.findMany({
          where: {
            teamId: { in: teamIds },
            endDate: { lt: new Date() },
          },
        });
        return seasons.length;
      }

      case 'teams_count': {
        const count = await prisma.team.count({
          where: { ownerId: userId },
        });
        return count;
      }

      case 'shared_tactics_count': {
        // Placeholder: not implemented yet
        return 0;
      }

      case 'streak_days': {
        const threshold = req.threshold ?? 7;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - (threshold + 1));

        const activities = await prisma.userActivity.findMany({
          where: {
            userId,
            date: { gte: fromDate },
          },
          orderBy: { date: 'desc' },
        });

        const activityMap = new Map<string, number>();
        for (const act of activities) {
          const dateKey = act.date.toISOString().split('T')[0];
          activityMap.set(dateKey, act.actionCount);
        }

        let streak = 0;
        let current = new Date(today);
        while (true) {
          const dateKey = current.toISOString().split('T')[0];
          const count = activityMap.get(dateKey) ?? 0;
          if (count > 0) {
            streak++;
            current.setDate(current.getDate() - 1);
          } else {
            break;
          }
          if (streak >= threshold) break;
        }
        return streak;
      }

      default:
        console.warn(`Unknown achievement type: ${type}`);
        return 0;
    }
  };

  for (const achievement of achievements) {
    const existing = uaMap.get(achievement.id);
    let progress = existing?.progress ?? 0;
    let earnedAt = existing?.earnedAt ?? null;

    let req: any;
    try {
      req = JSON.parse(achievement.requirement);
    } catch (e) {
      console.warn(`Invalid requirement JSON for achievement ${achievement.id}:`, e);
      continue;
    }

    const newProgress = await computeProgress(req);
    const threshold = req.threshold ?? 1;
    const operator = req.operator ?? '>=';
    let isEarned = false;

    if (operator === '>=') isEarned = newProgress >= threshold;
    else if (operator === '==') isEarned = newProgress === threshold;
    else if (operator === '>') isEarned = newProgress > threshold;

    if (newProgress !== progress || (isEarned && !earnedAt)) {
      if (existing) {
        await prisma.userAchievement.update({
          where: { id: existing.id },
          data: {
            progress: newProgress,
            earnedAt: isEarned && !earnedAt ? new Date() : earnedAt,
          },
        });
      } else {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: newProgress,
            earnedAt: isEarned ? new Date() : null,
          },
        });
      }

      // Award points if newly earned
      if (isEarned && !earnedAt && achievement.points > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { points: { increment: achievement.points } },
        });
      }
    }
  }
}
