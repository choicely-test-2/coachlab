import Link from 'next/link';
import { getSession } from 'next-auth/react';

export default async function Home() {
  const session = await getSession();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center pa4 bg-light-silver">
      <header className="text-center mb4">
        <h1 className="f1 fw9 mb2">CoachLab</h1>
        <p className="f5 mid-gray">Plan, share, and win.</p>
      </header>

      <main className="text-center">
        {session ? (
          <Link
            href="/dashboard"
            className="bg-dark-blue white no-underline pv3 ph4 br2 f5 fw6 dib hover-bg-navy"
          >
            Go to Dashboard
          </Link>
        ) : (
          <Link
            href="/api/auth/signin"
            className="bg-dark-blue white no-underline pv3 ph4 br2 f5 fw6 dib hover-bg-navy"
          >
            Sign In
          </Link>
        )}
      </main>
    </div>
  );
}
