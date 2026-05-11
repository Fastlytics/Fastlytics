import { useState, useCallback, Suspense } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { ErrorBoundary } from 'react-error-boundary';
import { ArrowDown01Icon } from 'hugeicons-react';
import type { CollapsibleSectionProps } from '@/lib/types/career-analytics';

function SectionSkeleton() {
  return <div className="h-[200px] animate-pulse rounded-lg bg-white/[0.04]" />;
}

function SectionErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-red-500/20 bg-red-500/[0.04] px-6 py-8 text-center">
      <p className="text-sm text-zinc-400">Something went wrong loading this section.</p>
      <p className="max-w-md text-xs text-zinc-500">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="mt-2 rounded-md bg-red-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600"
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
        {icon && <span className="text-zinc-400">{icon}</span>}
        <h3 className="flex-1 text-lg font-semibold text-white">{title}</h3>
        <m.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-zinc-400"
        >
          <ArrowDown01Icon className="size-5" />
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
