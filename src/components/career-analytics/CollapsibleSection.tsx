import { useState, useCallback, Suspense } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { ErrorBoundary } from 'react-error-boundary';
import { ArrowDown01Icon } from 'hugeicons-react';
import type { CollapsibleSectionProps } from '@/lib/types/career-analytics';

function SectionSkeleton() {
  return <div className="h-[200px] animate-pulse rounded-xl bg-white/[0.04]" />;
}

function SectionErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-6 py-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-full border border-red-500/20 bg-red-500/[0.07]">
        <span className="text-sm text-red-400">!</span>
      </div>
      <p className="text-[14px] text-white/40">Something went wrong loading this section.</p>
      <p className="max-w-md text-[11px] text-white/25">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
      >
        Retry
      </button>
    </div>
  );
}

export function CollapsibleSection({
  id,
  title,
  icon,
  defaultExpanded = false,
  children,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hasBeenExpanded, setHasBeenExpanded] = useState(defaultExpanded);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (next && !hasBeenExpanded) {
        setHasBeenExpanded(true);
      }
      return next;
    });
  }, [hasBeenExpanded]);

  return (
    <section data-section-id={id} className="border-b border-white/[0.06]">
      <button
        onClick={toggle}
        className="flex w-full items-center gap-3 px-1 py-5 text-left transition-colors hover:bg-white/[0.02]"
        aria-expanded={isExpanded}
        aria-controls={`section-content-${id}`}
      >
        {icon && <span className="text-white/30">{icon}</span>}
        <h3 className="flex-1 text-[15px] font-semibold text-white">{title}</h3>
        <m.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/30"
        >
          <ArrowDown01Icon className="size-4" />
        </m.span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <m.div
            id={`section-content-${id}`}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-6">
              <ErrorBoundary FallbackComponent={SectionErrorFallback} resetKeys={[id]}>
                {hasBeenExpanded ? (
                  <Suspense fallback={<SectionSkeleton />}>{children}</Suspense>
                ) : (
                  <SectionSkeleton />
                )}
              </ErrorBoundary>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}
