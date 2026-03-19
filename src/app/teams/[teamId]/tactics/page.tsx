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

export default function TeamTacticsPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [tactics, setTactics] = useState<Tactic[]>([]);
  const [selectedTactic, setSelectedTactic] = useState<Tactic | null>(null);
  const [formationName, setFormationName] = useState('');
  const [formationData, setFormationData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Fetch tactics on load
  useEffect(() => {
    fetch(`/api/teams/${teamId}/tactics`)
      .then(res => res.json())
      .then(data => setTactics(Array.isArray(data) ? data : []));
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

  // Basic drag-and-drop simulation: click to add, drag to move
  const handleFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
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

  const handlePosDrag = (id: string, dx: number, dy: number) => {
    setFormationData(prev => ({
      ...prev,
      positions: prev.positions.map((p: any) =>
        p.id === id ? { ...p, x: p.x + dx, y: p.y + dy } : p
      ),
    }));
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
              <ul>
                {tactics.map(t => (
                  <li key={t.id} className="mb2">
                    <button
                      className={`blue pointer ${selectedTactic?.id === t.id ? 'b fw6' : ''}`}
                      onClick={() => setSelectedTactic(t)}
                    >
                      {t.name}
                    </button>
                  </li>
                ))}
              </ul>
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
              >
                {formationData?.positions?.map((pos: any) => (
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
                    }}
                    draggable
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const dropX = e.clientX - e.currentTarget.parentElement.getBoundingClientRect().left;
                      const dropY = e.clientY - e.currentTarget.parentElement.getBoundingClientRect().top;
                      // Not ideal; for simplicity we just update on drop for that player
                      const rect = e.currentTarget.getBoundingClientRect();
                      const offsetX = (e.nativeEvent as any).dataTransfer?.getData('offsetX');
                      // simplified: just update to drop position
                      // In production, use proper Drag & Drop APIs
                      setFormationData(prev => ({
                        ...prev,
                        positions: prev.positions.map((p: any) =>
                          p.id === pos.id ? { ...p, x: dropX, y: dropY } : p
                        ),
                      }));
                    }}
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
