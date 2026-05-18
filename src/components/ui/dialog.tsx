import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Minimal modal dialog with backdrop, escape-to-close, and click-outside-to-close.
 */
export function Dialog({ open, onClose, children, className }: DialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Content */}
          <m.div
            ref={contentRef}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'relative w-full max-w-md rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-6 shadow-2xl',
              className
            )}
          >
            {children}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// --- Confirm Dialog ---

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'default';
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <h2 className="text-[15px] font-semibold text-white">{title}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-white/70">{description}</p>
      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="rounded-md border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            'rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-50',
            confirmVariant === 'danger'
              ? 'bg-red-500/90 text-white hover:bg-red-500'
              : 'bg-white text-black hover:bg-white/90'
          )}
        >
          {isLoading ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
