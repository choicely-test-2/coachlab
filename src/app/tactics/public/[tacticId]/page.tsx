'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface TacticData {
  positions: { id: string; x: number; y: number; label: string }[];
  formation?: string;
}

interface PublicTacticDetail {
  id: string;
  name: string;
  description?: string | null;
  visibility: string;
  data: TacticData;
  team: { name: string; id: string };
  createdAt: string;
  updatedAt: string;
}

export default function PublicTacticDetailPage() {
  const params = useParams();
  const tacticId = params.tacticId as string;

  const [tactic, setTactic] = useState<PublicTacticDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tactics/public/${tacticId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch tactic');
        return res.json();
      })
      .then(data => setTactic(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [tacticId]);

  if (loading) return <div className="min-h-screen bg-light-silver flex items-center justify-center"><p>Loading...</p></div>;
  if (error) return <div className="min-h-screen bg-light-silver flex items-center justify-center"><p className="red">Error: {error}</p></div>;
  if (!tactic) return <div className="min-h-screen bg-light-silver flex items-center justify-center"><p>Tactic not found.</p></div>;

  return (
    <div className="min-h-screen bg-light-silver">
      <nav className="bg-white pa3 shadow-1 flex justify-between items-center">
        <h1 className="f4 fw6 ma0">CoachLab — Tactic Detail</h1>
        <div>
          <a href="/tactics/public" className="bg dark-gray white bn br2 ph3 pv2 pointer no-underline">Back to Public Tactics</a>
        </div>
      </nav>

      <main className="pa4">
        <div className="mw9 center">
          <div className="bg-white pa3 br2 shadow-1">
            <div className="flex items-center mb3">
              <h2 className="f3 fw6 mr2">{tactic.name}</h2>
              <span className={`pa1 br2 f7 ${tactic.visibility === 'PUBLIC' ? 'bg-green' : tactic.visibility === 'TEAM' ? 'bg-blue' : 'bg-gray'}`}>
                {tactic.visibility}
              </span>
            </div>
            <p className="f6 mid-gray mb3">by {tactic.team.name}</p>
            {tactic.description && <p className="mb3">{tactic.description}</p>}

            <h3 className="f5 fw6 mb2">Formation Data</h3>
            <pre className="bg-light-silver pa2 overflow-auto mb3">
              {JSON.stringify(tactic.data, null, 2)}
            </pre>

            <div className="mt3">
              <p className="f7 mid-gray">This is a read-only view.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
