'use client';

import { useDraggable } from '@dnd-kit/core';

interface PlayerDotProps {
  pos: { id: string; x: number; y: number; label: string };
}

export default function PlayerDot({ pos }: PlayerDotProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: pos.id,
    data: { type: 'player', pos },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="absolute circle ba b--dark-blue bg-white blue f5 fw6"
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        left: pos.x - 16,
        top: pos.y - 16,
        cursor: 'move',
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.8 : 1,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        touchAction: 'none',
      }}
    >
      {pos.label}
    </div>
  );
}
