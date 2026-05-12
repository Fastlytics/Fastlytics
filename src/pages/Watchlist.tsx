import { Link } from 'react-router-dom';
import { Bookmark02Icon } from 'hugeicons-react';
import { SEO } from '@/components/layout/SEO';
import { CARD_CONTAINER } from '@/lib/card-styles';

/**
 * Watchlist — placeholder page for the saved-items feature.
 *
 * Shows an empty state for now; real watchlist wiring lands in a follow-up.
 */
const Watchlist = () => {
  return (
    <>
      <SEO title="Watchlist" description="Save your favorite drivers, teams, and races." noIndex />

      <div className="mb-8">
        <h1 className="text-[20px] font-semibold tracking-tight text-white">Watchlist</h1>
        <p className="mt-0.5 text-[12px] text-white/80">
          Save drivers, teams, and races for quick access
        </p>
      </div>

      <div
        className={`${CARD_CONTAINER} flex flex-col items-center justify-center px-6 py-20 text-center`}
      >
        <div className="mb-4 flex size-12 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <Bookmark02Icon size={20} className="text-white/80" />
        </div>
        <h3 className="text-[14px] font-medium text-white">Your watchlist is empty</h3>
        <p className="mt-1 max-w-xs text-[12px] text-white/80">
          Pin drivers, teams, or races from their profile pages to keep an eye on them here.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Link
            to="/drivers"
            className="rounded-md border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/[0.04]"
          >
            Browse drivers
          </Link>
          <Link
            to="/teams"
            className="rounded-md border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/[0.04]"
          >
            Browse teams
          </Link>
        </div>
      </div>
    </>
  );
};

export default Watchlist;
