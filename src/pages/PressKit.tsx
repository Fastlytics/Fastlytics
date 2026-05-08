import React from 'react';
import { motion } from 'motion/react';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { Button } from '@/components/ui/button';
import { Download01Icon, Copy01Icon, Tick01Icon } from 'hugeicons-react';
import { SEO } from '@/components/layout/SEO';

interface LogoAsset {
  name: string;
  filename: string;
  description: string;
  bg: 'dark' | 'light';
  width: number;
  height: number;
}

const primaryLogos: LogoAsset[] = [
  {
    name: 'Full Logo — Light Mode',
    filename: 'logo-light.svg',
    description: 'Primary logo with icon and wordmark. For use on dark backgrounds.',
    bg: 'dark',
    width: 510,
    height: 110,
  },
  {
    name: 'Full Logo — Dark Mode',
    filename: 'logo-dark.svg',
    description: 'Primary logo with icon and wordmark. For use on light backgrounds.',
    bg: 'light',
    width: 510,
    height: 110,
  },
];

const iconLogos: LogoAsset[] = [
  {
    name: 'Icon Only — Light Mode',
    filename: 'icon-light.svg',
    description: 'Brand icon without text. For use on dark backgrounds or as favicon/app icon.',
    bg: 'dark',
    width: 145,
    height: 105,
  },
  {
    name: 'Icon Only — Dark Mode',
    filename: 'icon-dark.svg',
    description: 'Brand icon without text. For use on light backgrounds.',
    bg: 'light',
    width: 145,
    height: 105,
  },
];

const wordmarkLogos: LogoAsset[] = [
  {
    name: 'Wordmark — Light Mode',
    filename: 'wordmark-light.svg',
    description: 'FASTLYTICS wordmark without icon. For use on dark backgrounds.',
    bg: 'dark',
    width: 300,
    height: 60,
  },
  {
    name: 'Wordmark — Dark Mode',
    filename: 'wordmark-dark.svg',
    description: 'FASTLYTICS wordmark without icon. For use on light backgrounds.',
    bg: 'light',
    width: 300,
    height: 60,
  },
];

const animatedLogos: LogoAsset[] = [
  {
    name: 'Animated Logo — Light Mode',
    filename: 'logo-animated.svg',
    description:
      'Animated logo with pulsing racing bars. Renders with CSS animation — best viewed in a browser.',
    bg: 'dark',
    width: 510,
    height: 110,
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
  const borderClass = asset.bg === 'dark' ? 'border-zinc-800' : 'border-zinc-300';
  const textClass = asset.bg === 'dark' ? 'text-white' : 'text-black';

  return (
    <div
      className={`bg-zinc-900/50 border border-zinc-800 p-6 hover:border-red-600/50 transition-colors group h-full flex flex-col`}
    >
      <div
        className={`${bgClass} border ${borderClass} p-6 flex items-center justify-center h-40 mb-5`}
      >
        <img
          src={`/brand/${asset.filename}`}
          alt={asset.name}
          className="max-h-full max-w-full object-contain"
          style={{ maxWidth: asset.width > 500 ? '90%' : asset.width > 200 ? '60%' : '45%' }}
        />
      </div>

      <h3 className={`text-lg font-black uppercase italic mb-2 ${textClass}`}>{asset.name}</h3>
      <p className="text-sm text-gray-400 mb-4 flex-grow">{asset.description}</p>

      <div className="flex gap-2 mt-auto">
        <a href={`/brand/${asset.filename}`} download>
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 text-white hover:bg-zinc-800 hover:text-white gap-1.5"
          >
            <Download01Icon className="w-3.5 h-3.5" />
            SVG
          </Button>
        </a>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-700 text-white hover:bg-zinc-800 hover:text-white gap-1.5"
          onClick={() => onCopy(asset.filename)}
        >
          {isCopied ? (
            <>
              <Tick01Icon className="w-3.5 h-3.5 text-green-400" />
              Copied
            </>
          ) : (
            <>
              <Copy01Icon className="w-3.5 h-3.5" />
              Copy SVG
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

const PressKit = () => {
  const [copiedFile, setCopiedFile] = React.useState<string | null>(null);

  const handleCopy = async (filename: string) => {
    try {
      const res = await fetch(`/brand/${filename}`);
      const svgText = await res.text();
      await navigator.clipboard.writeText(svgText);
      setCopiedFile(filename);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch {
      // fallback: open in new tab
      window.open(`/brand/${filename}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white overflow-x-hidden">
      <SEO
        title="Press Kit"
        description="Download the Fastlytics logo in multiple formats — full logo, icon only, wordmark, light/dark mode, and animated variants. Free to use for media and partners."
        keywords={['fastlytics logo', 'press kit', 'brand assets', 'f1 analytics brand']}
      />

      <LandingNavbar />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-6">
            Press <span className="text-red-600">Kit</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            Official Fastlytics brand assets. Download logos for use in media coverage, partner
            integrations, and promotional materials.
          </p>
        </motion.div>

        {/* Primary Logo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-black uppercase italic mb-3">
            Primary <span className="text-red-600">Logo</span>
          </h2>
          <p className="text-gray-400 mb-8">
            The full Fastlytics logo with icon and wordmark. Use this as the default logo in most
            contexts.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {primaryLogos.map((asset) => (
              <LogoCard
                key={asset.filename}
                asset={asset}
                isCopied={copiedFile === asset.filename}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </motion.section>

        {/* Icon Only */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-black uppercase italic mb-3">
            Icon <span className="text-red-600">Only</span>
          </h2>
          <p className="text-gray-400 mb-8">
            The isolated brand mark without the wordmark. Ideal for favicons, app icons, and compact
            spaces.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {iconLogos.map((asset) => (
              <LogoCard
                key={asset.filename}
                asset={asset}
                isCopied={copiedFile === asset.filename}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </motion.section>

        {/* Wordmark */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-black uppercase italic mb-3">
            Word<span className="text-red-600">mark</span>
          </h2>
          <p className="text-gray-400 mb-8">
            The typographic FASTLYTICS logo without the icon. For text-only placements and inline
            usage.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {wordmarkLogos.map((asset) => (
              <LogoCard
                key={asset.filename}
                asset={asset}
                isCopied={copiedFile === asset.filename}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </motion.section>

        {/* Animated */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-black uppercase italic mb-3">
            Ani<span className="text-red-600">mated</span>
          </h2>
          <p className="text-gray-400 mb-8">
            The Fastlytics logo with animated racing bars. Renders with CSS animation in the browser
            — useful for video intros, loading screens, and digital presentations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {animatedLogos.map((asset) => (
              <LogoCard
                key={asset.filename}
                asset={asset}
                isCopied={copiedFile === asset.filename}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </motion.section>

        {/* Usage Guidelines */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-black uppercase italic mb-3">
            Usage <span className="text-red-600">Guidelines</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/50 border border-zinc-800 p-6">
              <h3 className="text-lg font-black uppercase italic text-green-400 mb-4">Do</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <Tick01Icon className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  Use the light-mode logo on dark backgrounds and the dark-mode logo on light
                  backgrounds.
                </li>
                <li className="flex items-start gap-2">
                  <Tick01Icon className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  Maintain clear space around the logo equal to the height of the icon.
                </li>
                <li className="flex items-start gap-2">
                  <Tick01Icon className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  Scale the logo proportionally — never stretch or squash it.
                </li>
                <li className="flex items-start gap-2">
                  <Tick01Icon className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  Link the logo back to{' '}
                  <a
                    href="https://fastlytics.app"
                    className="text-red-400 hover:text-red-300 underline"
                  >
                    fastlytics.app
                  </a>{' '}
                  when used on the web.
                </li>
              </ul>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-6">
              <h3 className="text-lg font-black uppercase italic text-red-500 mb-4">Don't</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 flex items-center justify-center text-red-500 mt-0.5 shrink-0 font-black">
                    ✕
                  </span>
                  Change the logo colors or modify the red (#ff2a1a) accent.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 flex items-center justify-center text-red-500 mt-0.5 shrink-0 font-black">
                    ✕
                  </span>
                  Rotate, skew, or apply effects to the logo.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 flex items-center justify-center text-red-500 mt-0.5 shrink-0 font-black">
                    ✕
                  </span>
                  Use the Fastlytics logo to imply endorsement without permission.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 flex items-center justify-center text-red-500 mt-0.5 shrink-0 font-black">
                    ✕
                  </span>
                  Use the logo as your own brand identity or in a confusing manner.
                </li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Bulk Download */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center py-12 border-t border-zinc-800"
        >
          <h2 className="text-3xl font-black uppercase italic mb-4">
            Grab <span className="text-red-600">Everything</span>
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            All logo variants are available under{' '}
            <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono">/brand/</code> on
            the Fastlytics CDN. Use the download buttons above or hotlink directly.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[...primaryLogos, ...iconLogos, ...wordmarkLogos, ...animatedLogos].map((asset) => (
              <a key={asset.filename} href={`/brand/${asset.filename}`} download>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-gray-300 hover:bg-zinc-800 hover:text-white gap-1.5"
                >
                  <Download01Icon className="w-3.5 h-3.5" />
                  {asset.filename}
                </Button>
              </a>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export { PressKit };
export default PressKit;
