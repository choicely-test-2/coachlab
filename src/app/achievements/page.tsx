import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AchievementsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect('/api/auth/signin?callbackUrl=/achievements');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userAchievements: { include: { achievement: true } },
      },
    });
    if (!user) return <div className="pa4">User not found.</div>;

    const earnedMap = new Map();
    user.userAchievements.forEach(ua => earnedMap.set(ua.achievementId, { earnedAt: ua.earnedAt, progress: ua.progress ?? 0 }));

    const allAchievements = await prisma.achievement.findMany({ orderBy: { name: 'asc' } });
    const points = user.points ?? 0;

    return (
      <div className="min-h-screen bg-light-silver">
        <nav className="bg-white pa3 shadow-1">
          <div className="flex justify-between items-center">
            <h1 className="f4 fw6 ma0">CoachLab — Achievements</h1>
            <Link href="/dashboard" className="bg dark-gray white bn br2 ph3 pv2 pointer no-underline">Dashboard</Link>
          </div>
        </nav>

        <main className="pa4">
          <div className="mw9 center">
            <h2 className="f3 fw6 mb3">Total Points: {points}</h2>

            <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap3">
              {allAchievements.map(ach => {
                const earned = earnedMap.get(ach.id);
                return (
                  <div key={ach.id} className="bg-white pa3 br2 shadow-1">
                    <div className="flex items-center mb2">
                      <span className="mr2" style={{ fontSize: '1.5rem' }}>{ach.icon || '🏆'}</span>
                      <h3 className="f5 fw6">{ach.name}</h3>
                    </div>
                    <p className="mid-gray f6 mb2">{ach.description}</p>
                    {earned ? (
                      <p className="green f7">Earned on {new Date(earned.earnedAt).toLocaleDateString()}</p>
                    ) : (
                      <p className="mid-gray f7">Progress: {earned?.progress ?? 0}/{ach.requirement?.threshold ?? 1}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('AchievementsPage error:', error);
    return <div className="pa4">Error loading achievements.</div>;
  }
}