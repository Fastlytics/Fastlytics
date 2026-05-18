/**
 * Direct re-export of Recharts Cell component (not lazy-wrapped).
 *
 * Recharts requires Cell to be a direct child of Bar/Scatter/Pie —
 * wrapping it in React.Suspense (as recharts-lazy does) breaks the
 * parent-child relationship Recharts uses to read per-item fill colors.
 *
 * This module is kept separate from recharts-lazy.tsx to avoid creating
 * a static import of recharts in the lazy-loading module.
 */
export { Cell } from 'recharts';
