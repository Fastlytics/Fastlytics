import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { getNationalityCountryCode } from '@/utils/countryUtils';
import {
  parseSmartQuery,
  SmartResult,
  RaceIndexEntry,
  SMART_RESULTS_INITIAL_LIMIT,
  SMART_RESULTS_PAGE_SIZE,
  getSmartResultsTotalCount,
} from '@/lib/smart-search';
import raceIndexRaw from '@/data/race-index.json';

// Static race index: [year, name][] → RaceIndexEntry[]
const RACE_INDEX: RaceIndexEntry[] = (raceIndexRaw as [number, string][]).map(([year, name]) => ({
  year,
  name,
}));

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  searchEntries?: unknown[];
}

interface SearchResult {
  id: string;
  label: string;
  category: 'Drivers' | 'Teams' | 'Articles';
  path: string;
  subtitle?: string;
  nationality?: string | null;
  imageUrl?: string | null;
  _smart?: SmartResult;
}

const CATEGORY_ICONS: Record<SearchResult['category'], JSX.Element> = {
  Drivers: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  ),
  Teams: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8Z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2Z" />
    </svg>
  ),
  Articles: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  ),
};

const SMART_ICONS: Record<SmartResult['icon'], JSX.Element> = {
  race: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" x2="4" y1="22" y2="15" />
    </svg>
  ),
  replay: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  ),
  h2h: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 3h5v5" />
      <path d="M8 3H3v5" />
      <path d="M21 3l-7 7" />
      <path d="M3 3l7 7" />
      <path d="M16 21h5v-5" />
      <path d="M8 21H3v-5" />
      <path d="M21 21l-7-7" />
      <path d="M3 21l7-7" />
    </svg>
  ),
  strategy: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  telemetry: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  laps: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  compare: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  ),
};

/**
 * CommandPalette — Raycast-style global search overlay triggered by Cmd+K / Ctrl+K.
 * Queries Supabase directly for instant results as you type.
 */
export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [smartLimit, setSmartLimit] = useState(SMART_RESULTS_INITIAL_LIMIT);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Direct Supabase search on every keystroke
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const search = async () => {
      setIsSearching(true);
      try {
        // Split query into individual words for multi-word search
        const words = trimmed.split(/\s+/).filter(Boolean);

        // Build driver query: for multi-word queries, each word must match
        // at least one name field (since names are split across forename/surname)
        let driversPromise;
        if (words.length > 1) {
          let q = supabase
            .from('f1_drivers')
            .select('id, forename, surname, abbreviation, reference, nationality');
          for (const word of words) {
            const pat = `%${word}%`;
            q = q.or(`forename.ilike.${pat},surname.ilike.${pat},reference.ilike.${pat}`);
          }
          driversPromise = q.limit(6);
        } else {
          const pat = `%${trimmed}%`;
          driversPromise = supabase
            .from('f1_drivers')
            .select('id, forename, surname, abbreviation, reference, nationality')
            .or(
              `forename.ilike.${pat},surname.ilike.${pat},reference.ilike.${pat},abbreviation.ilike.${pat}`
            )
            .limit(6);
        }

        // For teams: use per-word matching if multi-word, since .or() breaks on spaces
        let teamsPromise;
        if (words.length > 1) {
          let q = supabase.from('f1_teams').select('id, name, reference, nationality');
          for (const word of words) {
            const pat = `%${word}%`;
            q = q.or(`name.ilike.${pat},reference.ilike.${pat}`);
          }
          teamsPromise = q.limit(4);
        } else {
          const pat = `%${trimmed}%`;
          teamsPromise = supabase
            .from('f1_teams')
            .select('id, name, reference, nationality')
            .or(`name.ilike.${pat},reference.ilike.${pat}`)
            .limit(4);
        }

        // For articles: .ilike() handles spaces fine (it's a single filter, not .or())
        const articlePat = `%${trimmed}%`;

        // Fire all three queries in parallel
        const [driversRes, teamsRes, articlesRes] = await Promise.all([
          driversPromise,
          teamsPromise,
          supabase
            .from('news_articles')
            .select('id, rewritten_title, source_name, image_url')
            .ilike('rewritten_title', articlePat)
            .order('published_at', { ascending: false })
            .limit(3),
        ]);

        if (controller.signal.aborted) return;

        const unified: SearchResult[] = [];

        // Drivers
        if (driversRes.data) {
          for (const d of driversRes.data) {
            unified.push({
              id: `d-${d.id}`,
              label: `${d.forename} ${d.surname}`,
              category: 'Drivers',
              path: `/drivers/${d.reference || d.abbreviation?.toLowerCase() || d.id}`,
              subtitle: d.abbreviation || undefined,
              nationality: d.nationality,
            });
          }
        }

        // Teams
        if (teamsRes.data) {
          for (const t of teamsRes.data) {
            unified.push({
              id: `t-${t.id}`,
              label: t.name,
              category: 'Teams',
              path: `/teams/${t.reference || t.name.toLowerCase().replace(/\s+/g, '-')}`,
              nationality: t.nationality,
            });
          }
        }

        // Articles
        if (articlesRes.data) {
          for (const a of articlesRes.data) {
            unified.push({
              id: `a-${a.id}`,
              label: a.rewritten_title,
              category: 'Articles',
              path: `/news/${a.id}`,
              subtitle: a.source_name,
              imageUrl: a.image_url,
            });
          }
        }

        setResults(unified);
        setActiveIndex(0);
      } catch {
        // Silently handle aborted requests
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    };

    search();

    return () => controller.abort();
  }, [query]);

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups: { category: string; items: SearchResult[] }[] = [];

    // Smart results (natural language intent matches)
    const trimmed = query.trim();
    const smartResults =
      trimmed.length >= 3 ? parseSmartQuery(trimmed, RACE_INDEX, smartLimit) : [];
    if (smartResults.length > 0) {
      groups.push({
        category: 'Quick Actions',
        items: smartResults.map((sr) => ({
          id: sr.id,
          label: sr.label,
          category: 'Drivers' as const, // placeholder, not used for rendering smart results
          path: sr.path,
          subtitle: sr.description,
          nationality: null,
          imageUrl: null,
          _smart: sr, // attach smart result metadata
        })),
      });
    }

    // Regular DB results
    const order: SearchResult['category'][] = ['Drivers', 'Teams', 'Articles'];
    for (const cat of order) {
      const items = results.filter((r) => r.category === cat);
      if (items.length > 0) groups.push({ category: cat, items });
    }
    return groups;
  }, [results, query, smartLimit]);

  // Auto-focus input
  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  // Total flat results count (DB results + smart results)
  const allFlatResults = useMemo(() => {
    const flat: SearchResult[] = [];
    for (const group of groupedResults) {
      for (const item of group.items) {
        flat.push(item);
      }
    }
    return flat;
  }, [groupedResults]);

  const safeActiveIndex = useMemo(
    () => (allFlatResults.length === 0 ? 0 : Math.min(activeIndex, allFlatResults.length - 1)),
    [activeIndex, allFlatResults]
  );

  const selectResult = useCallback(
    (entry: SearchResult) => {
      navigate(entry.path);
      onClose();
    },
    [navigate, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < allFlatResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : allFlatResults.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allFlatResults.length > 0) selectResult(allFlatResults[safeActiveIndex]);
      }
    },
    [allFlatResults, safeActiveIndex, selectResult, onClose]
  );

  useEffect(() => {
    if (!resultsRef.current) return;
    const el = resultsRef.current.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  // Flat index map for keyboard nav
  const flatIndexMap = useMemo(() => {
    const map: Map<string, number> = new Map();
    let idx = 0;
    for (const group of groupedResults) {
      for (const item of group.items) {
        map.set(item.id, idx++);
      }
    }
    return map;
  }, [groupedResults]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          />

          {/* Panel */}
          <motion.div
            className="relative w-full max-w-[620px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1a1a1e]/95 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_60px_-10px_rgba(0,0,0,0.7),0_0_100px_-20px_rgba(220,38,38,0.06)] backdrop-blur-xl"
            onKeyDown={handleKeyDown}
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
          >
            {/* Search input area */}
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="relative flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white/30"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                {isSearching && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="size-[18px] animate-spin rounded-full border-[1.5px] border-white/10 border-t-red-500/70" />
                  </motion.div>
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  setSmartLimit(SMART_RESULTS_INITIAL_LIMIT);
                  if (val.trim().length < 2) setResults([]);
                }}
                placeholder="Search drivers, teams, articles..."
                className="flex-1 bg-transparent text-[15px] font-light tracking-[-0.01em] text-white placeholder:text-white/25 outline-none"
                aria-label="Search"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="hidden items-center gap-0.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] font-medium tracking-wide text-white/20 sm:flex">
                ESC
              </kbd>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            {/* Results */}
            <div
              ref={resultsRef}
              className="max-h-[380px] overflow-y-auto overscroll-contain px-2 py-2"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.08) transparent',
              }}
            >
              {/* Empty state */}
              {query.trim().length < 2 && results.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-10">
                  <div className="text-[13px] text-white/20">Type to search across Fastlytics</div>
                </div>
              )}

              {/* No results */}
              {query.trim().length >= 2 &&
                results.length === 0 &&
                !isSearching &&
                groupedResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-1.5 py-10">
                    <div className="text-[13px] text-white/30">No results found</div>
                    <div className="text-[11px] text-white/15">Try a different search term</div>
                  </div>
                )}

              {/* Grouped results */}
              <AnimatePresence mode="popLayout">
                {groupedResults.map((group, groupIdx) => (
                  <motion.div
                    key={group.category}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, delay: groupIdx * 0.03 }}
                    className="mb-1 last:mb-0"
                  >
                    {/* Category header */}
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span className="text-white/20">
                        {group.category === 'Quick Actions' ? (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                          </svg>
                        ) : (
                          CATEGORY_ICONS[group.category as SearchResult['category']]
                        )}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/25">
                        {group.category}
                      </span>
                    </div>

                    {/* Items */}
                    {group.items.map((item) => {
                      const itemIndex = flatIndexMap.get(item.id) ?? 0;
                      const isActive = itemIndex === safeActiveIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-active={isActive}
                          onClick={() => selectResult(item)}
                          onMouseEnter={() => setActiveIndex(itemIndex)}
                          className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-100 ${
                            isActive ? 'bg-white/[0.07]' : 'hover:bg-white/[0.03]'
                          }`}
                        >
                          {/* Active indicator bar */}
                          {isActive && (
                            <motion.div
                              layoutId="spotlight-active"
                              className="absolute inset-0 rounded-xl bg-white/[0.07] ring-1 ring-white/[0.05]"
                              transition={{ type: 'spring', duration: 0.25, bounce: 0.1 }}
                            />
                          )}

                          {/* Flag, thumbnail, or category icon */}
                          <div
                            className={`relative z-10 flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-white/[0.06] ${item._smart ? 'bg-red-500/[0.08] ring-red-500/[0.12]' : 'bg-white/[0.04]'}`}
                          >
                            {item._smart?.countryCode ? (
                              <img
                                src={`https://flagcdn.com/${item._smart.countryCode}.svg`}
                                alt=""
                                className="h-3.5 w-auto rounded-[2px]"
                              />
                            ) : item._smart ? (
                              <span className="text-red-400/80">
                                {SMART_ICONS[item._smart.icon]}
                              </span>
                            ) : item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="size-full object-cover" />
                            ) : item.nationality ? (
                              <img
                                src={`https://flagcdn.com/${getNationalityCountryCode(item.nationality)}.svg`}
                                alt=""
                                className="h-3.5 w-auto rounded-[2px]"
                              />
                            ) : (
                              <span className="text-white/30">{CATEGORY_ICONS[item.category]}</span>
                            )}
                          </div>

                          {/* Label + subtitle */}
                          <div className="relative z-10 flex min-w-0 flex-1 flex-col">
                            <span
                              className={`truncate text-[13px] font-medium tracking-[-0.01em] ${isActive ? 'text-white' : 'text-white/75'}`}
                            >
                              {item.label}
                            </span>
                            {item.subtitle && (
                              <span className="truncate text-[11px] text-white/30">
                                {item.subtitle}
                              </span>
                            )}
                          </div>

                          {/* Action hint on active */}
                          {isActive && (
                            <div className="relative z-10 flex items-center gap-1">
                              <span className="text-[10px] text-white/20">Open</span>
                              <kbd className="flex size-5 items-center justify-center rounded border border-white/[0.08] bg-white/[0.04] text-[10px] text-white/30">
                                ↵
                              </kbd>
                            </div>
                          )}
                        </button>
                      );
                    })}

                    {/* Load More button for Quick Actions */}
                    {group.category === 'Quick Actions' &&
                      (() => {
                        const totalCount = getSmartResultsTotalCount(query.trim(), RACE_INDEX);
                        const shownCount = group.items.length;
                        if (totalCount > shownCount) {
                          return (
                            <button
                              type="button"
                              onClick={() =>
                                setSmartLimit((prev) => prev + SMART_RESULTS_PAGE_SIZE)
                              }
                              className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium text-white/30 transition-colors hover:bg-white/[0.03] hover:text-white/50"
                            >
                              <span>Show more</span>
                              <span className="text-white/20">
                                ({totalCount - shownCount} remaining)
                              </span>
                            </button>
                          );
                        }
                        return null;
                      })()}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {allFlatResults.length > 0 && (
              <div className="flex items-center justify-between border-t border-white/[0.04] px-5 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <kbd className="flex size-5 items-center justify-center rounded border border-white/[0.06] bg-white/[0.03] text-[10px] text-white/25">
                      ↑
                    </kbd>
                    <kbd className="flex size-5 items-center justify-center rounded border border-white/[0.06] bg-white/[0.03] text-[10px] text-white/25">
                      ↓
                    </kbd>
                  </div>
                  <span className="text-[10px] text-white/15">Navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="flex h-5 items-center justify-center rounded border border-white/[0.06] bg-white/[0.03] px-1.5 text-[10px] text-white/25">
                    ↵
                  </kbd>
                  <span className="text-[10px] text-white/15">Open</span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
