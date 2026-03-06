import { useRef, useCallback, useState } from 'react';
import { getDriverImage } from '@/utils/imageMapping';

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
  for (const svg of allSvgs) {
    const rect = svg.getBoundingClientRect();
    const area = rect.width * rect.height;
    if (area > bestArea) {
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
  const headerH = 70;
  const accentH = 3;
  const badgesH = meta.year || meta.event || meta.session ? 32 : 0;
  const driversH = meta.drivers?.length ? (hasHeadshots ? 68 : 28) : 0;
  const gapAbove = 16;
  const gapBelow = 16;
  const footerH = 40;

  const totalW = svgW + padding * 2;
  const totalH = headerH + accentH + badgesH + driversH + gapAbove + svgH + gapBelow + footerH;

  // Build badge markup
  const badges: string[] = [];
  if (meta.year) badges.push(String(meta.year));
  if (meta.event) badges.push(meta.event.replace(/-/g, ' '));
  if (meta.session) badges.push(meta.session);

  let badgeSvg = '';
  if (badges.length > 0) {
    const badgeY = headerH + accentH + 10;
    let x = totalW - padding;
    for (let i = badges.length - 1; i >= 0; i--) {
      const text = badges[i].toUpperCase();
      const estW = text.length * 8 + 16;
      x -= estW;
      badgeSvg += `
        <rect x="${x}" y="${badgeY}" width="${estW}" height="20" rx="2" fill="#111827" stroke="#374151" stroke-width="1"/>
        <text x="${x + estW / 2}" y="${badgeY + 14}" text-anchor="middle" fill="#d1d5db" font-family="${MONO}" font-size="9" font-weight="700">${escapeXml(text)}</text>`;
      x -= 6;
    }
  }

  // Driver chips with optional headshot images
  let driverSvg = '';
  if (meta.drivers?.length) {
    const dy = headerH + accentH + badgesH + 6;
    const chipH = hasHeadshots ? 56 : 18;
    const imgSize = 48;
    let dx = padding;
    driverSvg += `<text x="${dx}" y="${dy + (hasHeadshots ? 32 : 12)}" fill="#6b7280" font-family="${MONO}" font-size="8" font-weight="700">DRIVERS</text>`;
    dx += 56;
    meta.drivers.forEach((d) => {
      const hasImg = hasHeadshots && headshotDataUrls![d];
      const imgW = hasImg ? imgSize + 8 : 0;
      const tw = d.length * 8 + 16 + imgW;
      driverSvg += `
        <rect x="${dx}" y="${dy}" width="${tw}" height="${chipH}" rx="4" fill="#1f2937"/>`;
      if (hasImg) {
        driverSvg += `
        <clipPath id="clip-${d}"><circle cx="${dx + 6 + imgSize / 2}" cy="${dy + chipH / 2}" r="${imgSize / 2}"/></clipPath>
        <image href="${headshotDataUrls![d]}" x="${dx + 6}" y="${dy + (chipH - imgSize) / 2}" width="${imgSize}" height="${imgSize}" clip-path="url(#clip-${d})" preserveAspectRatio="xMidYMid slice"/>`;
      }
      driverSvg += `
        <text x="${dx + imgW + (tw - imgW) / 2}" y="${dy + chipH / 2 + 5}" text-anchor="middle" fill="#e5e7eb" font-family="${MONO}" font-size="12" font-weight="700">${escapeXml(d)}</text>`;
      dx += tw + 8;
    });
  }

  const chartY = headerH + accentH + badgesH + driversH + gapAbove;
  const footerY = chartY + svgH + gapBelow;

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const innerSvg = new XMLSerializer().serializeToString(chartSvg);
  const viewBoxAttr = viewBox ? `viewBox="${viewBox}"` : `viewBox="0 0 ${svgW} ${svgH}"`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
  <rect width="${totalW}" height="${totalH}" fill="#000000"/>

  <!-- Title -->
  <text x="${padding}" y="42" fill="#ffffff" font-family="${FONT}" font-size="22" font-weight="900" font-style="italic">${escapeXml(meta.title.toUpperCase())}</text>
  ${meta.subtitle ? `<text x="${padding}" y="60" fill="#9ca3af" font-family="${MONO}" font-size="11">${escapeXml(meta.subtitle)}</text>` : ''}

  <!-- Red accent -->
  <rect y="${headerH}" width="${totalW}" height="${accentH}" fill="#dc2626"/>

  <!-- Badges -->
  ${badgeSvg}

  <!-- Drivers -->
  ${driverSvg}

  <!-- Chart -->
  <svg x="${padding}" y="${chartY}" width="${svgW}" height="${svgH}" ${viewBoxAttr}>
    ${innerSvg}
  </svg>

  <!-- Footer -->
  <line x1="${padding}" y1="${footerY}" x2="${totalW - padding}" y2="${footerY}" stroke="#1f2937" stroke-width="1"/>
  <text x="${padding}" y="${footerY + 22}" font-family="${FONT}" font-size="13" font-weight="900" font-style="italic" fill="#ffffff">FASTLYTICS</text>
  <text x="${padding + 95}" y="${footerY + 22}" font-family="${FONT}" font-size="13" font-weight="900" fill="#dc2626">//</text>
  <text x="${padding + 115}" y="${footerY + 22}" font-family="${MONO}" font-size="9" fill="#6b7280">fastlytics.app</text>
  <text x="${totalW - padding}" y="${footerY + 22}" text-anchor="end" font-family="${MONO}" font-size="8" fill="#4b5563">Generated ${escapeXml(dateStr)}</text>
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
  if (!svg) throw new Error('No chart SVG found');

  const [inlined, headshots] = await Promise.all([
    Promise.resolve(cloneAndInlineStyles(svg)),
    loadDriverHeadshots(meta),
  ]);
  const branded = buildBrandedSvg(inlined, meta, headshots);
  download(branded, buildFilename(meta, 'svg'), 'image/svg+xml');
}

async function exportAsPng(container: HTMLDivElement | null, meta: ChartExportMeta) {
  const svg = findChartSvg(container);
  if (!svg) throw new Error('No chart SVG found');

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
  if (!svg) throw new Error('No chart SVG found');

  const [inlined, headshots] = await Promise.all([
    Promise.resolve(cloneAndInlineStyles(svg)),
    loadDriverHeadshots(meta),
  ]);
  const branded = buildBrandedSvg(inlined, meta, headshots);
  await navigator.clipboard.writeText(branded);
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
