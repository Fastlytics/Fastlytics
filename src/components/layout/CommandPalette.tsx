import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchEntry, filterSearchResults } from '@/lib/command-palette';

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  searchEntries: SearchEntry[];
}

/**
 * CommandPalette — global search overlay triggered by Cmd+K / Ctrl+K.
 * Renders as a centered modal with semi-transparent backdrop.
 * Supports real-time filtering, keyboard navigation, and category-grouped results.
 */
export function CommandPalette({ open, onClose, searchEntries }: CommandPaletteProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounce the query at 100ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 100);
    return () => clearTimeout(timer);
  }, [query]);

  // Filter results based on debounced query
  const results = useMemo(
    () => filterSearchResults(debouncedQuery, searchEntries),
    [debouncedQuery, searchEntries]
  );

  // Group results by category for display
  const groupedResults = useMemo(() => {
    const groups: { category: string; items: SearchEntry[] }[] = [];
    const categoryOrder: SearchEntry['category'][] = ['Pages', 'Drivers', 'Teams', 'Races'];

    for (const category of categoryOrder) {
      const items = results.filter((r) => r.category === category);
      if (items.length > 0) {
        groups.push({ category, items });
      }
    }
    return groups;
  }, [results]);

  // Auto-focus input on mount (component remounts via key when palette opens)
  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  // Clamp active index when results shrink
  const safeActiveIndex = useMemo(() => {
    if (results.length === 0) return 0;
    return Math.min(activeIndex, results.length - 1);
  }, [activeIndex, results]);

  // Navigate to a result and close
  const selectResult = useCallback(
    (entry: SearchEntry) => {
      navigate(entry.path);
      onClose();
    },
    [navigate, onClose]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (results.length > 0) {
          selectResult(results[safeActiveIndex]);
        }
        return;
      }
    },
    [results, safeActiveIndex, selectResult, onClose]
  );

  // Scroll active item into view
  useEffect(() => {
    if (!resultsRef.current) return;
    const activeEl = resultsRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Click on backdrop closes
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Build a flat index map: result index → SearchEntry id, for keyboard nav
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
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-[560px] overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e] shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-white/40"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, drivers, teams, races..."
            className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/40 outline-none"
            aria-label="Search"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline-block rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[11px] font-medium text-white/30">
            Esc
          </kbd>
        </div>

        {/* Results area */}
        <div ref={resultsRef} className="max-h-[360px] overflow-y-auto px-2 py-2">
          {debouncedQuery.trim() && results.length === 0 && (
            <div className="flex items-center justify-center py-8 text-[14px] text-white/40">
              No results found
            </div>
          )}

          {groupedResults.map((group) => (
            <div key={group.category} className="mb-1">
              {/* Category header */}
              <div className="px-3 py-1.5 text-[11px] font-semibold text-white/50">
                {group.category}
              </div>

              {/* Category items */}
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
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium transition-colors ${
                      isActive
                        ? 'bg-white/[0.06] text-white'
                        : 'text-white/80 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
