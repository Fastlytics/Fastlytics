import { cn } from '@/lib/utils';

interface PageLoaderProps {
  /** Optional message below the spinner */
  message?: string;
  /** Additional classes for the container */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to fill the full viewport height (for page-level loading) */
  fullPage?: boolean;
}

/**
 * A clean, centered loading spinner for page or section-level loading states.
 * Use instead of inline skeleton blocks when you don't need to mimic content shape.
 */
const PageLoader = ({ message, className, size = 'md', fullPage = false }: PageLoaderProps) => {
  const sizeMap = {
    sm: 'size-5 border-[1.5px]',
    md: 'size-8 border-2',
    lg: 'size-12 border-[2.5px]',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullPage ? 'min-h-[60vh]' : 'py-20',
        className
      )}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-red-500 border-t-transparent',
          sizeMap[size]
        )}
      />
      {message && <p className="text-[12px] font-medium text-white/50">{message}</p>}
    </div>
  );
};

export { PageLoader };
export default PageLoader;
