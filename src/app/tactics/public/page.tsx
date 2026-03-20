'use client';

import { useState, useEffect } from 'react';

interface PublicTactic {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  team: {
    name: string;
    id: string;
  };
}

export default function PublicTacticsPage() {
  const [tactics, setTactics] = useState<PublicTactic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tactics/public')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch public tactics');
        return res.json();
      })
      .then(data => {
        setTactics(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-light-silver">
      <nav className="bg-white pa3 shadow-1 flex justify-between items-center">
        <h1 className="f4 fw6 ma0">CoachLab — Public Tactics</h1>
        <div>
          <a href="/dashboard" className="bg dark-gray white bn br2 ph3 pv2 pointer no-underline">Back to Dashboard</a>
        </div>
      </nav>

      <main className="pa4">
        <div className="mw9 center">
          <h2 className="f3 fw6 mb3">Explore Public Tactics</h2>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="red">Error: {error}</p>
          ) : tactics.length === 0 ? (
            <p>No public tactics available yet.</p>
          ) : (
            <div className="grid grid-cols-1 md-grid-cols-3 gap3">
              {tactics.map(tactic => (
                <div key={tactic.id} className="bg-white pa3 br2 shadow-1">
                  <h3 className="f5 fw6 mb2">{tactic.name}</h3>
                  <p className="f6 mid-gray mb2">by {tactic.team.name}</p>
                  {tactic.description && (
                    <p className="f6">{tactic.description}</p>
                  )}
                  <div className="mt3">
                    <a href={`/tactics/public/${tactic.id}`} className="bg-dark-blue white bn br2 ph3 pv2 pointer no-underline f6">
                      View Details
                    </a>
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
