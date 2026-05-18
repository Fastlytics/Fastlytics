import { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import {
  Bookmark02Icon,
  FolderOpenIcon,
  Cancel01Icon,
  LockIcon,
  Globe02Icon,
} from 'hugeicons-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSaveChart, type SaveChartPayload } from '@/hooks/useSaveChart';

interface SaveChartDialogProps {
  open: boolean;
  onClose: () => void;
  /** Pre-filled chart data */
  chartType: string;
  defaultTitle: string;
  raceName?: string;
  chartConfig?: Record<string, unknown>;
}

/**
 * Dialog for saving a chart to the user's collection.
 * Allows selecting a folder and toggling public/private visibility.
 */
export function SaveChartDialog({
  open,
  onClose,
  chartType,
  defaultTitle,
  raceName,
  chartConfig,
}: SaveChartDialogProps) {
  const { saveChart, isSaving, folders, isAuthenticated } = useSaveChart();
  const [title, setTitle] = useState(defaultTitle);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  const handleSave = () => {
    if (!title.trim()) return;

    const payload: SaveChartPayload = {
      title: title.trim(),
      chart_type: chartType,
      race_name: raceName,
      chart_config: chartConfig,
      folder_id: selectedFolder || undefined,
      is_public: isPublic,
    };

    saveChart(payload, {
      onSuccess: () => {
        onClose();
        setTitle(defaultTitle);
        setSelectedFolder(null);
        setIsPublic(false);
      },
    });
  };

  if (!isAuthenticated) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog */}
          <m.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-5 shadow-[0_16px_64px_rgba(0,0,0,0.6)]"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark02Icon className="size-4 text-white/80" />
                <h3 className="text-[14px] font-medium text-white">Save chart</h3>
              </div>
              <button
                onClick={onClose}
                className="text-white/60 transition-colors hover:text-white"
              >
                <Cancel01Icon className="size-4" />
              </button>
            </div>

            {/* Title input */}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-white/80">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 border-white/[0.06] bg-transparent text-[13px] text-white placeholder:text-white/50 focus:border-white/[0.12] focus:ring-0"
                  placeholder="Chart title..."
                  autoFocus
                />
              </div>

              {/* Folder selector */}
              {folders.length > 0 && (
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-white/80">
                    Folder (optional)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedFolder(null)}
                      className={cn(
                        'flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
                        !selectedFolder
                          ? 'border-white/[0.12] bg-white/[0.04] text-white'
                          : 'border-white/[0.06] text-white/60 hover:text-white'
                      )}
                    >
                      None
                    </button>
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder.id)}
                        className={cn(
                          'flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
                          selectedFolder === folder.id
                            ? 'border-white/[0.12] bg-white/[0.04] text-white'
                            : 'border-white/[0.06] text-white/60 hover:text-white'
                        )}
                      >
                        <FolderOpenIcon className="size-2.5" />
                        {folder.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Visibility toggle */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-white/80">Visibility</span>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors',
                    isPublic
                      ? 'border-sky-400/20 bg-sky-400/10 text-sky-300'
                      : 'border-white/[0.08] text-white/60'
                  )}
                >
                  {isPublic ? (
                    <>
                      <Globe02Icon className="size-3" />
                      Public
                    </>
                  ) : (
                    <>
                      <LockIcon className="size-3" />
                      Private
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white/70 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !title.trim()}
                className="rounded-md bg-white px-3 py-1.5 text-[12px] font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SaveChartDialog;
