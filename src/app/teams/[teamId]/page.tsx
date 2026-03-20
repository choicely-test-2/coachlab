import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth-options';
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: { teamId: string };
}

export default async function TeamDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Access denied. <Link href="/api/auth/signin" className="link blue">Sign in</Link></p>
      </div>
    );
  }

  const teamId = params.teamId;

  // Fetch team with owner and members (including their user profiles)
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      owner: { select: { name: true, email: true } },
      members: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!team) {
    notFound();
  }

  // Check membership: user is owner or a member
  const isMember = team.members.some(m => m.userId === session.user.id);
  if (!isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>You are not a member of this team. <Link href="/dashboard" className="link blue">Return to dashboard</Link></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-silver">
      <nav className="bg-white pa3 shadow-1 flex justify-between items-center">
        <h1 className="f4 fw6 ma0">CoachLab</h1>
        <div>
          <span className="mr3">{session.user.name}</span>
          <form action="/api/auth/signout" method="POST">
            <button className="bg-red-100 red-70 br2 ph3 pv2 pointer">Sign out</button>
          </form>
        </div>
      </nav>

      <main className="pa4">
        <div className="mw9 center">
          <div className="mb3">
            <Link href="/dashboard" className="link dark-blue f6">← Back to Dashboard</Link>
          </div>

          <div className="bg-white pa4 br2 shadow-1">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="f2 fw6 mb2">{team.name}</h2>
                {team.description && <p className="mid-gray f5 mb3">{team.description}</p>}
                <p className="silver f7">Owner: {team.owner.name || team.owner.email}</p>
              </div>
              <div>
                <Link href={`/teams/${team.id}/invite`} className="bg-dark-blue white bn br2 ph3 pv2 pointer f6 no-underline">
                  Invite Member
                </Link>
              </div>
            </div>
          </div>

          <div className="mt4 bg-white pa3 br2 shadow-1">
            <h3 className="f5 fw6 mb2">Members ({team.members.length})</h3>
            <ul className="list pl0">
              {team.members.map(m => (
                <li key={m.userId} className="pv2 bb b--light-silver">
                  <span className="fw6">{m.user.name || m.user.email}</span>
                  {m.role !== 'owner' && <span className="silver ml2">{m.role}</span>}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt4 bg-white pa3 br2 shadow-1">
            <h3 className="f5 fw6 mb2">Quick Actions</h3>
            <div className="flex flex-wrap gap2">
              <button className="bg-green white bn br2 ph3 pv2 pointer">New Tactic</button>
              <button className="bg-yellow black bn br2 ph3 pv2 pointer">Plan Season</button>
              <button className="bg-purple white bn br2 ph3 pv2 pointer">View Stats</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
