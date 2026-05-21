import { useState } from 'react';
import { Bookmark02Icon, FolderOpenIcon, Add01Icon, Cancel01Icon } from 'hugeicons-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaveChart, type SaveChartPayload } from '@/hooks/useSaveChart';
import { cn } from '@/lib/utils';
import { CreateFolderDialog } from './CreateFolderDialog';

interface ChartSaveMenuProps {
  chartType: string;
  title: string;
  raceName?: string;
  chartConfig?: Record<string, unknown>;
  className?: string;
}

export function ChartSaveMenu({
  chartType,
  title,
  raceName,
  chartConfig,
  className,
}: ChartSaveMenuProps) {
  const { user } = useAuth();
  const { saveChart, saveChartAsync, isSaving, folders, isAuthenticated } = useSaveChart();
  const [open, setOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  if (!user) return null;

  const handleSave = (folderId?: string) => {
    setOpen(false);
    const payload: SaveChartPayload = {
      title,
      chart_type: chartType,
      race_name: raceName,
      chart_config: chartConfig,
      folder_id: folderId,
    };
    saveChart(payload);
  };

  return (
    <>
      <div className={cn('relative', className)} data-export-menu>
        <button
          onClick={() => setOpen((o) => !o)}
          disabled={isSaving}
          title="Save chart"
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wider',
            'border border-white/[0.08] bg-white/[0.03] text-white/60',
            'hover:border-white/[0.12] hover:text-white hover:bg-white/[0.06]',
            'transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          {isSaving ? (
            <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <Bookmark02Icon className="size-3.5" />
          )}
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
          {!isSaving && (
            <svg
              className="size-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </button>

        {open && !isSaving && (
          <>
            <div
              role="button"
              tabIndex={-1}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false);
              }}
            />

            <div className="absolute right-0 top-full mt-2 z-50 min-w-[230px] rounded-xl border border-white/[0.08] bg-[#0c0c0e] backdrop-blur-md shadow-2xl overflow-hidden">
              <div className="p-1.5">
                <button
                  onClick={() => handleSave()}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-white/[0.06] cursor-pointer"
                >
                  <span className="text-white/60">
                    <Bookmark02Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-bold text-white tracking-wider">
                      Quick Save
                    </div>
                    <div className="text-[10px] text-white/50 leading-tight">
                      Save without a folder
                    </div>
                  </div>
                </button>

                <div className="mx-2 my-1 h-px bg-white/[0.06]" />

                {folders.length > 0 ? (
                  <>
                    <div className="px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/30">
                      Folders
                    </div>
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleSave(folder.id)}
                        className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all hover:bg-white/[0.06] cursor-pointer"
                      >
                        <span className="text-white/60">
                          <FolderOpenIcon className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-medium text-white/80 truncate">
                            {folder.name}
                          </div>
                        </div>
                      </button>
                    ))}
                    <div className="mx-2 my-1 h-px bg-white/[0.06]" />
                    <button
                      onClick={() => {
                        setOpen(false);
                        setCreateFolderOpen(true);
                      }}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-white/[0.06] cursor-pointer"
                    >
                      <span className="text-white/40">
                        <Add01Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-medium text-white/60">
                          Create new folder
                        </div>
                      </div>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setOpen(false);
                      setCreateFolderOpen(true);
                    }}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-white/[0.06] cursor-pointer"
                  >
                    <span className="text-white/60">
                      <FolderOpenIcon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-bold text-white tracking-wider">
                        Create your first folder
                      </div>
                      <div className="text-[10px] text-white/50 leading-tight">
                        Organize charts into collections
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <CreateFolderDialog
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        onSuccess={(folder) => {
          handleSave(folder.id);
        }}
      />
    </>
  );
}

export default ChartSaveMenu;
