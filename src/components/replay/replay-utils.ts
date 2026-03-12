/**
 * Shared utility functions for the session replay feature.
 */

/** Linearly interpolate between two values */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/** Interpolate 2D position */
export function interpolatePosition(
  prev: { x: number; y: number },
  target: { x: number; y: number },
  t: number
): { x: number; y: number } {
  return {
    x: lerp(prev.x, target.x, t),
    y: lerp(prev.y, target.y, t),
  };
}

/** Get CSS color for a track status */
export function getTrackStatusColor(status: string): string {
  switch (status) {
    case 'green': return '#00ff00';
    case 'yellow': return '#ffcc00';
    case 'sc': return '#ff9900';
    case 'vsc': return '#ff6600';
    case 'red': return '#ff0000';
    default: return '#00ff00';
  }
}

/** Get display label for track status */
export function getTrackStatusLabel(status: string): string {
  switch (status) {
    case 'green': return 'GREEN';
    case 'yellow': return 'YELLOW';
    case 'sc': return 'SAFETY CAR';
    case 'vsc': return 'VSC';
    case 'red': return 'RED FLAG';
    default: return 'GREEN';
  }
}

/** Format seconds to MM:SS or H:MM:SS */
export function formatReplayTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Get tyre compound color */
export function getTyreColor(compound: string | null): string {
  if (!compound) return '#888888';
  switch (compound.toUpperCase()) {
    case 'SOFT': return '#FF3333';
    case 'MEDIUM': return '#FFC700';
    case 'HARD': return '#EEEEEE';
    case 'INTERMEDIATE': return '#43B02A';
    case 'WET': return '#0067FF';
    default: return '#888888';
  }
}

/** Get short tyre compound name */
export function getTyreShort(compound: string | null): string {
  if (!compound) return '?';
  switch (compound.toUpperCase()) {
    case 'SOFT': return 'S';
    case 'MEDIUM': return 'M';
    case 'HARD': return 'H';
    case 'INTERMEDIATE': return 'I';
    case 'WET': return 'W';
    default: return '?';
  }
}

/** Get flag icon/color */
export function getFlagDisplay(flag: string | null): { icon: string; color: string } | null {
  if (!flag) return null;
  switch (flag) {
    case 'investigation': return { icon: '⚠', color: '#FF8C00' };
    case 'penalty': return { icon: '⛔', color: '#FF0000' };
    default: return null;
  }
}

/** Compute grid position delta */
export function getGridDelta(currentPos: number | null, gridPos: number | null): { value: number; label: string; color: string } | null {
  if (currentPos == null || gridPos == null || gridPos <= 0) return null;
  const delta = gridPos - currentPos; // positive = gained positions
  if (delta === 0) return { value: 0, label: '—', color: '#888888' };
  if (delta > 0) return { value: delta, label: `▲${delta}`, color: '#00CC66' };
  return { value: delta, label: `▼${Math.abs(delta)}`, color: '#FF4444' };
}

/** Speed playback rates available */
export const PLAYBACK_SPEEDS = [0.5, 1, 2, 4, 8, 16];

/** Skip amounts in seconds */
export const SKIP_AMOUNTS = [
  { label: '-5m', seconds: -300 },
  { label: '-1m', seconds: -60 },
  { label: '-30s', seconds: -30 },
  { label: '-5s', seconds: -5 },
  { label: '+5s', seconds: 5 },
  { label: '+30s', seconds: 30 },
  { label: '+1m', seconds: 60 },
  { label: '+5m', seconds: 300 },
];
