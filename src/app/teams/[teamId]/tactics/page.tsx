'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Tactic {
  id: string;
  name: string;
  description?: string;
  data: string; // JSON string
  createdAt: string;
  updatedAt: string;
}

interface Position {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface FormationData {
  positions: Position[];
  formation?: string;
}

export default function TeamTacticsPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [tactics, setTactics] = useState<Tactic[]>([]);
  const [selectedTactic, setSelectedTactic] = useState<Tactic | null>(null);
  const [formationName, setFormationName] = useState('');
  const [formationData, setFormationData] = useState<FormationData | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Fetch tactics on load
  useEffect(() => {
    setLoading(true);
    fetch(`/api/teams/${teamId}/tactics`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch tactics');
        return res.json();
      })
      .then(data => {
        setTactics(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
        setTactics([]);
      })
      .finally(() => setLoading(false));
  }, [teamId]);

  const handleSave = async () => {
    if (!formationName) return;
    setSaving(true);
    try {
      const payload = {
        name: formationName,
        description: '',
        data: formationData || { positions: [], formation: '' },
      };
      const res = await fetch(`/api/teams/${teamId}/tactics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newTactic = await res.json();
        setTactics(prev => [newTactic, ...prev]);
        setFormationName('');
        setFormationData({ positions: [], formation: '' });
        alert('Tactic saved!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Basic drag-and-drop: click to add player, drag to move
  const handleFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingId) return;
    if (!formationData) setFormationData({ positions: [], formation: 'custom' });
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newPos = { id: Date.now().toString(), x, y, label: 'P' };
    setFormationData(prev => ({
      ...prev,
      positions: [...(prev?.positions || []), newPos],
    }));
  };

  const handlePlayerMouseDown = (e: React.MouseEvent, pos: any) => {
    e.stopPropagation();
    const playerRect = (e.target as HTMLElement).getBoundingClientRect();
    setDraggingId(pos.id);
    setDragOffset({
      x: e.clientX - playerRect.left,
      y: e.clientY - playerRect.top,
    });
  };

  const handleFieldMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !formationData) return;
    const fieldRect = e.currentTarget.getBoundingClientRect();
    const newX = e.clientX - fieldRect.left - dragOffset.x;
    const newY = e.clientY - fieldRect.top - dragOffset.y;
    setFormationData(prev => ({
      ...prev,
      positions: prev.positions.map((p: Position) =>
        p.id === draggingId ? { ...p, x: newX, y: newY } : p
      ),
    }));
  };

  const handleFieldMouseUp = () => {
    setDraggingId(null);
  };

  const loadTactic = (tactic: Tactic) => {
    setSelectedTactic(tactic);
    setFormationName(tactic.name);
    try {
      const parsed = JSON.parse(tactic.data);
      setFormationData(parsed);
    } catch {
      setFormationData({ positions: [], formation: '' });
    }
  };

  const handleDelete = async (tacticId: string) => {
    if (!window.confirm('Delete this tactic?')) return;
    try {
      const res = await fetch(`/api/teams/${teamId}/tactics/${tacticId}`, { method: 'DELETE' });
      if (res.ok) {
        setTactics(prev => prev.filter(t => t.id !== tacticId));
        if (selectedTactic?.id === tacticId) {
          setSelectedTactic(null);
          setFormationName('');
          setFormationData({ positions: [], formation: '' });
        }
      } else {
        alert('Failed to delete tactic');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting tactic');
    }
  };

  return (
    <div className="min-h-screen bg-light-silver">
      <nav className="bg-white pa3 shadow-1 flex justify-between items-center">
        <h1 className="f4 fw6 ma0">CoachLab — Tactics</h1>
        <div>
          <a href={`/teams/${teamId}`} className="bg dark-gray white bn br2 ph3 pv2 pointer no-underline">Back to Team</a>
        </div>
      </nav>

      <main className="pa4">
        <div className="mw9 center">
          <div className="grid grid-cols-1 md-grid-cols-3 gap3">
            {/* Tactics list */}
            <div className="bg-white pa3 br2 shadow-1">
              <h2 className="f5 fw6 mb2">Saved Tactics</h2>
              {loading ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="red">Error: {error}</p>
              ) : (
                <ul className="list ma0 pa0">
                  {tactics.map(t => (
                    <li key={t.id} className="mb2 flex items-center gap-2">
                      <button
                        className={`blue pointer ${selectedTactic?.id === t.id ? 'b fw6' : ''}`}
                        onClick={() => loadTactic(t)}
                      >
                        {t.name}
                      </button>
                      <button
                        className="red-70 pointer f7"
                        onClick={() => handleDelete(t.id)}
                        title="Delete tactic"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Editor */}
            <div className="bg-white pa3 br2 shadow-1 md-col-span-2">
              <h2 className="f5 fw6 mb2">Tactic Board</h2>
              <div className="mb3">
                <label className="db fw6 mb1">Formation Name</label>
                <input
                  type="text"
                  placeholder="e.g. 4-4-2 Pressing"
                  className="w-100 pa2 br2 ba"
                  value={formationName}
                  onChange={e => setFormationName(e.target.value)}
                />
              </div>
              <div
                className="relative ba bg-green-muted"
                style={{ width: '100%', height: '400px' }}
                onClick={handleFieldClick}
                onMouseMove={handleFieldMouseMove}
                onMouseUp={handleFieldMouseUp}
                onMouseLeave={handleFieldMouseUp}
              >
                {formationData?.positions?.map((pos: Position) => (
                  <div
                    key={pos.id}
                    className="absolute circle ba b--dark-blue bg-white blue f5 fw6"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      left: pos.x - 16,
                      top: pos.y - 16,
                      cursor: 'move',
                      zIndex: draggingId === pos.id ? 10 : 1,
                    }}
                    onMouseDown={(e) => handlePlayerMouseDown(e, pos)}
                  >
                    {pos.label}
                  </div>
                ))}
                <div className="absolute bottom-1 right-1 f7 mid-gray">Click to add player; drag to move</div>
              </div>
              <button
                className="mt3 bg-dark-blue white bn br2 ph3 pv2 pointer"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Tactic'}
              </button>
            </div>
          </div>

          {/* Selected tactic preview */}
          {selectedTactic && (
            <div className="mt4 bg-white pa3 br2 shadow-1">
              <h2 className="f5 fw6 mb2">Preview: {selectedTactic.name}</h2>
              <pre className="bg-light-silver pa2 overflow-auto">
                {JSON.stringify(JSON.parse(selectedTactic.data), null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
