import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth-options';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Access denied. <Link href="/api/auth/signin" className="link blue">Sign in</Link></p>
      </div>
    );
  }

  // Fetch user's achievements with progress
  const achievementsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/me/achievements`, {
    // Ensure fresh data
    cache: 'no-store',
  });
  const userAchievements = achievementsRes.ok ? await achievementsRes.json() : [];

  // Show top 3 achievements (or all if less)
  const displayedAchievements = userAchievements.slice(0, 3);
  const totalPoints = session.user as any; // We could fetch points from user object if included

  return (
    <div className="min-h-screen bg-light-silver">
      <nav className="bg-white pa3 shadow-1 flex justify-between items-center">
        <h1 className="f4 fw6 ma0">CoachLab</h1>
        <div>
          <span className="mr3">{session.user?.name}</span>
          <form action="/api/auth/signout" method="POST">
            <button className="bg-red-100 red-70 br2 ph3 pv2 pointer">Sign out</button>
          </form>
        </div>
      </nav>

      <main className="pa4">
        <h2 className="f3 fw6 mb3">Dashboard</h2>
        <div className="mw9 center">
          <div className="grid grid-cols-1 md-grid-cols-3 gap3">
            <div className="bg-white pa3 br2 shadow-1">
              <h3 className="f5 fw6 mb2">My Teams</h3>
              <p className="mid-gray">Create and manage your teams.</p>
              <button className="mt3 bg-dark-blue white bn br2 ph3 pv2 pointer">Create Team</button>
            </div>
            <div className="bg-white pa3 br2 shadow-1">
              <h3 className="f5 fw6 mb2">Tactics</h3>
              <p className="mid-gray">Draw formations and plays.</p>
              <Link href="/tactics/new" className="mt3 db bg-green white bn br2 ph3 pv2 pointer no-underline">New Tactic</Link>
            </div>
            <div className="bg-white pa3 br2 shadow-1">
              <h3 className="f5 fw6 mb2">Season Planner</h3>
              <p className="mid-gray">Schedule matches and plan.</p>
              <button className="mt3 bg-yellow black bn br2 ph3 pv2 pointer">Open Calendar</button>
            </div>
          </div>

          <div className="mt4 bg-white pa3 br2 shadow-1">
            <div className="flex justify-between items-center mb2">
              <h3 className="f5 fw6">Achievements</h3>
              <Link href="/achievements" className="f6 blue link no-underline">View all</Link>
            </div>
            <div className="flex flex-wrap">
              {displayedAchievements.length === 0 ? (
                <p className="mid-gray f6">Start completing actions to earn badges!</p>
              ) : (
                displayedAchievements.map((ach: any) => (
                  <div key={ach.id} className={`mr2 mb2 pa2 br2 ${ach.earned ? 'bg-light-yellow' : 'bg-light-silver'}`}>
                    <span className="mr1">{ach.icon}</span>
                    <span className="f7">{ach.name}</span>
                    {!ach.earned && (
                      <span className="ml1 silver f7">({ach.progress}/{ach.requirement?.threshold ?? 1})</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
