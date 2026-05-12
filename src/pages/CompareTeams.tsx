import { lazy, Suspense } from 'react';
import { SEO } from '@/components/layout/SEO';

const CareerComparison = lazy(
  () => import('@/components/career-analytics/placeholders/CareerComparison')
);

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const CompareTeams = () => {
  return (
    <div style={inter} className="min-h-screen bg-[#09090b] text-white selection:bg-red-500/20">
      <SEO
        title="Compare Teams"
        description="Compare career trajectories, stats, and achievements of F1 teams side-by-side."
      />

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-24 lg:px-8">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/[0.07] px-3 py-1 text-[14px] font-bold text-red-400">
              Comparison Tool
            </span>
          </div>
          <h1 className="text-3xl font-semibold uppercase italic tracking-[-0.025em] text-white sm:text-4xl">
            Compare Teams
          </h1>
          <p className="mt-1 text-[15px] text-white/50">
            Select 2-3 teams to compare career trajectories and statistics side-by-side.
          </p>
          <div className="mt-6 h-px w-full bg-white/[0.05]" />
        </div>

        <Suspense
          fallback={
            <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-red-500" />
                <p className="text-sm text-white/50">Loading comparison tool...</p>
              </div>
            </div>
          }
        >
          <CareerComparison entityType="team" />
        </Suspense>
      </main>
    </div>
  );
};

export default CompareTeams;
