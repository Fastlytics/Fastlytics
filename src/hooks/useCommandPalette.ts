import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSeason } from '@/contexts/SeasonContext';
import { buildSearchIndex, SearchEntry } from '@/lib/command-palette';
import type { DriverStanding, TeamStanding, ScheduleEvent } from '@/lib/api';

/**
 * useCommandPalette — manages the command palette open/close state,
 * registers the global Cmd+K / Ctrl+K keyboard shortcut, and builds
 * the search index from TanStack Query cache data.
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { selectedYear } = useSeason();

  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  // Register global Cmd+K / Ctrl+K keyboard listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Check for Cmd+K (macOS) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        // Suppress when focused in text inputs/textareas/contenteditable
        // (but NOT the command palette's own input)
        const target = e.target as HTMLElement;
        if (target) {
          const tagName = target.tagName.toLowerCase();
          const isContentEditable = target.isContentEditable;
          const isTextInput =
            tagName === 'textarea' ||
            (tagName === 'input' && isTextInputType(target as HTMLInputElement));

          // If the user is in a text input that's NOT the command palette input, suppress
          if (
            (isTextInput || isContentEditable) &&
            !target.closest('[role="dialog"][aria-label="Command palette"]')
          ) {
            return;
          }
        }

        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Build search entries from TanStack Query cache
  const searchEntries: SearchEntry[] = useMemo(() => {
    const drivers =
      queryClient.getQueryData<DriverStanding[]>(['driverStandings', selectedYear]) ?? [];
    const teams = queryClient.getQueryData<TeamStanding[]>(['teamStandings', selectedYear]) ?? [];
    const schedule = queryClient.getQueryData<ScheduleEvent[]>(['schedule', selectedYear]) ?? [];

    return buildSearchIndex(drivers, teams, schedule, selectedYear);
  }, [queryClient, selectedYear]);

  return { open, setOpen, onClose, searchEntries };
}

/**
 * Checks if an input element is a text-type input (where typing is expected).
 */
function isTextInputType(input: HTMLInputElement): boolean {
  const textTypes = ['text', 'search', 'url', 'tel', 'email', 'password', 'number'];
  return textTypes.includes(input.type?.toLowerCase() ?? 'text');
}
