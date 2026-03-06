import { useRef, useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import { getDriverImage } from '@/utils/imageMapping';

export interface ChartExportMeta {
  title: string;
  subtitle?: string;
  year?: number | string;
  event?: string;
  session?: string;
  drivers?: string[];
  extra?: Record<string, string>;
}

const SCALE = 4; // 4x resolution for crisp text and lines
const PADDING = 40 * SCALE;
const FONT = 'Geist, system-ui, -apple-system, sans-serif';
const MONO = 'Geist Mono, monospace';

/**
 * Hook that provides chart export functionality.
 *
 * Captures the live chart DOM via html-to-image, then composites
 * it onto a Canvas with branded header, metadata, and footer.
 * This avoids cloning issues with Recharts SVGs.
 */
export function useChartExport() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportChart = useCallback(async (meta: ChartExportMeta) => {
    const node = chartRef.current;
    if (!node) return;

    setIsExporting(true);

    try {
      // Step 1: Capture the live chart node directly (no cloning)
      const chartDataUrl = await toPng(node, {
        pixelRatio: SCALE,
        backgroundColor: '#000000',
        cacheBust: true,
        filter: (domNode: HTMLElement) => {
          // Filter out interactive elements from the capture
          if (domNode instanceof Element) {
            const tag = domNode.tagName?.toLowerCase();
            if (tag === 'button' || tag === 'select') return false;
            if (domNode.getAttribute('role') === 'combobox') return false;
            if (domNode.classList?.contains('recharts-brush')) return false;
          }
          return true;
        },
      });

      // Step 2: Load the captured chart as an Image
      const chartImg = await loadImage(chartDataUrl);

      // Step 2.5: Load driver images
      const driverImages: Record<string, HTMLImageElement> = {};
      const targetYear = meta.year ? Number(meta.year) : new Date().getFullYear();
      if (meta.drivers && meta.drivers.length > 0) {
        await Promise.all(
          meta.drivers.map(async (driverCode) => {
            try {
              const src = getDriverImage(driverCode, targetYear);
              if (src) {
                // If it's a relative path starting with /, it should resolve correctly.
                const img = await loadImage(src);
                driverImages[driverCode] = img;
              }
            } catch (e) {
              // ignore missing images
            }
          })
        );
      }

      // Step 3: Compute canvas layout
      const chartW = chartImg.width;
      const chartH = chartImg.height;
      const canvasW = chartW + PADDING * 2;

      // Measure vertical sections
      const headerH = 100 * SCALE;
      const redLineH = 3 * SCALE;
      const badgesH = meta.year || meta.event || meta.session ? 44 * SCALE : 0;
      const driversH = meta.drivers && meta.drivers.length > 0 ? 40 * SCALE : 0;
      const extraH = meta.extra && Object.keys(meta.extra).length > 0 ? 36 * SCALE : 0;
      const chartPadTop = 24 * SCALE;
      const chartPadBot = 24 * SCALE;
      const footerH = 56 * SCALE;

      const canvasH =
        headerH +
        redLineH +
        badgesH +
        driversH +
        extraH +
        chartPadTop +
        chartH +
        chartPadBot +
        footerH;

      // Step 4: Create canvas and draw everything
      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d')!;

      // Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvasW, canvasH);

      let y = 0;

      // --- HEADER ---
      y += 36 * SCALE; // top padding

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = `italic 900 ${28 * SCALE}px ${FONT}`;
      ctx.textBaseline = 'top';
      ctx.fillText(meta.title.toUpperCase(), PADDING, y);

      // Badges on the right
      const badges: string[] = [];
      if (meta.year) badges.push(String(meta.year));
      if (meta.event) badges.push(meta.event.replace(/-/g, ' '));
      if (meta.session) badges.push(meta.session);

      if (badges.length > 0) {
        ctx.font = `700 ${11 * SCALE}px ${MONO}`;
        let badgeX = canvasW - PADDING;
        for (let i = badges.length - 1; i >= 0; i--) {
          const text = badges[i].toUpperCase();
          const tw = ctx.measureText(text).width;
          const bw = tw + 20 * SCALE;
          const bh = 26 * SCALE;
          const bx = badgeX - bw;
          const by = y + 4 * SCALE;

          ctx.strokeStyle = '#374151';
          ctx.lineWidth = SCALE;
          ctx.strokeRect(bx, by, bw, bh);
          ctx.fillStyle = '#111827';
          ctx.fillRect(bx + 1, by + 1, bw - 2, bh - 2);
          ctx.fillStyle = '#d1d5db';
          ctx.fillText(text, bx + 10 * SCALE, by + 7 * SCALE);

          badgeX = bx - 8 * SCALE;
        }
      }

      // Subtitle
      if (meta.subtitle) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = `400 ${13 * SCALE}px ${MONO}`;
        ctx.fillText(meta.subtitle, PADDING, y + 38 * SCALE);
      }

      y = headerH;

      // Red accent line
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, y, canvasW, redLineH);
      y += redLineH;

      // --- DRIVERS BAR ---
      if (meta.drivers && meta.drivers.length > 0) {
        y += 10 * SCALE;
        ctx.font = `700 ${10 * SCALE}px ${MONO}`;
        ctx.fillStyle = '#6b7280';
        ctx.fillText('DRIVERS', PADDING, y + 6 * SCALE); // Adjusted vertical alignment

        let dx = PADDING + ctx.measureText('DRIVERS').width + 16 * SCALE;
        ctx.font = `700 ${12 * SCALE}px ${MONO}`;

        meta.drivers.forEach((driver) => {
          const tw = ctx.measureText(driver).width;
          const pw = 8 * SCALE;
          const img = driverImages[driver];
          const imgSize = img ? 20 * SCALE : 0;
          const imgGap = img ? 6 * SCALE : 0;

          const chipW = tw + pw * 2 + imgSize + imgGap;

          // Chip background
          ctx.fillStyle = '#1f2937';
          // Make chip taller if there is an image
          const chipH = img ? 26 * SCALE : 22 * SCALE;
          const chipY = img ? y - 4 * SCALE : y - 2 * SCALE;

          ctx.fillRect(dx - pw, chipY, chipW, chipH);

          if (img) {
            // Draw image slightly inset
            ctx.drawImage(img, dx - pw + 4 * SCALE, y - 1 * SCALE, imgSize, imgSize);
            ctx.fillStyle = '#e5e7eb';
            ctx.fillText(driver, dx + imgSize + imgGap - 2 * SCALE, y + 3 * SCALE);
          } else {
            ctx.fillStyle = '#e5e7eb';
            ctx.fillText(driver, dx, y + 1 * SCALE);
          }

          dx += chipW + 8 * SCALE;
        });

        y += driversH - 10 * SCALE;
      }

      // --- EXTRA METADATA ---
      if (meta.extra && Object.keys(meta.extra).length > 0) {
        y += 8 * SCALE;
        let ex = PADDING;

        Object.entries(meta.extra).forEach(([key, value]) => {
          ctx.font = `700 ${10 * SCALE}px ${MONO}`;
          ctx.fillStyle = '#6b7280';
          ctx.fillText(key.toUpperCase(), ex, y);
          const kw = ctx.measureText(key.toUpperCase()).width;

          ctx.font = `600 ${12 * SCALE}px ${MONO}`;
          ctx.fillStyle = '#e5e7eb';
          ctx.fillText(value, ex + kw + 6 * SCALE, y);
          const vw = ctx.measureText(value).width;

          ex += kw + vw + 30 * SCALE;
        });

        y += extraH - 8 * SCALE;
      }

      // --- CHART IMAGE ---
      y += chartPadTop;
      const chartX = Math.round((canvasW - chartW) / 2);
      ctx.drawImage(chartImg, chartX, y);
      y += chartH + chartPadBot;

      // --- FOOTER ---
      // Top border
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = SCALE;
      ctx.beginPath();
      ctx.moveTo(PADDING, y);
      ctx.lineTo(canvasW - PADDING, y);
      ctx.stroke();

      y += 16 * SCALE;

      // Brand
      ctx.fillStyle = '#ffffff';
      ctx.font = `italic 900 ${16 * SCALE}px ${FONT}`;
      ctx.fillText('FASTLYTICS', PADDING, y);
      const brandW = ctx.measureText('FASTLYTICS').width;

      ctx.fillStyle = '#dc2626';
      ctx.font = `900 ${16 * SCALE}px ${FONT}`;
      ctx.fillText(' //', PADDING + brandW, y);
      const slashW = ctx.measureText(' //').width;

      ctx.fillStyle = '#6b7280';
      ctx.font = `400 ${11 * SCALE}px ${MONO}`;
      ctx.fillText(' fastlytics.app', PADDING + brandW + slashW, y + 3 * SCALE);

      // Timestamp on right
      const dateStr = `Generated ${new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`;
      ctx.fillStyle = '#4b5563';
      ctx.font = `400 ${10 * SCALE}px ${MONO}`;
      const dateW = ctx.measureText(dateStr).width;
      ctx.fillText(dateStr, canvasW - PADDING - dateW, y + 3 * SCALE);

      // Step 5: Export canvas as PNG and trigger download
      const finalDataUrl = canvas.toDataURL('image/png', 1.0);

      const filename = [
        'fastlytics',
        meta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        meta.year,
        meta.event?.replace(/\s+/g, '-').toLowerCase(),
        meta.session?.toLowerCase(),
      ]
        .filter(Boolean)
        .join('_');

      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = finalDataUrl;
      link.click();
    } catch (err) {
      console.error('Chart export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { chartRef, exportChart, isExporting };
}

/** Load a data URL string as an HTMLImageElement */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
