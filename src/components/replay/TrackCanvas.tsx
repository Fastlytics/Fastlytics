import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ReplayFrame, ReplayTrack } from '@/lib/api';
import { interpolatePosition } from './replay-utils';

interface TrackCanvasProps {
  track: ReplayTrack;
  currentFrame: ReplayFrame | null;
  nextFrame?: ReplayFrame | null;
  currentTime?: number;
  driverColors: Record<string, string>;
  selectedDriver: string | null;
  onSelectDriver: (abbr: string | null) => void;
}

interface DriverRenderState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

export function TrackCanvas({
  track,
  currentFrame,
  nextFrame,
  currentTime = 0,
  driverColors,
  selectedDriver,
  onSelectDriver,
}: TrackCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const driverStatesRef = useRef<Map<string, DriverRenderState>>(new Map());
  const timeInfoRef = useRef({ currentFrame, nextFrame, currentTime });
  const rafRef = useRef<number>(0);

  // Sync latest props into ref for the rAF loop
  useEffect(() => {
    timeInfoRef.current = { currentFrame, nextFrame, currentTime };
  }, [currentFrame, nextFrame, currentTime]);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetStartRef = useRef({ x: 0, y: 0 });

  // Canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // We no longer need the old useEffect targetX/Y logic, we'll populate driverStatesRef directly in render

  // Compute transform: normalized [0,1] coords → canvas pixels
  const getTransform = useCallback(() => {
    const padding = 60;
    const availW = canvasSize.width - padding * 2;
    const availH = canvasSize.height - padding * 2;

    // Track data is already normalized to [0, ~1] range
    const trackRange =
      Math.max(
        Math.max(...track.x) - Math.min(...track.x),
        Math.max(...track.y) - Math.min(...track.y)
      ) || 1;

    const scale = (Math.min(availW, availH) / trackRange) * zoom;
    const centerX = canvasSize.width / 2 + panOffset.x;
    const centerY = canvasSize.height / 2 + panOffset.y;

    const trackCenterX = (Math.min(...track.x) + Math.max(...track.x)) / 2;
    const trackCenterY = (Math.min(...track.y) + Math.max(...track.y)) / 2;

    return {
      toCanvasX: (nx: number) => centerX + (nx - trackCenterX) * scale,
      toCanvasY: (ny: number) => centerY - (ny - trackCenterY) * scale, // Flip Y
      scale,
    };
  }, [canvasSize, track, zoom, panOffset]);

  // --- Render Loop ---
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    if (!track.x.length) return;

    const { toCanvasX, toCanvasY, scale } = getTransform();

    // --- Draw Track Outline ---
    ctx.beginPath();
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = Math.max(2, scale * 0.008);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < track.x.length; i++) {
      const cx = toCanvasX(track.x[i]);
      const cy = toCanvasY(track.y[i]);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.closePath();
    ctx.stroke();

    // --- Draw Sector Boundaries ---
    if (track.sector_boundaries) {
      const { s1_end, s2_end } = track.sector_boundaries;
      const markers = [
        { idx: s1_end, label: 'S1' },
        { idx: s2_end, label: 'S2' },
        { idx: 0, label: 'S3' },
      ];

      ctx.font = `${Math.max(9, scale * 0.004)}px monospace`;
      for (const marker of markers) {
        if (marker.idx >= 0 && marker.idx < track.x.length) {
          const mx = toCanvasX(track.x[marker.idx]);
          const my = toCanvasY(track.y[marker.idx]);

          ctx.beginPath();
          ctx.arc(mx, my, Math.max(3, scale * 0.003), 0, Math.PI * 2);
          ctx.fillStyle = '#555';
          ctx.fill();

          ctx.fillStyle = '#777';
          ctx.textAlign = 'center';
          ctx.fillText(marker.label, mx, my - 8);
        }
      }
    }

    // --- Draw Driver Dots ---
    const { currentFrame: cFrame, nextFrame: nFrame, currentTime: cTime } = timeInfoRef.current;
    if (!cFrame) {
      rafRef.current = requestAnimationFrame(render);
      return;
    }

    // Calculate exact interpolation parameter `t`
    let t = 0;
    if (nFrame && nFrame.timestamp > cFrame.timestamp) {
      t = (cTime - cFrame.timestamp) / (nFrame.timestamp - cFrame.timestamp);
      t = Math.max(0, Math.min(1, t));
    }

    const nDrivers = new Map(nFrame?.drivers.map((d) => [d.abbr, d]));

    const states = driverStatesRef.current;
    const dotRadius = Math.max(4, Math.min(8, scale * 0.005));
    const fontSize = Math.max(8, Math.min(11, scale * 0.004));

    // Draw non-selected drivers first, then selected on top
    const sortedDrivers = [...cFrame.drivers].sort((a, b) => {
      if (a.abbr === selectedDriver) return 1; // Draw selected last (on top)
      if (b.abbr === selectedDriver) return -1;
      return 0;
    });

    for (const drv of sortedDrivers) {
      if (drv.retired) continue;

      const nDrv = nDrivers.get(drv.abbr);
      let x = drv.x;
      let y = drv.y;

      if (nDrv && !nDrv.retired) {
        x = x + (nDrv.x - x) * t;
        y = y + (nDrv.y - y) * t;
      }

      // Save to states ref for click detection
      const existing = states.get(drv.abbr);
      if (existing) {
        existing.x = x;
        existing.y = y;
      } else {
        states.set(drv.abbr, { x, y, targetX: x, targetY: y });
      }

      const cx = toCanvasX(x);
      const cy = toCanvasY(y);
      const color = driverColors[drv.abbr] || '#888';
      const isSelected = drv.abbr === selectedDriver;

      // Dot
      ctx.beginPath();
      ctx.arc(cx, cy, isSelected ? dotRadius * 1.4 : dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Selected glow
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(cx, cy, dotRadius * 2.2, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // In-pit indicator
      if (drv.in_pit) {
        ctx.beginPath();
        ctx.arc(cx, cy, dotRadius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Driver abbreviation label
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      // Label background
      const labelY = cy - dotRadius - 3;
      const textWidth = ctx.measureText(drv.abbr).width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(cx - textWidth / 2 - 2, labelY - fontSize, textWidth + 4, fontSize + 2);

      ctx.fillStyle = isSelected ? '#fff' : '#ccc';
      ctx.fillText(drv.abbr, cx, labelY);

      // Fastest lap indicator
      if (drv.has_fastest_lap) {
        ctx.beginPath();
        ctx.arc(cx + dotRadius + 3, cy - dotRadius, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#A020F0';
        ctx.fill();
      }
    }

    rafRef.current = requestAnimationFrame(render);
  }, [canvasSize, track, driverColors, selectedDriver, getTransform]);

  // Start/stop render loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [render]);

  // --- Mouse Interactions ---
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    // Normalize delta: typical mousewheel delta is ~100, normalize to ~1
    const normalizedDelta = e.deltaY / 100;

    // Dampen the zoom change significantly
    // Use 0.2 as factor - each wheel tick zooms minimally
    const zoomFactor = 1 - normalizedDelta * 0.2;

    // Clamp zoom between 0.3x and 8x
    setZoom((prev) => Math.max(0.3, Math.min(8, prev * zoomFactor)));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        // Left click
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY };
        panOffsetStartRef.current = { ...panOffset };
      }
    },
    [panOffset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;

      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;

      // Calculate pan bounds based on canvas size and zoom
      // Allow panning up to half the canvas size (centered)
      const maxPanX = canvasSize.width / 2;
      const maxPanY = canvasSize.height / 2;

      setPanOffset({
        x: Math.max(-maxPanX, Math.min(maxPanX, panOffsetStartRef.current.x + dx)),
        y: Math.max(-maxPanY, Math.min(maxPanY, panOffsetStartRef.current.y + dy)),
      });
    },
    [isPanning, canvasSize]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Click to select driver
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const { currentFrame: cFrame } = timeInfoRef.current;
      if (!cFrame || !canvasRef.current) return;

      // ...
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const { toCanvasX, toCanvasY } = getTransform();
      const states = driverStatesRef.current;

      let closestDriver: string | null = null;
      let closestDist = Infinity;

      for (const drv of cFrame.drivers) {
        const state = states.get(drv.abbr);
        if (!state || drv.retired) continue;

        const cx = toCanvasX(state.x);
        const cy = toCanvasY(state.y);
        const dist = Math.sqrt((clickX - cx) ** 2 + (clickY - cy) ** 2);

        if (dist < 20 && dist < closestDist) {
          closestDist = dist;
          closestDriver = drv.abbr;
        }
      }

      onSelectDriver(closestDriver === selectedDriver ? null : closestDriver);
    },
    [currentFrame, selectedDriver, onSelectDriver, getTransform]
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden cursor-crosshair"
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />
    </div>
  );
}
