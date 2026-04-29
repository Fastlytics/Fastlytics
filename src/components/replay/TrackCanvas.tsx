import React, { useRef, useEffect, useCallback } from 'react';
import { renderTrack, TrackRendererConfig } from './TrackRenderer';
import { DriverFrameState, getSpeedHeatmapSegments } from './replay-utils';

interface TrackCanvasProps {
  circuitPoints: number[][];
  circuitLayout: string;
  trackColor: string;
  drivers: Record<string, DriverFrameState>;
  driverColors: Record<string, string>;
  driverNumbers?: Record<string, number | string>;
  selectedDriver: string | null;
  visibility: Record<string, string>;
  viewState: { scale: number; x: number; y: number };
  showHeatmap: boolean;
  sectorMarkers: { x: number; y: number; angle: number; label: string }[];
  safeIndex: number;
  driverArrays: Record<string, { x: number[]; y: number[] }>;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onClickDriver: (code: string) => void;
  className?: string;
}

const TrackCanvas: React.FC<TrackCanvasProps> = ({
  circuitPoints,
  circuitLayout,
  trackColor,
  drivers,
  driverColors,
  driverNumbers,
  selectedDriver,
  visibility,
  viewState,
  showHeatmap,
  sectorMarkers,
  safeIndex,
  driverArrays,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onClickDriver,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const buildHeatmapSegments = useCallback((): { color: string; points: [number, number][] }[] => {
    if (!showHeatmap || !selectedDriver || !circuitPoints.length) return [];

    const dArrays = driverArrays[selectedDriver];
    if (!dArrays) return [];

    const pathLen = circuitPoints.length;
    const speedArray: number[] = new Array(pathLen).fill(0);
    const len = dArrays.x.length;
    const sampleRange = Math.min(len, 25 * 120);
    const start = Math.max(0, safeIndex - sampleRange);
    const end = Math.min(len - 1, safeIndex);

    for (let i = start; i <= end; i++) {
      const px = dArrays.x[i];
      const py = dArrays.y[i];
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let j = 0; j < pathLen; j += 3) {
        const dx = circuitPoints[j][0] - px;
        const dy = circuitPoints[j][1] - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDist) {
          bestDist = d2;
          bestIdx = j;
        }
      }
      const speedVal = driverArrays[selectedDriver]
        ? ((driverArrays[selectedDriver] as { speed?: number[] }).speed?.[i] ?? 0)
        : 0;
      speedArray[bestIdx] = speedVal;
    }

    const segments = getSpeedHeatmapSegments(circuitPoints, speedArray, 350);
    return segments.map((seg) => {
      const points: [number, number][] = [];
      const parts = seg.path.split(/[ML]\s*/).filter(Boolean);
      for (const part of parts) {
        const [x, y] = part.trim().split(',').map(Number);
        if (!isNaN(x) && !isNaN(y)) points.push([x, y]);
      }
      return { color: seg.color, points };
    });
  }, [showHeatmap, selectedDriver, circuitPoints, safeIndex, driverArrays]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    resizeCanvas();

    const config: TrackRendererConfig = {
      circuitPoints,
      circuitLayout,
      trackColor,
      drivers,
      driverColors,
      driverNumbers,
      selectedDriver,
      visibility,
      viewState,
      showHeatmap,
      heatmapSegments: buildHeatmapSegments(),
      sectorMarkers,
      safeIndex,
      driverArrays,
      trailLength: 15,
    };

    renderTrack(ctx, canvas, config);

    const observer = new ResizeObserver(() => {
      resizeCanvas();
      renderTrack(ctx, canvas, config);
    });
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [
    circuitPoints,
    circuitLayout,
    trackColor,
    drivers,
    driverColors,
    driverNumbers,
    selectedDriver,
    visibility,
    viewState,
    showHeatmap,
    sectorMarkers,
    safeIndex,
    driverArrays,
    buildHeatmapSegments,
  ]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const scaleX = rect.width / 1000;
      const scaleY = rect.height / 500;
      const fitScale = Math.min(scaleX, scaleY);
      const offsetX = (rect.width - 1000 * fitScale) / 2;
      const offsetY = (rect.height - 500 * fitScale) / 2;

      for (const [code, car] of Object.entries(drivers)) {
        const cx = car.x * fitScale + offsetX;
        const cy = car.y * fitScale + offsetY;
        const dist = Math.sqrt((clickX - cx) ** 2 + (clickY - cy) ** 2);
        if (dist < 15) {
          onClickDriver(code);
          return;
        }
      }
    },
    [drivers, onClickDriver]
  );

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onClick={handleCanvasClick}
    />
  );
};

export default TrackCanvas;
