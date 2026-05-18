/**
 * Design tokens for card styling — Vercel/Linear/Stripe aesthetic.
 *
 * Cards have NO background color difference from the page.
 * They are defined only by a barely-visible border.
 * Data values use Inter. Body text is 13-14px.
 */

/** Card container: subtle border only, no background fill */
export const CARD_CONTAINER = 'rounded-lg border border-white/[0.04]';

/** Standard internal padding */
export const CARD_PADDING = 'p-5';

/** Gap between cards in grid layouts */
export const CARD_GAP = 'gap-5';

/** Divider between rows inside a card */
export const CARD_DIVIDER = 'divide-white/[0.04]';

/** Row padding for list items inside a card */
export const CARD_ROW_PADDING = 'px-5 py-3.5';

/** Monospace class for data values */
export const CARD_DATA_VALUE = 'font text-[13px] text-white tabular-nums';

/** Muted label styling */
export const CARD_LABEL = 'text-[15px] text-white font-semibold';

/** Card header styling */
export const CARD_HEADER = 'text-[15px] font-semibold text-white';
