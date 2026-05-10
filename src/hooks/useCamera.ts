// knip-ignore
import { useState, useEffect, useRef, useCallback } from 'react';
import { DriverFrameState } from '@/components/replay/replay-utils';

interface ViewState {
  scale: number;
  x: number;
  y: number;
}

export function useCamera(
  containerRef: React.RefObject<HTMLDivElement | null>,
  activeDrivers: Record<string, DriverFrameState>,
  selectedDriver: string | null,
  leaderboardOrder: string[],
  isFollowingProp: boolean,
  setIsFollowingProp: (v: boolean) => void,
  isLoading: boolean
) {
  const [viewState, setViewState] = useState<ViewState>({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(isFollowingProp);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const selectedDriverRef = useRef(selectedDriver);
  const leaderboardOrderRef = useRef(leaderboardOrder);

  useEffect(() => {
    selectedDriverRef.current = selectedDriver;
  }, [selectedDriver]);
  useEffect(() => {
    leaderboardOrderRef.current = leaderboardOrder;
  }, [leaderboardOrder]);

  const rootRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!rootRef.current) return;
    if (!document.fullscreenElement) {
      rootRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setIsDragging(true);
      setIsFollowing(false);
      setIsFollowingProp(false);
      setDragStart({ x: e.clientX - viewState.x, y: e.clientY - viewState.y });
    },
    [viewState.x, viewState.y, setIsFollowingProp]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragStart) return;
      setViewState((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      const scaleSensitivity = 0.001;
      const delta = -e.deltaY * scaleSensitivity;

      setViewState((prev) => {
        const newScale = Math.min(Math.max(1, prev.scale + delta * prev.scale), 20);

        if (isFollowing) {
          return { ...prev, scale: newScale };
        }

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const contentX = (mouseX - prev.x) / prev.scale;
        const contentY = (mouseY - prev.y) / prev.scale;
        const newX = mouseX - contentX * newScale;
        const newY = mouseY - contentY * newScale;

        return { scale: newScale, x: newX, y: newY };
      });
    };

    container.style.touchAction = 'none';
    container.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      container.style.touchAction = '';
      container.removeEventListener('wheel', onWheel);
    };
  }, [containerRef, isLoading, isFollowing]);

  useEffect(() => {
    if (!isFollowing || !containerRef.current || Object.keys(activeDrivers).length === 0) return;

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();

    let targetCode = selectedDriverRef.current;
    if (!targetCode && leaderboardOrderRef.current.length > 0) {
      targetCode = leaderboardOrderRef.current[0];
    }

    if (!targetCode) return;

    const driver = activeDrivers[targetCode];
    if (!driver) return;

    const VIEWBOX_WIDTH = 1000;
    const VIEWBOX_HEIGHT = 500;
    const scaleX = width / VIEWBOX_WIDTH;
    const scaleY = height / VIEWBOX_HEIGHT;
    const fitScale = Math.min(scaleX, scaleY);
    const offsetX = (width - VIEWBOX_WIDTH * fitScale) / 2;
    const offsetY = (height - VIEWBOX_HEIGHT * fitScale) / 2;

    setViewState((prev) => {
      const visualDriverX = offsetX + driver.x * fitScale;
      const visualDriverY = offsetY + driver.y * fitScale;
      const leaderboardOffset = window.innerWidth >= 768 ? 256 : 0;
      const centerX = (width - leaderboardOffset) / 2;
      const centerY = height / 2;
      const newX = centerX - visualDriverX * prev.scale;
      const newY = centerY - visualDriverY * prev.scale;
      return { ...prev, x: newX, y: newY };
    });
  }, [isFollowing, activeDrivers, selectedDriver, leaderboardOrder, containerRef]);

  const follow = useCallback(() => {
    setIsFollowing(true);
    setIsFollowingProp(true);
  }, [setIsFollowingProp]);

  return {
    viewState,
    setViewState,
    isDragging,
    isFullscreen,
    rootRef,
    toggleFullscreen,
    follow,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
