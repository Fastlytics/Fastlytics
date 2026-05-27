import { useState, useEffect, useRef, useCallback } from 'react';
import { DriverFrameState } from '@/components/replay/replay-utils';

interface ViewState {
  scale: number;
  x: number;
  y: number;
}

/**
 * Applies the current viewState directly to the DOM target element,
 * bypassing React re-renders for smooth 60fps pan/zoom.
 */
function applyTransformToDOM(target: HTMLElement | null, state: ViewState) {
  if (!target) return;
  target.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
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
  // viewState is the source of truth, but we apply transforms via DOM for performance.
  // React state is only updated on drag-end / zoom-end / follow tick to keep children in sync.
  const viewStateRef = useRef<ViewState>({ scale: 1, x: 0, y: 0 });
  const [viewState, setViewState] = useState<ViewState>({ scale: 1, x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(isFollowingProp);

  // The element we apply transforms to (first child of containerRef — the track wrapper)
  const trackElementRef = useRef<HTMLElement | null>(null);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const selectedDriverRef = useRef(selectedDriver);
  const leaderboardOrderRef = useRef(leaderboardOrder);

  useEffect(() => {
    selectedDriverRef.current = selectedDriver;
  }, [selectedDriver]);
  useEffect(() => {
    leaderboardOrderRef.current = leaderboardOrder;
  }, [leaderboardOrder]);

  const rootRef = useRef<HTMLDivElement>(null);

  // Resolve the track transform element (first child of the container)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const target = container.querySelector('[data-track-transform]') as HTMLElement | null;
    trackElementRef.current = target || (container.firstElementChild as HTMLElement | null);
  }, [containerRef, isLoading]);

  const syncReactState = useCallback(() => {
    const s = viewStateRef.current;
    setViewState({ scale: s.scale, x: s.x, y: s.y });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!rootRef.current) return;
    if (!document.fullscreenElement) {
      rootRef.current.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // --- Drag panning via native event listeners (no React re-renders during drag) ---
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      isDraggingRef.current = true;
      setIsFollowing(false);
      setIsFollowingProp(false);
      const vs = viewStateRef.current;
      dragStartRef.current = { x: e.clientX - vs.x, y: e.clientY - vs.y };
    },
    [setIsFollowingProp]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || !dragStartRef.current) return;
    const vs = viewStateRef.current;
    vs.x = e.clientX - dragStartRef.current.x;
    vs.y = e.clientY - dragStartRef.current.y;
    applyTransformToDOM(trackElementRef.current, vs);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    dragStartRef.current = null;
    // Sync to React state once drag finishes
    syncReactState();
  }, [syncReactState]);

  useEffect(() => {
    const onGlobalMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      dragStartRef.current = null;
      syncReactState();
    };
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, [syncReactState]);

  // --- Wheel zoom via native listener ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scaleSensitivity = 0.001;
      const delta = -e.deltaY * scaleSensitivity;
      const vs = viewStateRef.current;
      const newScale = Math.min(Math.max(1, vs.scale + delta * vs.scale), 20);

      if (isFollowing) {
        vs.scale = newScale;
      } else {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const contentX = (mouseX - vs.x) / vs.scale;
        const contentY = (mouseY - vs.y) / vs.scale;
        vs.scale = newScale;
        vs.x = mouseX - contentX * newScale;
        vs.y = mouseY - contentY * newScale;
      }

      applyTransformToDOM(trackElementRef.current, vs);
      syncReactState();
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [containerRef, isLoading, isFollowing, syncReactState]);

  // Store activeDrivers in a ref to avoid triggering the follow effect on every frame
  const activeDriversRef = useRef(activeDrivers);
  useEffect(() => {
    activeDriversRef.current = activeDrivers;
  }, [activeDrivers]);

  // Follow camera: only follows when a driver is explicitly selected.
  // Uses requestAnimationFrame loop with smoothing to prevent shaking.
  const followRafRef = useRef<number | null>(null);
  const smoothXRef = useRef<number | null>(null);
  const smoothYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isFollowing) {
      if (followRafRef.current) {
        cancelAnimationFrame(followRafRef.current);
        followRafRef.current = null;
      }
      smoothXRef.current = null;
      smoothYRef.current = null;
      return;
    }

    function updateFollow() {
      const container = containerRef.current;
      const drivers = activeDriversRef.current;
      if (!container || Object.keys(drivers).length === 0) {
        followRafRef.current = requestAnimationFrame(updateFollow);
        return;
      }

      // Only follow if a driver is explicitly selected — don't auto-follow leader
      const targetCode = selectedDriverRef.current;
      if (!targetCode) {
        followRafRef.current = requestAnimationFrame(updateFollow);
        return;
      }

      const driver = drivers[targetCode];
      if (!driver) {
        followRafRef.current = requestAnimationFrame(updateFollow);
        return;
      }

      const { width, height } = container.getBoundingClientRect();
      const VIEWBOX_WIDTH = 1000;
      const VIEWBOX_HEIGHT = 500;
      const scaleX = width / VIEWBOX_WIDTH;
      const scaleY = height / VIEWBOX_HEIGHT;
      const fitScale = Math.min(scaleX, scaleY);
      const offsetX = (width - VIEWBOX_WIDTH * fitScale) / 2;
      const offsetY = (height - VIEWBOX_HEIGHT * fitScale) / 2;

      const vs = viewStateRef.current;
      const visualDriverX = offsetX + driver.x * fitScale;
      const visualDriverY = offsetY + driver.y * fitScale;
      const leaderboardOffset = window.innerWidth >= 768 ? 256 : 0;
      const centerX = (width - leaderboardOffset) / 2;
      const centerY = height / 2;
      const targetX = centerX - visualDriverX * vs.scale;
      const targetY = centerY - visualDriverY * vs.scale;

      // Smooth interpolation to prevent shaking (lerp factor 0.08 = gentle follow)
      const LERP = 0.08;
      const prevSmX = smoothXRef.current ?? targetX;
      const prevSmY = smoothYRef.current ?? targetY;
      const newX = prevSmX + (targetX - prevSmX) * LERP;
      const newY = prevSmY + (targetY - prevSmY) * LERP;

      smoothXRef.current = newX;
      smoothYRef.current = newY;

      // Only apply if the smoothed position moved enough (> 0.5px)
      if (Math.abs(newX - vs.x) >= 0.5 || Math.abs(newY - vs.y) >= 0.5) {
        vs.x = newX;
        vs.y = newY;
        applyTransformToDOM(trackElementRef.current, vs);
        syncReactState();
      }

      followRafRef.current = requestAnimationFrame(updateFollow);
    }

    followRafRef.current = requestAnimationFrame(updateFollow);
    return () => {
      if (followRafRef.current) {
        cancelAnimationFrame(followRafRef.current);
        followRafRef.current = null;
      }
    };
  }, [isFollowing, containerRef, syncReactState]);

  const follow = useCallback(() => {
    setIsFollowing(true);
    setIsFollowingProp(true);
  }, [setIsFollowingProp]);

  return {
    viewState,
    setViewState,
    isDragging: false, // No longer tracked as state; consumers don't need re-renders for this
    isFullscreen,
    rootRef,
    toggleFullscreen,
    follow,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
