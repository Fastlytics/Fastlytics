import React, { memo, useRef, useEffect, useCallback } from 'react';
import { DriverFrameState, getTrailPoints } from './replay-utils';

const VIEWBOX_W = 1000;
const VIEWBOX_H = 500;
const TRAIL_SELECTED_LEN = 20;
const TRAIL_NORMAL_LEN = 8;

interface TrackCanvasProps {
  circuitLayout: string;
  trackColor: string;
  drivers: Record<string, DriverFrameState>;
  driverColors: Record<string, string>;
  driverNumbers?: Record<string, number | string>;
  selectedDriver: string | null;
  visibility: Record<string, string>;
  viewState: { scale: number; x: number; y: number };
  showHeatmap: boolean;
  heatmapSegments: { path: string; color: string }[];
  sectorMarkers: { x: number; y: number; angle: number; label: string }[];
  driverArrays: Record<string, { x: number[]; y: number[] }>;
  safeIndex: number;
  onClickDriver: (code: string) => void;
}

function drawSectorMarkers(
  ctx: CanvasRenderingContext2D,
  markers: { x: number; y: number; angle: number; label: string }[]
) {
  const lineLen = 18;
  ctx.lineCap = 'round';
  for (const marker of markers) {
    const rad = (marker.angle * Math.PI) / 180;
    const dx = Math.cos(rad) * lineLen;
    const dy = Math.sin(rad) * lineLen;
    const isSF = marker.label === 'S/F';

    ctx.beginPath();
    ctx.moveTo(marker.x - dx, marker.y - dy);
    ctx.lineTo(marker.x + dx, marker.y + dy);
    ctx.strokeStyle = isSF ? '#ffffff' : '#9ca3af';
    ctx.lineWidth = isSF ? 3 : 2;
    ctx.stroke();

    if (isSF) {
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.moveTo(marker.x - dx * 0.6, marker.y - dy * 0.6);
      ctx.lineTo(marker.x + dx * 0.6, marker.y + dy * 0.6);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.font = `${isSF ? 'bold ' : ''}${isSF ? 10 : 9}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isSF ? '#ffffff' : '#9ca3af';
    ctx.fillText(marker.label, marker.x + dx * 1.4, marker.y + dy * 1.4);
  }
}

function computeViewBoxTransform(
  ctx: CanvasRenderingContext2D,
  canvasLayoutW: number,
  canvasLayoutH: number
) {
  const scaleX = canvasLayoutW / VIEWBOX_W;
  const scaleY = canvasLayoutH / VIEWBOX_H;
  const fitScale = Math.min(scaleX, scaleY);
  const offsetX = (canvasLayoutW - VIEWBOX_W * fitScale) / 2;
  const offsetY = (canvasLayoutH - VIEWBOX_H * fitScale) / 2;
  ctx.translate(offsetX, offsetY);
  ctx.scale(fitScale, fitScale);
}

function viewBoxFromClick(
  clickVisualX: number,
  clickVisualY: number,
  canvasLayoutW: number,
  canvasLayoutH: number,
  visualW: number,
  visualH: number
): { x: number; y: number } {
  // Convert visual click → layout position (undo CSS transform)
  const layoutX = (clickVisualX * canvasLayoutW) / visualW;
  const layoutY = (clickVisualY * canvasLayoutH) / visualH;

  // Convert layout → viewBox
  const fitScale = Math.min(canvasLayoutW / VIEWBOX_W, canvasLayoutH / VIEWBOX_H);
  const offsetX = (canvasLayoutW - VIEWBOX_W * fitScale) / 2;
  const offsetY = (canvasLayoutH - VIEWBOX_H * fitScale) / 2;
  return {
    x: (layoutX - offsetX) / fitScale,
    y: (layoutY - offsetY) / fitScale,
  };
}

function carLabel(code: string, car: DriverFrameState): string {
  return car.originalCode || code.replace('_GHOST', '');
}

const TrackCanvas = memo<TrackCanvasProps>(
  ({
    circuitLayout,
    trackColor,
    drivers,
    driverColors,
    driverNumbers,
    selectedDriver,
    visibility,
    viewState,
    showHeatmap,
    heatmapSegments,
    sectorMarkers,
    driverArrays,
    safeIndex,
    onClickDriver,
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);
    const isMountedRef = useRef(true);
    const circuitPathRef = useRef<Path2D | null>(null);
    const heatmapPathsRef = useRef<{ path: Path2D; color: string }[]>([]);

    const propsRef = useRef({
      drivers,
      driverColors,
      driverNumbers,
      selectedDriver,
      visibility,
      showHeatmap,
      sectorMarkers,
      driverArrays,
      safeIndex,
      trackColor,
    });
    propsRef.current = {
      drivers,
      driverColors,
      driverNumbers,
      selectedDriver,
      visibility,
      showHeatmap,
      sectorMarkers,
      driverArrays,
      safeIndex,
      trackColor,
    };

    const onClickDriverRef = useRef(onClickDriver);
    useEffect(() => {
      onClickDriverRef.current = onClickDriver;
    }, [onClickDriver]);

    // Parse circuit path once
    useEffect(() => {
      try {
        circuitPathRef.current = new Path2D(circuitLayout);
      } catch {
        circuitPathRef.current = null;
      }
    }, [circuitLayout]);

    // Pre-build heatmap Path2D objects when heatmapSegments changes
    useEffect(() => {
      if (!showHeatmap || !heatmapSegments.length) {
        heatmapPathsRef.current = [];
        return;
      }
      heatmapPathsRef.current = heatmapSegments.map((seg) => ({
        path: new Path2D(seg.path),
        color: seg.color,
      }));
    }, [showHeatmap, heatmapSegments]);

    const render = useCallback(() => {
      if (!isMountedRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      // Use CSS layout size (stable, does not change with CSS transform / zoom)
      const layoutW = canvas.clientWidth || canvas.width || VIEWBOX_W;
      const layoutH = canvas.clientHeight || canvas.height || VIEWBOX_H;
      if (layoutW <= 0 || layoutH <= 0) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      // Pixel buffer: layout size × DPR only. CSS transform handles zoom.
      // This avoids resizing the pixel buffer on every zoom step (stops shaking).
      const dpr = window.devicePixelRatio || 1;
      const pixelW = Math.floor(layoutW * dpr);
      const pixelH = Math.floor(layoutH * dpr);
      if (canvas.width !== pixelW || canvas.height !== pixelH) {
        canvas.width = pixelW;
        canvas.height = pixelH;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const p = propsRef.current;

      // Map each CSS pixel to dpr physical pixels in the buffer
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, layoutW, layoutH);

      // Set up viewBox coordinate system (maps 1000×500 → layoutW×layoutH)
      ctx.save();
      computeViewBoxTransform(ctx, layoutW, layoutH);

      // Clip to viewBox
      ctx.beginPath();
      ctx.rect(0, 0, VIEWBOX_W, VIEWBOX_H);
      ctx.clip();

      // Background fill
      ctx.fillStyle = '#0c0c0e';
      ctx.fillRect(0, 0, VIEWBOX_W, VIEWBOX_H);

      // Track outline
      const circuit = circuitPathRef.current;
      if (circuit) {
        ctx.beginPath();
        ctx.strokeStyle = p.trackColor;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke(circuit);

        // Dashed overlay
        ctx.beginPath();
        ctx.strokeStyle = '#2a2a2e';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([4, 4]);
        ctx.globalAlpha = 0.3;
        ctx.stroke(circuit);
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // Heatmap
      if (p.showHeatmap && heatmapPathsRef.current.length) {
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.8;
        for (const seg of heatmapPathsRef.current) {
          ctx.beginPath();
          ctx.strokeStyle = seg.color;
          ctx.stroke(seg.path);
        }
        ctx.globalAlpha = 1;
      }

      // Sector markers
      if (p.sectorMarkers.length) {
        drawSectorMarkers(ctx, p.sectorMarkers);
      }

      // Collect visible drivers + compute trails
      const visDrivers: {
        code: string;
        isSelected: boolean;
        isDimmed: boolean;
        color: string;
        x: number;
        y: number;
        num?: number | string;
        label: string;
      }[] = [];

      const trailPointsCache: Record<
        string,
        { x: number; y: number; opacity: number; isDimmed: boolean }[]
      > = {};

      for (const [code, car] of Object.entries(p.drivers)) {
        const vis = p.visibility[code];
        if (vis === 'hidden') continue;

        const color = car.color || p.driverColors[code] || '#ffffff';
        const cleanCode = code.replace('_GHOST', '');
        const arrays = p.driverArrays[cleanCode];
        const trailLen = p.selectedDriver === code ? TRAIL_SELECTED_LEN : TRAIL_NORMAL_LEN;
        const isDimmed = vis === 'out-dimmed';

        if (arrays) {
          const trail = getTrailPoints(arrays.x, arrays.y, p.safeIndex, trailLen);
          trailPointsCache[code] = trail.map((pt) => ({ ...pt, isDimmed }));
        }

        visDrivers.push({
          code,
          isSelected: p.selectedDriver === code,
          isDimmed,
          color,
          x: car.x,
          y: car.y,
          num: p.driverNumbers?.[cleanCode],
          label: carLabel(code, car),
        });
      }

      // Draw trails (underneath cars)
      for (const [code, trail] of Object.entries(trailPointsCache)) {
        const color = p.driverColors[code.replace('_GHOST', '')] || '#ffffff';
        for (const pt of trail) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = pt.opacity * 0.5 * (pt.isDimmed ? 0.5 : 1);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Draw selected driver last (on top)
      const sortedVis = [...visDrivers].sort((a, b) => {
        if (a.isSelected) return 1;
        if (b.isSelected) return -1;
        return 0;
      });

      for (const drv of sortedVis) {
        const { isSelected, isDimmed, color, x, y, num, label } = drv;
        if (!isSelected && isDimmed) ctx.globalAlpha = 0.5;

        // Selection glow ring (pulse via time)
        if (isSelected) {
          const pulseScale = 1 + 0.15 * Math.sin(Date.now() / 400);
          ctx.beginPath();
          ctx.arc(x, y, 12 * pulseScale, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Car dot
        const radius = isSelected ? 8 : 5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Driver number inside dot
        if (num !== undefined) {
          ctx.font = `bold ${isSelected ? 7 : 5}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#000000';
          ctx.fillText(String(num), x, y + 0.5);
        }

        // Selected driver label
        if (isSelected) {
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = color;
          ctx.fillText(label, x, y - 15);
        }

        ctx.globalAlpha = 1;
      }

      ctx.restore();

      rafRef.current = requestAnimationFrame(render);
    }, []);

    // Start rAF loop
    useEffect(() => {
      isMountedRef.current = true;
      rafRef.current = requestAnimationFrame(render);
      return () => {
        isMountedRef.current = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [render]);

    // Click detection — correctly translates visual click through CSS transform to viewBox
    const handleClick = useCallback((e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Visual bounds (includes CSS transform from useCamera)
      const rect = canvas.getBoundingClientRect();
      const clickVisualX = e.clientX - rect.left;
      const clickVisualY = e.clientY - rect.top;

      // Layout size (pre-transform, stable)
      const layoutW = canvas.clientWidth || rect.width;
      const layoutH = canvas.clientHeight || rect.height;
      if (layoutW <= 0 || layoutH <= 0) return;

      const { x: cx, y: cy } = viewBoxFromClick(
        clickVisualX,
        clickVisualY,
        layoutW,
        layoutH,
        rect.width || layoutW,
        rect.height || layoutH
      );

      let closestCode: string | null = null;
      let closestDist = Infinity;

      for (const [code, car] of Object.entries(propsRef.current.drivers)) {
        if (propsRef.current.visibility[code] === 'hidden') continue;
        const dx = car.x - cx;
        const dy = car.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 14 && dist < closestDist) {
          closestDist = dist;
          closestCode = code;
        }
      }

      onClickDriverRef.current(
        closestCode === propsRef.current.selectedDriver ? '' : closestCode || ''
      );
    }, []);

    return (
      <div ref={containerRef} className="w-full h-full relative overflow-hidden">
        <div
          data-track-transform
          className="w-full h-full origin-top-left will-change-transform"
          style={{
            transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`,
          }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            onClick={handleClick}
          />
        </div>
      </div>
    );
  }
);

export default TrackCanvas;
