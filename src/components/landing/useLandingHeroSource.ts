import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchAvailableLandingReplays,
  fetchLandingReplayChunk,
  fetchLandingReplayMetadata,
} from '@/lib/api';
import { useChunkLoader } from '@/hooks/useChunkLoader';
import { pickDifferentLandingReplay, pickLandingReplay, pickLandingReplayKey } from './hero-utils';

const LANDING_REPLAY_SELECTION_KEY = 'landing-replay-selection-v1';

function readStoredSelectionKey() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(LANDING_REPLAY_SELECTION_KEY);
}

export function useLandingHeroSource(currentTime: number) {
  const { data: availableCaches = [] } = useQuery({
    queryKey: ['landingReplayAvailable'],
    queryFn: () => fetchAvailableLandingReplays(),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const [selectedKey, setSelectedKey] = useState<string | null>(() => readStoredSelectionKey());

  const selectedCache = useMemo(() => {
    if (availableCaches.length === 0) return null;

    const matchingEntry = selectedKey
      ? availableCaches.find((entry) => pickLandingReplayKey(entry) === selectedKey)
      : null;

    return matchingEntry || pickLandingReplay(availableCaches, selectedKey);
  }, [availableCaches, selectedKey]);

  useEffect(() => {
    const resolvedKey = selectedCache ? pickLandingReplayKey(selectedCache) : null;
    if (!resolvedKey || typeof window === 'undefined') return;
    sessionStorage.setItem(LANDING_REPLAY_SELECTION_KEY, resolvedKey);
  }, [selectedCache]);

  const { data: metadata } = useQuery({
    queryKey: [
      'landingReplayMetadata',
      selectedCache?.year,
      selectedCache?.event,
      selectedCache?.session,
    ],
    queryFn: () =>
      fetchLandingReplayMetadata(selectedCache!.year, selectedCache!.event, selectedCache!.session),
    enabled: Boolean(selectedCache),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const {
    replayData: mergedChunk,
    loadedDuration,
    isBuffering,
  } = useChunkLoader(
    metadata ?? null,
    selectedCache?.year ?? 0,
    selectedCache?.event ?? '',
    selectedCache?.session ?? '',
    currentTime,
    {
      fetchChunk: fetchLandingReplayChunk,
      keepAllChunks: true,
      maxCachedChunks: metadata?.chunk_manifest?.length ?? 20,
      bufferAheadChunks: 0,
      bufferBehindChunks: 0,
      bufferHeadroomSeconds: 0.25,
    }
  );

  const playbackStartTime =
    metadata?.chunk_manifest?.[0]?.start ?? metadata?.source_window?.start ?? 0;
  const playbackEndTime =
    metadata?.chunk_manifest?.[metadata.chunk_manifest.length - 1]?.end ??
    metadata?.source_window?.end ??
    0;

  const selectDifferentCache = useMemo(() => {
    if (availableCaches.length <= 1) return null;
    return () => {
      const next = pickDifferentLandingReplay(availableCaches, selectedKey);
      if (!next) return;
      const nextKey = pickLandingReplayKey(next);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(LANDING_REPLAY_SELECTION_KEY, nextKey);
      }
      setSelectedKey(nextKey);
    };
  }, [availableCaches, selectedKey]);

  return {
    selectedCache,
    metadata,
    chunk: mergedChunk,
    loadedDuration,
    isBuffering,
    playbackStartTime,
    playbackEndTime,
    canSelectDifferentCache: availableCaches.length > 1,
    selectDifferentCache,
  };
}
