import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AchievementsPage() {
  const session = await getServerSession(authOptions);
  console.log('[AchievementsPage] session.user?.email:', session?.user?.email);
  console.log('[AchievementsPage] session existence:', !!session);
  if (!session || !session.user) {
    console.log('Redirecting to sign-in because no session');
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

    // Prepare achievements data for the AchievementCard component
    const achievementsData = allAchievements.map(ach => {
      const earned = earnedMap.get(ach.id);
      return {
        id: ach.id,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        points: ach.points,
        requirement: ach.requirement as any,
        earned: !!earned,
        earnedAt: earned?.earnedAt || null,
        progress: earned?.progress ?? 0,
      };
    });

    return (
      <div className="min-h-screen bg-light-silver">
        <nav className="bg-white pa3 shadow-1 flex justify-between items-center">
          <h1 className="f4 fw6 ma0">CoachLab — Achievements</h1>
          <div>
            <span className="mr3">{session.user?.name}</span>
            <Link href="/dashboard" className="bg-light-silver dark-gray br2 ph3 pv2 pointer no-underline">Back to Dashboard</Link>
          </div>
        </nav>

        <main className="pa4">
          <h2 className="f3 fw6 mb3">My Achievements</h2>
          <p className="f6 mb2">Total Points: <span className="blue fw6">{points}</span></p>
          <div className="mw9 center">
            <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap3">
              {achievementsData.map(ach => (
                <AchievementCard key={ach.id} achievement={ach} />
              ))}
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

function AchievementCard({ achievement }: { achievement: any }) {
  const { name, description, icon, points, requirement, earned, earnedAt, progress } = achievement;
  const isEarned = earned;
  const threshold = (requirement && requirement.threshold) ? requirement.threshold : 1;
  const progressPercent = Math.min((progress / threshold) * 100, 100);

  return (
    <div className={`pa3 br2 shadow-1 ${isEarned ? 'bg-light-yellow' : 'bg-white'}`}>
      <div className="flex items-center mb2">
        <span className="f1 mr3">{icon}</span>
        <div>
          <h3 className="f5 fw6 ma0">{name}</h3>
          {isEarned && (
            <span className="f7 green">Earned {new Date(earnedAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
      <p className="mid-gray mb2">{description}</p>
      <div className="flex justify-between items-center mb2">
        <span className="f6 silver">{progress} / {threshold}</span>
        <span className="f6 blue">{points} pts</span>
      </div>
      {!isEarned && (
        <div className="bg-light-silver br1 h2 relative overflow-hidden">
          <div
            className="bg-green absolute top-0 left-0 h-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
