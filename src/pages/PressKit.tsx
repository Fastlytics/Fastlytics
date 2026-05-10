// knip-ignore
import React from 'react';
import { m } from 'motion/react';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingSections';
import { Button } from '@/components/ui/button';
import { Download01Icon, Copy01Icon, Tick01Icon } from 'hugeicons-react';
import { SEO } from '@/components/layout/SEO';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;

const pngAssets = [
  {
    name: 'Full Logo - Dark Mode (PNG)',
    filename: 'logo-dark-high-res.png',
    description:
      'High-resolution raster full logo with transparent background for dark backgrounds.',
    bg: 'dark' as const,
    width: 510,
    height: 110,
  },
  {
    name: 'Full Logo - Light Mode (PNG)',
    filename: 'logo-light-high-res.png',
    description:
      'High-resolution raster full logo with transparent background for light backgrounds.',
    bg: 'light' as const,
    width: 510,
    height: 110,
  },
  {
    name: 'Icon Only - Dark Mode (PNG)',
    filename: 'icon-dark-high-res.png',
    description: 'High-resolution raster icon with transparent background for dark backgrounds.',
    bg: 'dark' as const,
    width: 145,
    height: 105,
  },
  {
    name: 'Icon Only - Light Mode (PNG)',
    filename: 'icon-light-high-res.png',
    description: 'High-resolution raster icon with transparent background for light backgrounds.',
    bg: 'light' as const,
    width: 145,
    height: 105,
  },
];

const LogoCard = ({
  asset,
  isCopied,
  onCopy,
}: {
  asset: LogoAsset;
  isCopied: boolean;
  onCopy: (filename: string) => void;
}) => {
  const bgClass = asset.bg === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#f5f5f5]';
  const borderClass = asset.bg === 'dark' ? 'border-white/[0.06]' : 'border-zinc-300';

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5 transition-colors hover:border-white/[0.1] flex flex-col">
      <div
        className={`${bgClass} border ${borderClass} p-5 flex items-center justify-center h-36 mb-4 rounded-lg`}
      >
        <img
          src={`/brand/${asset.filename}`}
          alt={asset.name}
          className="max-h-full max-w-full object-contain"
          style={{ maxWidth: asset.width > 500 ? '90%' : asset.width > 200 ? '60%' : '45%' }}
        />
      </div>

      <h3 className="text-[15px] font-semibold text-white mb-1.5">{asset.name}</h3>
      <p className="text-[13px] text-white/35 mb-4 flex-grow">{asset.description}</p>

      <div className="flex gap-2 mt-auto">
        <a href={`/brand/${asset.filename}`} download>
          <Button
            variant="outline"
            size="sm"
            className="border-white/[0.08] bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white gap-1.5 text-[12px]"
          >
            <Download01Icon className="size-3.5" />
            SVG
          </Button>
        </a>
        <Button
          variant="outline"
          size="sm"
          className="border-white/[0.08] bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white gap-1.5 text-[12px]"
          onClick={() => onCopy(asset.filename)}
        >
          {isCopied ? (
            <>
              <Tick01Icon className="size-3.5 text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <Copy01Icon className="size-3.5" />
              Copy SVG
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

const PressKit = () => {
  const copiedFileRef = React.useRef<string | null>(null);

  const handleCopy = async (filename: string) => {
    try {
      const res = await fetch(`/brand/${filename}`);
      const svgText = await res.text();
      await navigator.clipboard.writeText(svgText);
      copiedFileRef.current = filename;
      setTimeout(() => {
        copiedFileRef.current = null;
      }, 2000);
    } catch {
      window.open(`/brand/${filename}`, '_blank');
    }
  };

  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30"
    >
      <SEO
        title="Press Kit"
        description="Download the Fastlytics logo in multiple formats - full logo and icon only, light/dark mode variants. Free to use for media and partners."
        keywords={['fastlytics logo', 'press kit', 'brand assets', 'f1 analytics brand']}
      />
      <LandingNavbar />

      <main className="pt-28 pb-20 px-5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
              Brand
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
              Press Kit
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/40">
              Official Fastlytics brand assets. Download logos for use in media coverage, partner
              integrations, and promotional materials.
            </p>
          </m.div>

          {/* Primary PNG Logos */}
          <m.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-[18px] font-semibold text-white mb-2">High-Resolution PNGs</h2>
            <p className="text-[14px] text-white/35 mb-6">
              Transparent, high-resolution PNGs generated programmatically. Ideal for print or media
              features.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              {pngAssets.map((asset) => {
                const bgClass = asset.bg === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#f5f5f5]';
                const borderClass = asset.bg === 'dark' ? 'border-white/[0.06]' : 'border-zinc-300';

                return (
                  <div
                    key={asset.filename}
                    className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5 transition-colors hover:border-white/[0.1] flex flex-col"
                  >
                    <div
                      className={`${bgClass} border ${borderClass} p-5 flex items-center justify-center h-36 mb-4 rounded-lg`}
                    >
                      <img
                        src={`/brand/${asset.filename}`}
                        alt={asset.name}
                        className="max-h-full max-w-full object-contain"
                        style={{
                          maxWidth: asset.width > 500 ? '90%' : asset.width > 200 ? '60%' : '45%',
                        }}
                      />
                    </div>

                    <h3 className="text-[15px] font-semibold text-white mb-1.5">{asset.name}</h3>
                    <p className="text-[13px] text-white/35 mb-4 flex-grow">{asset.description}</p>

                    <div className="flex gap-2 mt-auto">
                      <a href={`/brand/${asset.filename}`} download>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/[0.08] bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white gap-1.5 text-[12px]"
                        >
                          <Download01Icon className="size-3.5" />
                          PNG
                        </Button>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </m.section>

          {/* Usage Guidelines */}
          <m.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-[18px] font-semibold text-white mb-6">Usage Guidelines</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6">
                <h3 className="text-[14px] font-semibold text-emerald-400 mb-4">Do</h3>
                <ul className="space-y-3 text-[13px] text-white/40">
                  <li className="flex items-start gap-2.5">
                    <Tick01Icon className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span>
                      Use the light-mode logo on dark backgrounds and the dark-mode logo on light
                      backgrounds.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Tick01Icon className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span>
                      Maintain clear space around the logo equal to the height of the icon.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Tick01Icon className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span>Scale the logo proportionally - never stretch or squash it.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Tick01Icon className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span>
                      Link the logo back to{' '}
                      <a
                        href="https://fastlytics.app"
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        fastlytics.app
                      </a>{' '}
                      when used on the web.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6">
                <h3 className="text-[14px] font-semibold text-red-400 mb-4">Don't</h3>
                <ul className="space-y-3 text-[13px] text-white/40">
                  <li className="flex items-start gap-2.5">
                    <span className="size-4 flex items-center justify-center text-red-400 mt-0.5 shrink-0 text-[13px] font-bold">
                      ✕
                    </span>
                    <span>Change the logo colors or modify the red (#ff2a1a) accent.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="size-4 flex items-center justify-center text-red-400 mt-0.5 shrink-0 text-[13px] font-bold">
                      ✕
                    </span>
                    <span>Rotate, skew, or apply effects to the logo.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="size-4 flex items-center justify-center text-red-400 mt-0.5 shrink-0 text-[13px] font-bold">
                      ✕
                    </span>
                    <span>Use the Fastlytics logo to imply endorsement without permission.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="size-4 flex items-center justify-center text-red-400 mt-0.5 shrink-0 text-[13px] font-bold">
                      ✕
                    </span>
                    <span>Use the logo as your own brand identity or in a confusing manner.</span>
                  </li>
                </ul>
              </div>
            </div>
          </m.section>

          {/* Download All */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8 text-center"
          >
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <FastlyticsLogo size={24} />
              <span className="text-[15px] font-bold italic tracking-[-0.02em] text-white">
                FASTLYTICS
              </span>
            </div>
            <p className="text-[14px] text-white/35 mb-6 max-w-lg mx-auto">
              All logo variants are available under{' '}
              <code className="bg-white/[0.04] px-1.5 py-0.5 rounded text-[12px] font-mono text-white/50">
                /brand/
              </code>{' '}
              on the Fastlytics CDN. Use the download buttons above or hotlink directly.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {[...pngAssets].map((asset) => (
                <a key={asset.filename} href={`/brand/${asset.filename}`} download>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/[0.08] bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white gap-1.5 text-[12px]"
                  >
                    <Download01Icon className="size-3.5" />
                    {asset.filename}
                  </Button>
                </a>
              ))}
            </div>
          </m.div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default PressKit;
