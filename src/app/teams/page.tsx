import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function TeamsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Access denied. <Link href="/api/auth/signin" className="link blue">Sign in</Link></p>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      userTeams: {
        include: { team: true },
      },
    },
  });

  if (!user) {
    return <div className="pa4">User not found</div>;
  }

  const teams = user.userTeams.map(ut => ut.team);

  return (
    <div className="min-h-screen bg-light-silver">
      <nav className="bg-white pa3 shadow-1 flex justify-between items-center">
        <h1 className="f4 fw6 ma0">CoachLab</h1>
        <div>
          <span className="mr3">{session.user.name || session.user.email}</span>
          <form action="/api/auth/signout" method="POST">
            <button className="bg-red-100 red-70 br2 ph3 pv2 pointer">Sign out</button>
          </form>
        </div>
      </nav>

      <main className="pa4">
        <div className="mw9 center">
          <div className="mb4 flex justify-between items-center">
            <h2 className="f3 fw6">My Teams</h2>
            <Link href="/teams/new" className="bg-dark-blue white bn br2 ph3 pv2 pointer no-underline">
              Create Team
            </Link>
          </div>

          {teams.length === 0 ? (
            <div className="bg-white pa4 br2 shadow-1">
              <p className="mid-gray">No teams yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap3">
              {teams.map(team => (
                <div key={team.id} className="bg-white pa3 br2 shadow-1">
                  <h3 className="f5 fw6 mb2">{team.name}</h3>
                  {team.description && <p className="mid-gray f6 mb3">{team.description}</p>}
                  <div className="flex gap-2">
                    <Link href={`/teams/${team.id}`} className="bg light-gray gray-70 br2 ph3 pv2 f6 no-underline">
                      Details
                    </Link>
                    <Link href={`/teams/${team.id}/tactics`} className="bg-green white br2 ph3 pv2 f6 no-underline">
                      Tactics
                    </Link>
                    <Link href={`/teams/${team.id}/season`} className="bg-yellow black br2 ph3 pv2 f6 no-underline">
                      Season
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
