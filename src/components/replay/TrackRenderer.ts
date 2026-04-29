import { DriverFrameState } from '@/components/replay/replay-utils';

const VIEWBOX_W = 1000;
const VIEWBOX_H = 500;

export interface TrackRendererConfig {
  circuitPoints: number[][];
  circuitLayout: string;
  trackColor: string;
  drivers: Record<string, DriverFrameState>;
  driverColors: Record<string, string>;
  selectedDriver: string | null;
  visibility: Record<string, string>;
  viewState: { scale: number; x: number; y: number };
  showHeatmap: boolean;
  heatmapSegments: { color: string; points: [number, number][] }[];
  sectorMarkers: { x: number; y: number; angle: number; label: string }[];
  safeIndex: number;
  driverArrays: Record<string, { x: number[]; y: number[] }>;
  trailLength: number;
}

function fitToCanvas(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number
): { scale: number; offsetX: number; offsetY: number } {
  const scaleX = canvasW / VIEWBOX_W;
  const scaleY = canvasH / VIEWBOX_H;
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (canvasW - VIEWBOX_W * scale) / 2;
  const offsetY = (canvasH - VIEWBOX_H * scale) / 2;
  return { scale, offsetX, offsetY };
}

function drawPathFromPoints(
  ctx: CanvasRenderingContext2D,
  points: number[][],
  stroke: string,
  lineWidth: number,
  fit: { scale: number; offsetX: number; offsetY: number }
) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0] * fit.scale + fit.offsetX, points[0][1] * fit.scale + fit.offsetY);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0] * fit.scale + fit.offsetX, points[i][1] * fit.scale + fit.offsetY);
  }
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth * fit.scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

export function renderTrack(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: TrackRendererConfig
) {
  const { width, height } = canvas;
  const fit = fitToCanvas(ctx, width, height);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(
    config.viewState.x * (width / (canvas.clientWidth || width)),
    config.viewState.y * (height / (canvas.clientHeight || height))
  );
  ctx.scale(config.viewState.scale, config.viewState.scale);

  drawPathFromPoints(ctx, config.circuitPoints, config.trackColor, 12, fit);

  ctx.setLineDash([4, 4]);
  drawPathFromPoints(ctx, config.circuitPoints, '#374151', 2, fit);
  ctx.globalAlpha = 0.3;
  drawPathFromPoints(ctx, config.circuitPoints, '#374151', 2, fit);
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);

  if (config.showHeatmap && config.heatmapSegments.length > 0) {
    for (const seg of config.heatmapSegments) {
      ctx.globalAlpha = 0.8;
      drawPathFromPoints(ctx, seg.points, seg.color, 10, fit);
      ctx.globalAlpha = 1;
    }
  }

  for (const marker of config.sectorMarkers) {
    const mx = marker.x * fit.scale + fit.offsetX;
    const my = marker.y * fit.scale + fit.offsetY;
    const lineLen = 18 * fit.scale;
    const dx = Math.cos((marker.angle * Math.PI) / 180) * lineLen;
    const dy = Math.sin((marker.angle * Math.PI) / 180) * lineLen;
    const isSF = marker.label === 'S/F';

    ctx.beginPath();
    ctx.moveTo(mx - dx, my - dy);
    ctx.lineTo(mx + dx, my + dy);
    ctx.strokeStyle = isSF ? '#ffffff' : '#9ca3af';
    ctx.lineWidth = (isSF ? 3 : 2) * fit.scale;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.7;
    ctx.stroke();

    if (isSF) {
      ctx.beginPath();
      ctx.moveTo(mx - dx * 0.6, my - dy * 0.6);
      ctx.lineTo(mx + dx * 0.6, my + dy * 0.6);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5 * fit.scale;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = isSF ? '#ffffff' : '#9ca3af';
    ctx.font = `${(isSF ? 10 : 9) * fit.scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(marker.label, mx + dx * 1.4, my + dy * 1.4);
    ctx.globalAlpha = 1;
  }

  for (const [code, car] of Object.entries(config.drivers)) {
    if (config.visibility[code] === 'hidden') continue;

    const color = car.color || config.driverColors[code] || '#ffffff';
    const driverArrays = config.driverArrays[code.replace('_GHOST', '')];
    if (!driverArrays) continue;

    const trailLen = config.selectedDriver === code ? 20 : 8;
    const startIdx = Math.max(0, config.safeIndex - trailLen);

    for (let i = startIdx; i <= config.safeIndex && i < driverArrays.x.length; i++) {
      const age = config.safeIndex - i;
      const opacity = (1 - age / trailLen) * 0.5;
      const tx = driverArrays.x[i] * fit.scale + fit.offsetX;
      const ty = driverArrays.y[i] * fit.scale + fit.offsetY;

      ctx.beginPath();
      ctx.arc(tx, ty, 2 * fit.scale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  for (const [code, car] of Object.entries(config.drivers)) {
    if (config.visibility[code] === 'hidden') continue;

    const color = car.color || config.driverColors[code] || '#ffffff';
    const cx = car.x * fit.scale + fit.offsetX;
    const cy = car.y * fit.scale + fit.offsetY;
    const isSelected = config.selectedDriver === code;
    const isDimmed = config.visibility[code] === 'out-dimmed';

    if (isDimmed) ctx.globalAlpha = 0.5;

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = isDimmed ? 0.5 : 1;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, isSelected ? 8 : 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (isSelected) {
      const labelSize = 12;
      ctx.fillStyle = color;
      ctx.font = `bold ${labelSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(car.originalCode || code.replace('_GHOST', ''), cx, cy - 15);
    }

    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
