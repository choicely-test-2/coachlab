import { getSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default async function Dashboard() {
  const session = await getSession();
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Access denied. <Link href="/api/auth/signin" className="link blue">Sign in</Link></p>
      </div>
    );
  }

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
            <h3 className="f5 fw6 mb2">Achievements</h3>
            <div className="flex flex-wrap">
              <span className="bg-light-silver silver br2 ph2 pv1 mr2 mb2">First Login</span>
              <span className="bg-light-silver silver br2 ph2 pv1 mr2 mb2">First Tactic</span>
              <span className="bg-light-silver silver br2 ph2 pv1 mr2 mb2">Team Creator</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
