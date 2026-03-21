'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewTeamPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Team name is required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      if (res.ok) {
        const team = await res.json();
        router.push(`/teams/${team.id}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to create team');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-silver flex items-center justify-center">
      <div className="bg-white pa4 br2 shadow-1 w-100 mw-500">
        <h1 className="f3 fw6 tc mb4">Create New Team</h1>
        {error && <p className="red f6 mb3">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb3">
            <label className="db fw6 mb1">Team Name</label>
            <input
              type="text"
              required
              className="w-100 pa2 br2 ba"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="mb3">
            <label className="db fw6 mb1">Description (optional)</label>
            <textarea
              className="w-100 pa2 br2 ba"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-100 bg-dark-blue white bn br2 pa3 fw6 pointer"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Team'}
          </button>
        </form>
        <p className="mt3 f6 tc">
          <a href="/dashboard" className="link blue">Cancel</a>
        </p>
      </div>
    </div>
  );
}
