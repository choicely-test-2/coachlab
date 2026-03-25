'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Session {
  id: string;
  date: string;
  notes?: string | null;
  teamId: string;
  coachId: string;
  coach?: { name: string | null; email: string | null };
  createdAt: string;
  updatedAt: string;
}

export default function TeamSessionsPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch sessions on load
  useEffect(() => {
    fetchSessions();
  }, [teamId]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/sessions`);
      if (!res.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Error loading sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitSuccess(null);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formDate,
          notes: formNotes || undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create session');
      }
      const newSession = await res.json();
      setFormDate('');
      setFormNotes('');
      setSubmitSuccess('Session created successfully!');
      // Prepend new session to list
      setSessions(prev => [newSession, ...prev]);
    } catch (err: any) {
      setSubmitError(err.message || 'Error creating session');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-light-silver">
      <nav className="bg-white pa3 shadow-1 flex justify-between items-center">
        <h1 className="f4 fw6 ma0">CoachLab — Sessions</h1>
        <div>
          <a href={`/teams/${teamId}`} className="bg dark-gray white bn br2 ph3 pv2 pointer no-underline">Back to Team</a>
        </div>
      </nav>

      <main className="pa4">
        <div className="mw9 center">
          {/* Create Session Form */}
          <div className="bg-white pa4 br2 shadow-1 mb4">
            <h2 className="f5 fw6 mb3">Log New Practice Session</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb3">
                <label htmlFor="date" className="db fw6 mb1">Date</label>
                <input
                  id="date"
                  type="date"
                  required
                  className="w-100 pa2 br2 ba"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                />
              </div>
              <div className="mb3">
                <label htmlFor="notes" className="db fw6 mb1">Notes (optional)</label>
                <textarea
                  id="notes"
                  className="w-100 pa2 br2 ba"
                  rows={4}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Practice focus, highlights, areas to improve..."
                />
              </div>
              <div className="mt3">
                <button
                  type="submit"
                  className="bg-dark-blue white bn br2 ph3 pv2 pointer f6"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Session'}
                </button>
              </div>
              {submitSuccess && (
                <p className="mt2 green mb0">{submitSuccess}</p>
              )}
              {submitError && (
                <p className="mt2 red mb0">{submitError}</p>
              )}
            </form>
          </div>

          {/* Sessions List */}
          <div className="bg-white pa4 br2 shadow-1">
            <h2 className="f5 fw6 mb3">Past Sessions</h2>
            {loading ? (
              <p>Loading sessions...</p>
            ) : error ? (
              <p className="red">Error: {error}</p>
            ) : sessions.length === 0 ? (
              <p className="silver">No sessions logged yet.</p>
            ) : (
              <ul className="list ma0 pa0">
                {sessions.map(s => (
                  <li key={s.id} className="pv3 bb b--light-silver">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="fw6 dark-gray f5">{formatDate(s.date)}</p>
                        {s.notes ? (
                          <p className="mt1 mid-gray f6 lh-copy">{s.notes}</p>
                        ) : (
                          <p className="mt1 silver f6 italic">No notes</p>
                        )}
                        <p className="mt2 f7 silver">
                          Coach: {s.coach?.name || s.coach?.email || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
