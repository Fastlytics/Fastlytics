import { useMemo } from 'react';
import { m, AnimatePresence } from 'motion/react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
}

const COLORS = [
  '#dc2626',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ffffff',
];

function generatePieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    drift: (Math.random() - 0.5) * 60,
  }));
}

// Pre-generate pieces so we don't need state at all
const PIECES = generatePieces(60);

export function Confetti({ active }: { active: boolean }) {
  // Only render when active — pieces animate once and disappear via AnimatePresence
  const pieces = useMemo(() => (active ? PIECES : []), [active]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {pieces.map((piece) => (
          <m.div
            key={piece.id}
            initial={{
              x: `${piece.x}vw`,
              y: `${piece.y}vh`,
              rotate: 0,
              scale: piece.scale,
              opacity: 1,
            }}
            animate={{
              y: '110vh',
              x: `${piece.x + piece.drift}vw`,
              rotate: piece.rotation + 720,
              opacity: [1, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              ease: 'easeIn',
            }}
            className="absolute"
          >
            <div className="size-2.5 rounded-sm" style={{ backgroundColor: piece.color }} />
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
