'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  teamId: string;
  createdAt: string;
}

interface Match {
  id: string;
  date: string;
  opponent: string;
  location: 'home' | 'away' | 'neutral';
  seasonId: string;
  notes?: string;
}

export default function SeasonPlannerPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [seasonName, setSeasonName] = useState('');
  const [seasonStartDate, setSeasonStartDate] = useState('');
  const [seasonEndDate, setSeasonEndDate] = useState('');

  const [showMatchForm, setShowMatchForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [matchDate, setMatchDate] = useState('');
  const [matchOpponent, setMatchOpponent] = useState('');
  const [matchLocation, setMatchLocation] = useState<'home' | 'away' | 'neutral'>('home');
  const [matchNotes, setMatchNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'season' | 'match'; id: string } | null>(null);

  // Fetch seasons on load
  useEffect(() => {
    fetchSeasons();
  }, [teamId]);

  // Fetch matches when season is selected
  useEffect(() => {
    if (selectedSeason) {
      fetchMatches();
    } else {
      setMatches([]);
    }
  }, [selectedSeason]);

  const fetchSeasons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/seasons`);
      if (!res.ok) throw new Error('Failed to fetch seasons');
      const data = await res.json();
      setSeasons(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setSeasons([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    if (!selectedSeason) return;
    try {
      const res = await fetch(`/api/teams/${teamId}/seasons/${selectedSeason.id}/matches`);
      if (!res.ok) throw new Error('Failed to fetch matches');
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
      setMatches([]);
    }
  };

  const handleSeasonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: seasonName,
        startDate: seasonStartDate,
        endDate: seasonEndDate,
      };
      const url = editingSeason
        ? `/api/teams/${teamId}/seasons/${editingSeason.id}`
        : `/api/teams/${teamId}/seasons`;
      const method = editingSeason ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save season');
      }

      const savedSeason = await res.json();
      if (editingSeason) {
        setSeasons(prev => prev.map(s => s.id === savedSeason.id ? savedSeason : s));
        if (selectedSeason?.id === savedSeason.id) {
          setSelectedSeason(savedSeason);
        }
      } else {
        setSeasons(prev => [savedSeason, ...prev]);
        setSelectedSeason(savedSeason);
      }

      resetSeasonForm();
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        date: matchDate,
        opponent: matchOpponent,
        location: matchLocation,
        notes: matchNotes,
      };
      const url = editingMatch
        ? `/api/teams/${teamId}/seasons/${selectedSeason?.id}/matches/${editingMatch.id}`
        : `/api/teams/${teamId}/seasons/${selectedSeason?.id}/matches`;
      const method = editingMatch ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save match');
      }

      const savedMatch = await res.json();
      if (editingMatch) {
        setMatches(prev => prev.map(m => m.id === savedMatch.id ? savedMatch : m));
      } else {
        setMatches(prev => [...prev, savedMatch].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      }

      resetMatchForm();
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSeason = async (seasonId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/seasons/${seasonId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete season');
      }
      setSeasons(prev => prev.filter(s => s.id !== seasonId));
      if (selectedSeason?.id === seasonId) {
        setSelectedSeason(null);
        setMatches([]);
      }
      setDeleteConfirm(null);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/seasons/${selectedSeason?.id}/matches/${matchId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete match');
      }
      setMatches(prev => prev.filter(m => m.id !== matchId));
      setDeleteConfirm(null);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetSeasonForm = () => {
    setShowSeasonForm(false);
    setEditingSeason(null);
    setSeasonName('');
    setSeasonStartDate('');
    setSeasonEndDate('');
  };

  const resetMatchForm = () => {
    setShowMatchForm(false);
    setEditingMatch(null);
    setMatchDate('');
    setMatchOpponent('');
    setMatchLocation('home');
    setMatchNotes('');
  };

  const startEditSeason = (season: Season) => {
    setEditingSeason(season);
    setSeasonName(season.name);
    setSeasonStartDate(season.startDate.slice(0, 10)); // YYYY-MM-DD
    setSeasonEndDate(season.endDate.slice(0, 10));
    setShowSeasonForm(true);
  };

  const startEditMatch = (match: Match) => {
    setEditingMatch(match);
    setMatchDate(match.date.slice(0, 10));
    setMatchOpponent(match.opponent);
    setMatchLocation(match.location);
    setMatchNotes(match.notes || '');
    setShowMatchForm(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const locationColors: Record<string, string> = {
    home: 'bg-green-muted green',
    away: 'bg-red-muted red',
    neutral: 'bg-yellow-muted yellow',
  };

  const locationLabels: Record<string, string> = {
    home: 'Home',
    away: 'Away',
    neutral: 'Neutral',
  };

  return (
    <div className="min-h-screen bg-light-silver">
      <nav className="bg-white pa3 shadow-1 flex justify-between items-center">
        <h1 className="f4 fw6 ma0">CoachLab — Season Planner</h1>
        <div>
          <a href={`/teams/${teamId}`} className="bg dark-gray white bn br2 ph3 pv2 pointer no-underline">Back to Team</a>
        </div>
      </nav>

      <main className="pa4">
        <div className="mw9 center">
          {error && (
            <div className="bg-red-100 red pa3 br2 mb3">
              {error}
              <button className="fr bg-transparent red bn pointer" onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {/* Season Selection & Management */}
          <div className="bg-white pa3 br2 shadow-1 mb3">
            <div className="flex justify-between items-center mb2">
              <h2 className="f5 fw6 ma0">Seasons</h2>
              <button
                className="bg-dark-blue white bn br2 ph3 pv2 pointer f7"
                onClick={() => setShowSeasonForm(!showSeasonForm)}
              >
                {showSeasonForm ? 'Cancel' : '+ New Season'}
              </button>
            </div>

            {showSeasonForm && (
              <form className="mb3" onSubmit={handleSeasonSubmit}>
                <div className="grid grid-cols-1 md-grid-cols-3 gap2 mb2">
                  <div>
                    <label className="db fw6 mb1 f7">Season Name</label>
                    <input
                      type="text"
                      placeholder="e.g. 2025 Spring"
                      className="w-100 pa2 br2 ba"
                      value={seasonName}
                      onChange={e => setSeasonName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="db fw6 mb1 f7">Start Date</label>
                    <input
                      type="date"
                      className="w-100 pa2 br2 ba"
                      value={seasonStartDate}
                      onChange={e => setSeasonStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="db fw6 mb1 f7">End Date</label>
                    <input
                      type="date"
                      className="w-100 pa2 br2 ba"
                      value={seasonEndDate}
                      onChange={e => setSeasonEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="tr">
                  <button
                    type="submit"
                    className="bg-green white bn br2 ph3 pv2 pointer"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editingSeason ? 'Update Season' : 'Create Season'}
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-auto">
              <table className="w-100 collapse">
                <thead>
                  <tr className="bg-light-silver">
                    <th className="pa2 tl f6 fw6">Name</th>
                    <th className="pa2 tl f6 fw6">Start</th>
                    <th className="pa2 tl f6 fw6">End</th>
                    <th className="pa2 tr f6 fw6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="pa2">Loading...</td>
                    </tr>
                  ) : seasons.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="pa2 mid-gray">No seasons yet. Create one to get started.</td>
                    </tr>
                  ) : (
                    seasons.map(season => (
                      <tr
                        key={season.id}
                        className={`${selectedSeason?.id === season.id ? 'bg-light-blue' : 'hover-bg-light-silver'}`}
                      >
                        <td className="pa2">
                          <button
                            className={`pointer ${selectedSeason?.id === season.id ? 'b fw6 blue' : 'blue'}`}
                            onClick={() => setSelectedSeason(season)}
                          >
                            {season.name}
                          </button>
                        </td>
                        <td className="pa2">{formatDate(season.startDate)}</td>
                        <td className="pa2">{formatDate(season.endDate)}</td>
                        <td className="pa2 tr">
                          <button
                            className="bg-transparent blue bn pointer mr2 f7"
                            onClick={() => startEditSeason(season)}
                            title="Edit season"
                          >
                            Edit
                          </button>
                          {deleteConfirm?.id === season.id && deleteConfirm?.type === 'season' ? (
                            <span className="mr2">
                              <button className="bg-red-100 red bn br2 ph2 pv1 pointer f7" onClick={() => handleDeleteSeason(season.id)}>Confirm</button>
                              <button className="ml2 mid-gray bn bg-transparent pointer f7" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            </span>
                          ) : (
                            <button
                              className="bg-transparent red-70 bn pointer f7"
                              onClick={() => setDeleteConfirm({ type: 'season', id: season.id })}
                              title="Delete season"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Match List & Management */}
          {selectedSeason && (
            <div className="bg-white pa3 br2 shadow-1">
              <div className="flex justify-between items-center mb2">
                <h2 className="f5 fw6 ma0">
                  Matches — {selectedSeason.name}
                </h2>
                <button
                  className="bg-dark-blue white bn br2 ph3 pv2 pointer f7"
                  onClick={() => setShowMatchForm(!showMatchForm)}
                >
                  {showMatchForm ? 'Cancel' : '+ Add Match'}
                </button>
              </div>

              {showMatchForm && (
                <form className="mb3 pa3 br2 bg-light-silver" onSubmit={handleMatchSubmit}>
                  <h3 className="f6 fw6 mb2">{editingMatch ? 'Edit Match' : 'New Match'}</h3>
                  <div className="grid grid-cols-1 md-grid-cols-4 gap2 mb2">
                    <div>
                      <label className="db fw6 mb1 f7">Date</label>
                      <input
                        type="date"
                        className="w-100 pa2 br2 ba"
                        value={matchDate}
                        onChange={e => setMatchDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="db fw6 mb1 f7">Opponent</label>
                      <input
                        type="text"
                        placeholder="Opponent name"
                        className="w-100 pa2 br2 ba"
                        value={matchOpponent}
                        onChange={e => setMatchOpponent(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="db fw6 mb1 f7">Location</label>
                      <select
                        className="w-100 pa2 br2 ba"
                        value={matchLocation}
                        onChange={e => setMatchLocation(e.target.value as 'home' | 'away' | 'neutral')}
                      >
                        <option value="home">Home</option>
                        <option value="away">Away</option>
                        <option value="neutral">Neutral</option>
                      </select>
                    </div>
                    <div>
                      <label className="db fw6 mb1 f7">Notes (optional)</label>
                      <input
                        type="text"
                        placeholder="Any notes"
                        className="w-100 pa2 br2 ba"
                        value={matchNotes}
                        onChange={e => setMatchNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="tr">
                    <button
                      type="submit"
                      className="bg-green white bn br2 ph3 pv2 pointer"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : editingMatch ? 'Update Match' : 'Add Match'}
                    </button>
                  </div>
                </form>
              )}

              {matches.length === 0 ? (
                <p className="mid-gray tc">No matches scheduled yet. Add a match to get started.</p>
              ) : (
                <div className="overflow-auto">
                  <table className="w-100 collapse">
                    <thead>
                      <tr className="bg-light-silver">
                        <th className="pa2 tl f6 fw6">Date</th>
                        <th className="pa2 tl f6 fw6">Opponent</th>
                        <th className="pa2 tl f6 fw6">Location</th>
                        <th className="pa2 tl f6 fw6">Notes</th>
                        <th className="pa2 tr f6 fw6">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map(match => (
                        <tr key={match.id} className="hover-bg-light-silver">
                          <td className="pa2">{formatDate(match.date)}</td>
                          <td className="pa2">{match.opponent}</td>
                          <td className="pa2">
                            <span className={`${locationColors[match.location]} ph2 pv1 br2 f7 fw6`}>
                              {locationLabels[match.location]}
                            </span>
                          </td>
                          <td className="pa2 mid-gray">{match.notes || '-'}</td>
                          <td className="pa2 tr">
                            <button
                              className="bg-transparent blue bn pointer mr2 f7"
                              onClick={() => startEditMatch(match)}
                              title="Edit match"
                            >
                              Edit
                            </button>
                            {deleteConfirm?.id === match.id && deleteConfirm?.type === 'match' ? (
                              <span className="mr2">
                                <button className="bg-red-100 red bn br2 ph2 pv1 pointer f7" onClick={() => handleDeleteMatch(match.id)}>Confirm</button>
                                <button className="ml2 mid-gray bn bg-transparent pointer f7" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                              </span>
                            ) : (
                              <button
                                className="bg-transparent red-70 bn pointer f7"
                                onClick={() => setDeleteConfirm({ type: 'match', id: match.id })}
                                title="Delete match"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
