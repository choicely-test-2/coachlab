'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useDroppable, DndContext, DragStartEvent, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import PlayerDot from '@/components/PlayerDot';

interface Tactic {
  id: string;
  name: string;
  description?: string;
  data: FormationData; // parsed object
  visibility?: string;
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
  const [visibility, setVisibility] = useState<string>('PRIVATE');
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const initialPositions = useRef<Record<string, { x: number; y: number }>>({});

  // Configure sensors for drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement to start drag, helps differentiate click
      },
    })
  );

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
        visibility,
      };

      let res;
      if (selectedTactic) {
        // Update existing tactic
        res = await fetch(`/api/teams/${teamId}/tactics/${selectedTactic.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new tactic
        res = await fetch(`/api/teams/${teamId}/tactics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const savedTactic = await res.json();
        if (selectedTactic) {
          // Replace in list
          setTactics(prev => prev.map(t => t.id === savedTactic.id ? savedTactic : t));
          setSelectedTactic(savedTactic);
          alert('Tactic updated!');
        } else {
          setTactics(prev => [savedTactic, ...prev]);
          setFormationName('');
          setFormationData({ positions: [], formation: '' });
          setVisibility('PRIVATE');
          alert('Tactic saved!');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // DnD callbacks
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const pos = formationData?.positions.find(p => p.id === active.id);
    if (pos) {
      initialPositions.current[active.id as string] = { x: pos.x, y: pos.y };
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    if (over && over.id === 'board' && formationData) {
      const initial = initialPositions.current[active.id as string];
      if (initial) {
        const newX = initial.x + delta.x;
        const newY = initial.y + delta.y;
        setFormationData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            positions: prev.positions.map(p =>
              p.id === active.id ? { ...p, x: newX, y: newY } : p
            ),
          };
        });
      }
    }
    initialPositions.current = {};
  };

  // Board click: add player only if not dragging
  const handleFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If a drag just ended or is in progress, ignore click
    // dnd-kit prevents click after drag, but we add extra guard by checking event.detail (0 if programmatic)
    if (e.detail === 0) return;
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

  const loadTactic = (tactic: Tactic) => {
    setSelectedTactic(tactic);
    setFormationName(tactic.name);
    setFormationData(tactic.data);
    setVisibility(tactic.visibility || 'PRIVATE');
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

  const handleExportPNG = async () => {
    if (!boardRef.current) {
      alert('No tactic board to export');
      return;
    }
    setExporting('png');
    try {
      const html2canvas = (await import('html2canvas')).default;
      const board = boardRef.current;
      const canvas = await html2canvas(board, { scale: 2, backgroundColor: '#f0f0f0' });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `tactic-${formationName || 'unnamed'}.png`;
      link.href = dataUrl;
      link.click();

      // Record export and award points
      const res = await fetch(`/api/teams/${teamId}/tactics/${selectedTactic?.id || ''}/export`, {
        method: 'POST',
      });
      if (!res.ok) {
        alert('Failed to record export');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to export PNG');
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    if (!boardRef.current) {
      alert('No tactic board to export');
      return;
    }
    setExporting('pdf');
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const board = boardRef.current;
      const canvas = await html2canvas(board, { scale: 2, backgroundColor: '#f0f0f0' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`tactic-${formationName || 'unnamed'}.pdf`);

      // Record export and award points
      const res = await fetch(`/api/teams/${teamId}/tactics/${selectedTactic?.id || ''}/export`, {
        method: 'POST',
      });
      if (!res.ok) {
        alert('Failed to record export');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to export PDF');
    } finally {
      setExporting(null);
    }
  };

  // Droppable board setup
  const droppable = useDroppable({
    id: 'board',
    data: { type: 'board' },
  });

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
              <div className="mb3">
                <label className="db fw6 mb1">Visibility</label>
                <select
                  className="pa2 br2 ba w-100"
                  value={visibility}
                  onChange={e => setVisibility(e.target.value)}
                >
                  <option value="PRIVATE">Private</option>
                  <option value="TEAM">Team</option>
                  <option value="PUBLIC">Public</option>
                </select>
              </div>
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div
                  ref={node => {
                    boardRef.current = node;
                    droppable.setNodeRef(node);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Tactic board"
                  className="relative ba bg-green-muted"
                  style={{ width: '100%', height: '400px' }}
                  onClick={handleFieldClick}
                >
                  {formationData?.positions?.map((pos: Position) => (
                    <PlayerDot key={pos.id} pos={pos} />
                  ))}
                  <div className="absolute bottom-1 right-1 f7 mid-gray">Click to add player; drag to move</div>
                </div>
              </DndContext>
              <div className="mt3 flex items-center gap-2">
                <button
                  className="bg-dark-blue white bn br2 ph3 pv2 pointer"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Tactic'}
                </button>
                {selectedTactic && formationData && formationData.positions && formationData.positions.length > 0 && (
                  <>
                    <button
                      className="bg-dark-gray white bn br2 ph3 pv2 pointer"
                      onClick={handleExportPNG}
                      disabled={exporting !== null}
                    >
                      {exporting === 'png' ? 'Exporting PNG...' : 'Export PNG'}
                    </button>
                    <button
                      className="bg-dark-gray white bn br2 ph3 pv2 pointer"
                      onClick={handleExportPDF}
                      disabled={exporting !== null}
                    >
                      {exporting === 'pdf' ? 'Exporting PDF...' : 'Export PDF'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Selected tactic preview */}
          {selectedTactic && (
            <div className="mt4 bg-white pa3 br2 shadow-1">
              <div className="flex items-center mb2">
                <h2 className="f5 fw6 mr2">Preview: {selectedTactic.name}</h2>
                <span className={`pa1 br2 f7 ${selectedTactic.visibility === 'PUBLIC' ? 'bg-green' : selectedTactic.visibility === 'TEAM' ? 'bg-blue' : 'bg-gray'}`}>
                  {selectedTactic.visibility}
                </span>
              </div>
              <pre className="bg-light-silver pa2 overflow-auto">
                {JSON.stringify(selectedTactic.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}