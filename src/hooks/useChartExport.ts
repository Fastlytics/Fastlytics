import { useRef, useCallback, useState } from 'react';
import { getDriverImage } from '@/utils/imageMapping';
import { driverColor } from '@/lib/driverColor';

export type ExportFormat = 'svg' | 'png' | 'csv' | 'json' | 'clipboard';

export interface ChartExportMeta {
  title: string;
  subtitle?: string;
  year?: number | string;
  event?: string;
  session?: string;
  drivers?: string[];
}

export interface ChartExportData {
  columns: { key: string; label: string }[];
  rows: Record<string, unknown>[];
}

const PNG_SCALE = 4;
const FONT = 'Geist, system-ui, -apple-system, sans-serif';
const MONO = 'Geist Mono, monospace';

/** Map 3-letter driver codes to last names. */
const DRIVER_LAST_NAMES: Record<string, string> = {
  VER: 'Verstappen',
  HAM: 'Hamilton',
  NOR: 'Norris',
  LEC: 'Leclerc',
  PIA: 'Piastri',
  SAI: 'Sainz',
  RUS: 'Russell',
  ALO: 'Alonso',
  GAS: 'Gasly',
  OCO: 'Ocon',
  STR: 'Stroll',
  PER: 'Perez',
  ALB: 'Albon',
  TSU: 'Tsunoda',
  RIC: 'Ricciardo',
  MAG: 'Magnussen',
  HUL: 'Hulkenberg',
  BOT: 'Bottas',
  ZHO: 'Zhou',
  SAR: 'Sargeant',
  LAW: 'Lawson',
  COL: 'Colapinto',
  BEA: 'Bearman',
  DOO: 'Doohan',
  HAD: 'Hadjar',
  BOR: 'Bortoleto',
  ANT: 'Antonelli',
  VET: 'Vettel',
  RAI: 'Raikkonen',
  GRO: 'Grosjean',
  KVY: 'Kvyat',
  GIO: 'Giovinazzi',
  LAT: 'Latifi',
  MSC: 'Schumacher',
  MAZ: 'Mazepin',
  DEV: 'de Vries',
  KUB: 'Kubica',
  FIT: 'Fittipaldi',
  AITken: 'Aitken',
  DRU: 'Drugovich',
  LIN: 'Lindblad',
};
function driverLastName(code: string): string {
  return DRIVER_LAST_NAMES[code] || code;
}

/**
 * Hook for multi-format chart export.
 *
 * Instead of screenshotting the DOM, this system:
 * - SVG/PNG: Extracts the actual Recharts SVG, inlines styles, wraps with
 *   branded header/footer, and produces true vector or high-res raster output.
 * - CSV/JSON: Exports the underlying chart data directly.
 * - Clipboard: Copies the vector SVG markup for pasting into design tools.
 */
export function useChartExport() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportChart = useCallback(
    async (format: ExportFormat, meta: ChartExportMeta, data?: ChartExportData) => {
      setIsExporting(true);
      try {
        switch (format) {
          case 'svg':
            return await exportAsSvg(chartRef.current, meta);
          case 'png':
            return await exportAsPng(chartRef.current, meta);
          case 'csv':
            return exportAsCsv(meta, data);
          case 'json':
            return exportAsJson(meta, data);
          case 'clipboard':
            return await exportToClipboard(chartRef.current, meta);
        }
      } catch (err) {
        console.error(`Chart export (${format}) failed:`, err);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return { chartRef, exportChart, isExporting };
}

// ---------------------------------------------------------------------------
// SVG extraction & branding
// ---------------------------------------------------------------------------

function findChartSvg(container: HTMLDivElement | null): SVGSVGElement | null {
  if (!container) return null;

  // Prefer Recharts surface
  const recharts = container.querySelector('svg.recharts-surface') as SVGSVGElement;
  if (recharts) return recharts;

  // Fall back to the largest SVG in the container (skip tiny icon SVGs)
  const allSvgs = Array.from(container.querySelectorAll('svg')) as SVGSVGElement[];
  let best: SVGSVGElement | null = null;
  let bestArea = 0;
  const MIN_CHART_AREA = 10000; // ~100x100px minimum to qualify as a chart
  for (const svg of allSvgs) {
    const rect = svg.getBoundingClientRect();
    const area = rect.width * rect.height;
    if (area > bestArea && area >= MIN_CHART_AREA) {
      bestArea = area;
      best = svg;
    }
  }
  return best;
}

/** Clone the Recharts SVG and inline all computed styles so it's self-contained. */
function cloneAndInlineStyles(original: SVGSVGElement): SVGSVGElement {
  const clone = original.cloneNode(true) as SVGSVGElement;
  const origEls = original.querySelectorAll('*');
  const cloneEls = clone.querySelectorAll('*');

  const PROPS = [
    'fill',
    'stroke',
    'stroke-width',
    'stroke-dasharray',
    'stroke-linecap',
    'stroke-linejoin',
    'opacity',
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'text-anchor',
    'dominant-baseline',
    'letter-spacing',
    'visibility',
    'display',
  ];

  origEls.forEach((origEl, i) => {
    const computed = window.getComputedStyle(origEl);
    const cloneEl = cloneEls[i] as SVGElement;
    PROPS.forEach((prop) => {
      const val = computed.getPropertyValue(prop);
      if (val && val !== 'none' && val !== 'normal' && val !== '') {
        cloneEl.style.setProperty(prop, val);
      }
    });
  });

  // Remove interactive/brush elements
  clone.querySelectorAll('.recharts-brush, .recharts-tooltip-wrapper').forEach((el) => el.remove());

  // Force sans-serif font on all text elements so axis labels don't fall back to Times
  const SANS = `${FONT}`;
  clone.querySelectorAll('text, tspan').forEach((el) => {
    (el as SVGElement).style.setProperty('font-family', SANS);
  });

  return clone;
}

/** Load a driver image, crop to headshot, and return as a base64 data URL. */
async function loadHeadshotDataUrl(driverCode: string, year: number): Promise<string | null> {
  const src = getDriverImage(driverCode, year);
  if (!src) return null;

  try {
    const img = await loadImage(src);
    // Crop top ~40% of the image for the headshot
    const cropH = Math.round(img.naturalHeight * 0.4);
    const cropW = img.naturalWidth;
    const size = 256; // output square size
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    // Center-crop: take full width, top portion
    const srcAspect = cropW / cropH;
    let sx = 0;
    let sw = cropW;
    const sy = 0;
    const sh = cropH;
    if (srcAspect > 1) {
      // wider than tall crop — narrow the source width to center
      sw = cropH;
      sx = Math.round((cropW - sw) / 2);
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/** Build a branded SVG document wrapping the chart SVG. */
function buildBrandedSvg(
  chartSvg: SVGSVGElement,
  meta: ChartExportMeta,
  headshotDataUrls?: Record<string, string>
): string {
  const viewBox = chartSvg.getAttribute('viewBox');
  const svgW = parseFloat(chartSvg.getAttribute('width') || '800');
  const svgH = parseFloat(chartSvg.getAttribute('height') || '400');

  const hasHeadshots = headshotDataUrls && Object.keys(headshotDataUrls).length > 0;
  const padding = 40;

  // --- Build context line: "2026 AUSTRALIAN GP // FP1" ---
  const contextParts: string[] = [];
  if (meta.year) contextParts.push(String(meta.year));
  if (meta.event) contextParts.push(meta.event.replace(/-/g, ' ').toUpperCase());
  if (meta.session) contextParts.push(meta.session.toUpperCase());
  const contextLine = contextParts.join('  //  ');

  // Layout measurements
  const contextH = contextLine ? 28 : 0; // small context line at top
  const titleH = 44; // big bold chart title
  const accentH = 3;
  const headerH = 12 + contextH + titleH + 8; // top pad + context + title + bottom pad

  // Driver section: circular headshots with last name below, left-aligned
  const driverImgSize = 52;
  const driverSlotW = 76;
  const driverSlotH = driverImgSize + 22; // circle + name
  const driversH = meta.drivers?.length ? driverSlotH + 16 : 0;

  const gapAbove = 16;
  const gapBelow = 20;
  const footerH = 44;

  const totalW = svgW + padding * 2;
  const totalH = headerH + accentH + driversH + gapAbove + svgH + gapBelow + footerH;

  // --- Driver headshots ---
  let driverSvg = '';
  if (meta.drivers?.length) {
    const dy = headerH + accentH + 12;
    let dx = padding; // left-aligned
    const year = meta.year ? Number(meta.year) : new Date().getFullYear();

    meta.drivers.forEach((d) => {
      const cx = dx + driverSlotW / 2;
      const cy = dy + driverImgSize / 2;
      const hasImg = hasHeadshots && headshotDataUrls![d];
      const teamColor = driverColor(d, year);
      const name = driverLastName(d).toUpperCase();

      if (hasImg) {
        // Circular headshot with team-colored ring
        driverSvg += `
        <defs>
          <clipPath id="clip-${d}"><circle cx="${cx}" cy="${cy}" r="${driverImgSize / 2 - 2}"/></clipPath>
        </defs>
        <circle cx="${cx}" cy="${cy}" r="${driverImgSize / 2}" fill="${teamColor}" opacity="0.3"/>
        <image href="${headshotDataUrls![d]}" x="${cx - driverImgSize / 2 + 2}" y="${dy + 2}" width="${driverImgSize - 4}" height="${driverImgSize - 4}" clip-path="url(#clip-${d})" preserveAspectRatio="xMidYMid slice"/>
        <circle cx="${cx}" cy="${cy}" r="${driverImgSize / 2}" fill="none" stroke="${teamColor}" stroke-width="3"/>`;
      } else {
        // No image — show initial in a team-colored ring
        driverSvg += `
        <circle cx="${cx}" cy="${cy}" r="${driverImgSize / 2}" fill="#0a0a0a" stroke="${teamColor}" stroke-width="3"/>
        <text x="${cx}" y="${cy + 8}" text-anchor="middle" fill="${teamColor}" font-family="${FONT}" font-size="24" font-weight="900">${escapeXml(d.substring(0, 1))}</text>`;
      }

      // Last name below circle
      driverSvg += `
        <text x="${cx}" y="${dy + driverImgSize + 14}" text-anchor="middle" fill="#e5e7eb" font-family="${FONT}" font-size="8" font-weight="800" letter-spacing="1">${escapeXml(name)}</text>`;

      dx += driverSlotW + 10;
    });
  }

  const chartY = headerH + accentH + driversH + gapAbove;
  const footerY = chartY + svgH + gapBelow;

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const innerSvg = new XMLSerializer().serializeToString(chartSvg);
  const viewBoxAttr = viewBox ? `viewBox="${viewBox}"` : `viewBox="0 0 ${svgW} ${svgH}"`;

  // Context line Y
  const contextY = 30;
  // Title Y — below context
  const titleY = contextLine ? contextY + 32 : 38;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
  <rect width="${totalW}" height="${totalH}" fill="#000000"/>

  <!-- Context: year / event / session -->
  ${contextLine ? `<text x="${padding}" y="${contextY}" fill="#6b7280" font-family="${MONO}" font-size="12" font-weight="700" letter-spacing="2">${escapeXml(contextLine)}</text>` : ''}

  <!-- Chart title -->
  <text x="${padding}" y="${titleY}" fill="#ffffff" font-family="${FONT}" font-size="28" font-weight="900" font-style="italic">${escapeXml(meta.title.toUpperCase())}</text>
  ${meta.subtitle ? `<text x="${padding}" y="${titleY + 20}" fill="#9ca3af" font-family="${MONO}" font-size="11">${escapeXml(meta.subtitle)}</text>` : ''}

  <!-- Red accent -->
  <rect y="${headerH}" width="${totalW}" height="${accentH}" fill="#dc2626"/>

  <!-- Driver headshots -->
  ${driverSvg}

  <!-- Chart -->
  <svg x="${padding}" y="${chartY}" width="${svgW}" height="${svgH}" ${viewBoxAttr} overflow="visible">
    ${innerSvg}
  </svg>

  <!-- Footer -->
  <line x1="${padding}" y1="${footerY}" x2="${totalW - padding}" y2="${footerY}" stroke="#1f2937" stroke-width="1"/>
  <text x="${padding}" y="${footerY + 26}" font-family="${FONT}" font-size="14" font-weight="900" font-style="italic" fill="#ffffff">FASTLYTICS</text>
  <text x="${padding + 100}" y="${footerY + 26}" font-family="${FONT}" font-size="14" font-weight="900" fill="#dc2626">//</text>
  <text x="${padding + 120}" y="${footerY + 26}" font-family="${MONO}" font-size="10" fill="#6b7280">fastlytics.app</text>
  <text x="${totalW - padding}" y="${footerY + 26}" text-anchor="end" font-family="${MONO}" font-size="9" fill="#4b5563">${escapeXml(dateStr)}</text>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ---------------------------------------------------------------------------
// Export formats
// ---------------------------------------------------------------------------

async function loadDriverHeadshots(meta: ChartExportMeta): Promise<Record<string, string>> {
  const headshots: Record<string, string> = {};
  if (!meta.drivers?.length) return headshots;
  const year = meta.year ? Number(meta.year) : new Date().getFullYear();
  await Promise.all(
    meta.drivers.map(async (code) => {
      const url = await loadHeadshotDataUrl(code, year);
      if (url) headshots[code] = url;
    })
  );
  return headshots;
}

async function exportAsSvg(container: HTMLDivElement | null, meta: ChartExportMeta) {
  const svg = findChartSvg(container);

  if (!svg) {
    // No SVG chart found — fall back to PNG raster capture of the HTML container
    return exportAsPng(container, meta);
  }

  const [inlined, headshots] = await Promise.all([
    Promise.resolve(cloneAndInlineStyles(svg)),
    loadDriverHeadshots(meta),
  ]);
  const branded = buildBrandedSvg(inlined, meta, headshots);
  download(branded, buildFilename(meta, 'svg'), 'image/svg+xml');
}

async function exportAsPng(container: HTMLDivElement | null, meta: ChartExportMeta) {
  if (!container) throw new Error('No container found');

  const svg = findChartSvg(container);

  if (!svg) {
    // HTML-based view (tables, divs) — rasterize the container directly
    return exportHtmlAsPng(container, meta);
  }

  const [inlined, headshots] = await Promise.all([
    Promise.resolve(cloneAndInlineStyles(svg)),
    loadDriverHeadshots(meta),
  ]);
  const branded = buildBrandedSvg(inlined, meta, headshots);

  // Parse dimensions from the branded SVG
  const parser = new DOMParser();
  const doc = parser.parseFromString(branded, 'image/svg+xml');
  const root = doc.documentElement;
  const w = parseFloat(root.getAttribute('width') || '800');
  const h = parseFloat(root.getAttribute('height') || '400');

  const blob = new Blob([branded], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = w * PNG_SCALE;
    canvas.height = h * PNG_SCALE;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(PNG_SCALE, PNG_SCALE);
    ctx.drawImage(img, 0, 0, w, h);

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    download(dataUrl, buildFilename(meta, 'png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function exportAsCsv(meta: ChartExportMeta, data?: ChartExportData) {
  if (!data || data.rows.length === 0) throw new Error('No data provided for CSV export');

  const header = data.columns.map((c) => `"${c.label}"`).join(',');
  const rows = data.rows.map((row) =>
    data.columns
      .map((c) => {
        const val = row[c.key];
        if (val == null) return '';
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return String(val);
      })
      .join(',')
  );

  const csv = [header, ...rows].join('\n');
  download(csv, buildFilename(meta, 'csv'), 'text/csv');
}

function exportAsJson(meta: ChartExportMeta, data?: ChartExportData) {
  if (!data || data.rows.length === 0) throw new Error('No data provided for JSON export');

  const payload = {
    meta: {
      title: meta.title,
      subtitle: meta.subtitle,
      year: meta.year,
      event: meta.event,
      session: meta.session,
      drivers: meta.drivers,
      exportedAt: new Date().toISOString(),
      source: 'fastlytics.app',
    },
    columns: data.columns,
    data: data.rows,
  };

  const json = JSON.stringify(payload, null, 2);
  download(json, buildFilename(meta, 'json'), 'application/json');
}

async function exportToClipboard(container: HTMLDivElement | null, meta: ChartExportMeta) {
  const svg = findChartSvg(container);
  if (!svg) {
    // For HTML views, fall back to PNG export since SVG clipboard doesn't make sense
    return exportAsPng(container, meta);
  }

  const [inlined, headshots] = await Promise.all([
    Promise.resolve(cloneAndInlineStyles(svg)),
    loadDriverHeadshots(meta),
  ]);
  const branded = buildBrandedSvg(inlined, meta, headshots);
  await navigator.clipboard.writeText(branded);
}

/**
 * Capture an HTML container as a branded PNG by reading DOM positions
 * and drawing directly on canvas. Avoids foreignObject which taints canvases.
 */
async function exportHtmlAsPng(container: HTMLDivElement, meta: ChartExportMeta) {
  const containerRect = container.getBoundingClientRect();
  const contentW = containerRect.width;
  const contentH = containerRect.height;

  const padding = 40;
  const contextParts: string[] = [];
  if (meta.year) contextParts.push(String(meta.year));
  if (meta.event) contextParts.push(meta.event.replace(/-/g, ' ').toUpperCase());
  if (meta.session) contextParts.push(meta.session.toUpperCase());
  const contextLine = contextParts.join('  //  ');
  const headerH = 90;
  const accentH = 3;
  const gapAbove = 12;
  const gapBelow = 20;
  const footerH = 44;
  const totalW = contentW + padding * 2;
  const totalH = headerH + accentH + gapAbove + contentH + gapBelow + footerH;

  const canvas = document.createElement('canvas');
  canvas.width = totalW * PNG_SCALE;
  canvas.height = totalH * PNG_SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(PNG_SCALE, PNG_SCALE);

  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, totalW, totalH);

  // Context line
  if (contextLine) {
    ctx.font = `700 12px ${MONO}`;
    ctx.fillStyle = '#6b7280';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(contextLine, padding, 30);
  }

  // Title
  ctx.font = `italic 900 28px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(meta.title.toUpperCase(), padding, contextLine ? 62 : 38);

  // Subtitle
  if (meta.subtitle) {
    ctx.font = `400 11px ${MONO}`;
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(meta.subtitle, padding, contextLine ? 80 : 56);
  }

  // Red accent
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, headerH, totalW, accentH);

  // Pre-load all <img> elements so they can be drawn onto canvas
  const imgElements = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
  const imageMap = new Map<string, HTMLImageElement>();
  await Promise.all(
    imgElements.map(async (imgEl) => {
      try {
        // If already decoded, use as-is; otherwise wait for load
        if (imgEl.complete && imgEl.naturalWidth > 0) {
          imageMap.set(imgEl.src, imgEl);
        } else {
          const loaded = await loadImage(imgEl.src);
          imageMap.set(imgEl.src, loaded);
        }
      } catch {
        // skip broken images
      }
    })
  );

  // Render DOM content onto canvas
  const contentX = padding;
  const contentY = headerH + accentH + gapAbove;
  renderDomToCanvas(ctx, container, containerRect, contentX, contentY, imageMap);

  // Footer
  const footerY = totalH - footerH;
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, footerY);
  ctx.lineTo(totalW - padding, footerY);
  ctx.stroke();

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `italic 900 14px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('FASTLYTICS', padding, footerY + 26);
  ctx.fillStyle = '#dc2626';
  ctx.fillText('//', padding + 100, footerY + 26);
  ctx.font = `400 10px ${MONO}`;
  ctx.fillStyle = '#6b7280';
  ctx.fillText('fastlytics.app', padding + 120, footerY + 26);

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  ctx.font = `400 9px ${MONO}`;
  ctx.fillStyle = '#4b5563';
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, totalW - padding, footerY + 26);
  ctx.textAlign = 'left';

  const dataUrl = canvas.toDataURL('image/png', 1.0);
  download(dataUrl, buildFilename(meta, 'png'));
}

/**
 * Draw an image replicating CSS `object-fit: cover; object-position: top center`.
 * Scales to fill dw×dh while maintaining aspect ratio, anchored to the top.
 */
function drawObjectCoverTop(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const scale = Math.max(dw / img.naturalWidth, dh / img.naturalHeight);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (img.naturalWidth - sw) / 2; // horizontally centered
  const sy = 0; // anchored to top
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/** Walk the live DOM tree and paint backgrounds, borders, and text onto canvas. */
function renderDomToCanvas(
  ctx: CanvasRenderingContext2D,
  container: Element,
  containerRect: DOMRect,
  offsetX: number,
  offsetY: number,
  imageMap?: Map<string, HTMLImageElement>
) {
  const elements = container.querySelectorAll('*');

  // Pass 1 — backgrounds and borders
  elements.forEach((el) => {
    const elRect = el.getBoundingClientRect();
    if (elRect.width === 0 || elRect.height === 0) return;

    const computed = window.getComputedStyle(el);
    if (computed.display === 'none' || computed.visibility === 'hidden') return;

    // Skip export menu & tabs bar
    if (el.closest('[data-export-menu]') || el.closest('[data-export-ignore]')) return;

    const x = elRect.left - containerRect.left + offsetX;
    const y = elRect.top - containerRect.top + offsetY;
    const w = elRect.width;
    const h = elRect.height;

    // Background color
    const bg = computed.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      ctx.fillStyle = bg;
      const radius = parseFloat(computed.borderRadius) || 0;
      if (radius > 0) {
        drawRoundRect(ctx, x, y, w, h, Math.min(radius, w / 2, h / 2));
        ctx.fill();
      } else {
        ctx.fillRect(x, y, w, h);
      }
    }

    // Borders
    const sides: [string, number, number, number, number][] = [
      ['top', x, y, x + w, y],
      ['bottom', x, y + h, x + w, y + h],
      ['left', x, y, x, y + h],
      ['right', x + w, y, x + w, y + h],
    ];
    for (const [side, x1, y1, x2, y2] of sides) {
      const bw = parseFloat(computed.getPropertyValue(`border-${side}-width`));
      const bc = computed.getPropertyValue(`border-${side}-color`);
      const bs = computed.getPropertyValue(`border-${side}-style`);
      if (bw > 0 && bs !== 'none' && bc && bc !== 'rgba(0, 0, 0, 0)') {
        ctx.strokeStyle = bc;
        ctx.lineWidth = bw;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  });

  // Pass 2 — text
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let textNode: Node | null;
  while ((textNode = walker.nextNode())) {
    const text = textNode.textContent?.trim();
    if (!text) continue;

    const parent = textNode.parentElement;
    if (!parent) continue;

    const computed = window.getComputedStyle(parent);
    if (computed.display === 'none' || computed.visibility === 'hidden') continue;

    // Skip export menu & tabs bar
    if (parent.closest('[data-export-menu]') || parent.closest('[data-export-ignore]')) continue;

    const range = document.createRange();
    range.selectNode(textNode);
    const rects = range.getClientRects();

    const fontSize = parseFloat(computed.fontSize) || 12;
    ctx.font = `${computed.fontStyle} ${computed.fontWeight} ${fontSize}px ${computed.fontFamily}`;
    ctx.fillStyle = computed.color;
    ctx.textBaseline = 'top';

    // Use only the first rect to avoid duplicating text when lines wrap
    if (rects.length > 0) {
      const r = rects[0];
      if (r.width > 0 && r.height > 0) {
        const tx = r.left - containerRect.left + offsetX;
        const ty = r.top - containerRect.top + offsetY;
        ctx.textAlign = 'left';
        ctx.fillText(text, tx, ty);
      }
    }
    range.detach();
  }

  // Pass 3 — images
  if (imageMap && imageMap.size > 0) {
    const imgEls = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
    imgEls.forEach((imgEl) => {
      const loaded = imageMap.get(imgEl.src);
      if (!loaded) return;

      const computed = window.getComputedStyle(imgEl);
      if (computed.display === 'none' || computed.visibility === 'hidden') return;
      if (imgEl.closest('[data-export-menu]') || imgEl.closest('[data-export-ignore]')) return;

      const imgRect = imgEl.getBoundingClientRect();
      if (imgRect.width === 0 || imgRect.height === 0) return;

      const ix = imgRect.left - containerRect.left + offsetX;
      const iy = imgRect.top - containerRect.top + offsetY;
      const iw = imgRect.width;
      const ih = imgRect.height;

      // Check parent for overflow:hidden + border-radius (circular clip from rounded-full)
      const parentEl = imgEl.parentElement;
      if (parentEl) {
        const parentStyle = window.getComputedStyle(parentEl);
        const overflow = parentStyle.overflow;
        const radius = parseFloat(parentStyle.borderRadius) || 0;
        if (overflow === 'hidden' && radius > 0) {
          const parentRect = parentEl.getBoundingClientRect();
          const px = parentRect.left - containerRect.left + offsetX;
          const py = parentRect.top - containerRect.top + offsetY;
          const pw = parentRect.width;
          const ph = parentRect.height;
          ctx.save();
          drawRoundRect(ctx, px, py, pw, ph, Math.min(radius, pw / 2, ph / 2));
          ctx.clip();
          drawObjectCoverTop(ctx, loaded, ix, iy, iw, ih);
          ctx.restore();
          return;
        }
      }

      drawObjectCoverTop(ctx, loaded, ix, iy, iw, ih);
    });
  }
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildFilename(meta: ChartExportMeta, ext: string): string {
  return [
    'fastlytics',
    meta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    meta.year,
    meta.event?.replace(/\s+/g, '-').toLowerCase(),
    meta.session?.toLowerCase(),
  ]
    .filter(Boolean)
    .join('_')
    .concat(`.${ext}`);
}

function download(content: string, filename: string, mime?: string) {
  const isDataUrl = content.startsWith('data:');
  const href = isDataUrl ? content : URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.download = filename;
  a.href = href;
  a.click();
  if (!isDataUrl) URL.revokeObjectURL(href);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
