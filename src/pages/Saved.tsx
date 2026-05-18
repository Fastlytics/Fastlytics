import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { m } from 'motion/react';
import { toast } from 'sonner';
import {
  Bookmark02Icon,
  FolderOpenIcon,
  Add01Icon,
  Delete02Icon,
  LockIcon,
  Globe02Icon,
  ArrowLeft02Icon,
} from 'hugeicons-react';
import { SEO } from '@/components/layout/SEO';
import { CARD_CONTAINER } from '@/lib/card-styles';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PageLoader } from '@/components/ui/PageLoader';
import { ConfirmDialog } from '@/components/ui/dialog';
import { CreateFolderDialog } from '@/components/saved/CreateFolderDialog';

// --- Types ---

interface SavedFolder {
  id: string;
  name: string;
  is_public: boolean;
  cover_image_url: string | null;
  chart_count: number;
  created_at: string;
}

interface SavedChart {
  id: string;
  title: string;
  description: string | null;
  chart_type: string;
  race_name: string | null;
  thumbnail_url: string | null;
  created_at: string;
  folder_id: string | null;
  folder_name: string | null;
  is_public: boolean;
}

// --- Component ---

const Saved = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'folder' | 'chart';
    id: string;
    name: string;
  } | null>(null);

  // Fetch folders
  const { data: folders = [], isLoading: isLoadingFolders } = useQuery<SavedFolder[]>({
    queryKey: ['savedFolders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_folders')
        .select('id, name, is_public, cover_image_url, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const foldersWithCounts = await Promise.all(
        (data || []).map(async (folder) => {
          const { count } = await supabase
            .from('saved_charts')
            .select('*', { count: 'exact', head: true })
            .eq('folder_id', folder.id);
          return { ...folder, chart_count: count || 0 };
        })
      );

      return foldersWithCounts;
    },
    enabled: !!user,
    retry: 1,
  });

  // Fetch charts (all or filtered by folder)
  const { data: charts = [], isLoading: isLoadingCharts } = useQuery<SavedChart[]>({
    queryKey: ['savedCharts', user?.id, selectedFolder],
    queryFn: async () => {
      let query = supabase
        .from('saved_charts')
        .select(
          'id, title, description, chart_type, race_name, thumbnail_url, created_at, folder_id, folder_name, is_public'
        )
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (selectedFolder) {
        query = query.eq('folder_id', selectedFolder);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SavedChart[];
    },
    enabled: !!user,
    retry: 1,
  });

  // Toggle folder visibility
  const toggleFolderVisibility = useMutation({
    mutationFn: async ({ folderId, isPublic }: { folderId: string; isPublic: boolean }) => {
      const { error } = await supabase
        .from('saved_folders')
        .update({ is_public: !isPublic })
        .eq('id', folderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedFolders'] });
      toast.success('Folder visibility updated');
    },
  });

  // Delete folder
  const deleteFolder = useMutation({
    mutationFn: async (folderId: string) => {
      await supabase
        .from('saved_charts')
        .update({ folder_id: null, folder_name: null })
        .eq('folder_id', folderId);

      const { error } = await supabase.from('saved_folders').delete().eq('id', folderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedFolders'] });
      queryClient.invalidateQueries({ queryKey: ['savedCharts'] });
      if (selectedFolder) setSelectedFolder(null);
      setDeleteTarget(null);
      toast.success('Folder deleted');
    },
  });

  // Delete chart
  const deleteChart = useMutation({
    mutationFn: async (chartId: string) => {
      const { error } = await supabase.from('saved_charts').delete().eq('id', chartId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedCharts'] });
      queryClient.invalidateQueries({ queryKey: ['savedFolders'] });
      setDeleteTarget(null);
      toast.success('Chart removed');
    },
  });

  // Toggle chart visibility
  const toggleChartVisibility = useMutation({
    mutationFn: async ({ chartId, isPublic }: { chartId: string; isPublic: boolean }) => {
      const { error } = await supabase
        .from('saved_charts')
        .update({ is_public: !isPublic })
        .eq('id', chartId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedCharts'] });
      toast.success('Chart visibility updated');
    },
  });

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'folder') {
      deleteFolder.mutate(deleteTarget.id);
    } else {
      deleteChart.mutate(deleteTarget.id);
    }
  };

  const selectedFolderData = folders.find((f) => f.id === selectedFolder);

  if (!user) {
    return (
      <>
        <SEO title="Saved" description="Save your favorite charts and analysis." noIndex />
        <div className="mb-8">
          <h1 className="text-[20px] font-semibold tracking-tight text-white">Saved</h1>
          <p className="mt-0.5 text-[12px] text-white/80">
            Sign in to save charts and create collections
          </p>
        </div>
        <div
          className={cn(
            CARD_CONTAINER,
            'flex flex-col items-center justify-center px-6 py-20 text-center'
          )}
        >
          <Bookmark02Icon size={20} className="mb-4 text-white/60" />
          <h3 className="text-[14px] font-medium text-white">Sign in to get started</h3>
          <p className="mt-1 max-w-xs text-[12px] text-white/80">
            Save head-to-head comparisons, speed traces, and more from any race.
          </p>
          <Link
            to="/login"
            className="mt-4 rounded-md bg-white px-3 py-1.5 text-[12px] font-medium text-black transition-colors hover:bg-white/90"
          >
            Sign in
          </Link>
        </div>
      </>
    );
  }

  const chartTypeLabels: Record<string, string> = {
    h2h: 'Head to Head',
    speed_trace: 'Speed Trace',
    lap_analysis: 'Lap Analysis',
    strategy: 'Strategy',
    telemetry: 'Telemetry',
    team_pace: 'Team Pace',
  };

  const isLoading = isLoadingCharts || isLoadingFolders;

  return (
    <>
      <SEO title="Saved" description="Your saved charts and collections." noIndex />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedFolder && (
            <button
              onClick={() => setSelectedFolder(null)}
              className="flex items-center justify-center rounded-md border border-white/[0.06] p-1.5 text-white/60 transition-colors hover:border-white/[0.1] hover:text-white"
            >
              <ArrowLeft02Icon className="size-4" />
            </button>
          )}
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-white">
              {selectedFolderData ? selectedFolderData.name : 'Saved'}
            </h1>
            <p className="mt-0.5 text-[12px] text-white/80">
              {selectedFolderData
                ? `${selectedFolderData.chart_count} chart${selectedFolderData.chart_count !== 1 ? 's' : ''}`
                : 'Your saved charts and collections'}
            </p>
          </div>
        </div>
        {!selectedFolder && (
          <button
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center gap-1.5 rounded-md border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/[0.04]"
          >
            <Add01Icon className="size-3.5" />
            New folder
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoader message="Loading saved items…" />
      ) : !selectedFolder ? (
        /* --- Root view: folders grid + unfiled charts --- */
        <>
          {folders.length === 0 && charts.length === 0 ? (
            <div
              className={cn(
                CARD_CONTAINER,
                'flex flex-col items-center justify-center px-6 py-20 text-center'
              )}
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
                <Bookmark02Icon size={20} className="text-white/60" />
              </div>
              <h3 className="text-[14px] font-medium text-white">No saved items yet</h3>
              <p className="mt-1 max-w-xs text-[12px] text-white/80">
                Create a folder to organize your charts, or save charts directly from any race page.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => setShowCreateFolder(true)}
                  className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-[12px] font-medium text-black transition-colors hover:bg-white/90"
                >
                  <Add01Icon className="size-3.5" />
                  Create a folder
                </button>
                <Link
                  to="/calendar"
                  className="rounded-md border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/[0.04]"
                >
                  Browse races
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Folder cards */}
              {folders.map((folder) => (
                <m.div
                  key={folder.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    CARD_CONTAINER,
                    'group relative cursor-pointer overflow-hidden transition-colors hover:border-white/[0.08]'
                  )}
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  {/* Cover image or placeholder */}
                  {folder.cover_image_url ? (
                    <div className="h-28 w-full border-b border-white/[0.04]">
                      <img
                        src={folder.cover_image_url}
                        alt={folder.name}
                        className="size-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-28 w-full items-center justify-center border-b border-white/[0.04] bg-white/[0.01]">
                      <FolderOpenIcon className="size-6 text-white/10" />
                    </div>
                  )}

                  {/* Folder info */}
                  <div className="px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-[13px] font-medium text-white">{folder.name}</p>
                      {folder.is_public ? (
                        <Globe02Icon className="size-3 shrink-0 text-sky-400/60" />
                      ) : (
                        <LockIcon className="size-3 shrink-0 text-white/30" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-white/50">
                      {folder.chart_count} chart{folder.chart_count !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Hover actions */}
                  <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFolderVisibility.mutate({
                          folderId: folder.id,
                          isPublic: folder.is_public,
                        });
                      }}
                      className="rounded bg-black/80 p-1 text-white/70 backdrop-blur-sm transition-colors hover:text-white"
                      title={folder.is_public ? 'Make private' : 'Make public'}
                    >
                      {folder.is_public ? (
                        <LockIcon className="size-3" />
                      ) : (
                        <Globe02Icon className="size-3" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({ type: 'folder', id: folder.id, name: folder.name });
                      }}
                      className="rounded bg-black/80 p-1 text-red-400/70 backdrop-blur-sm transition-colors hover:text-red-400"
                      title="Delete folder"
                    >
                      <Delete02Icon className="size-3" />
                    </button>
                  </div>
                </m.div>
              ))}

              {/* Unfiled charts */}
              {charts
                .filter((c) => !c.folder_id)
                .map((chart) => (
                  <ChartCard
                    key={chart.id}
                    chart={chart}
                    chartTypeLabels={chartTypeLabels}
                    onToggleVisibility={(chartId, isPublic) =>
                      toggleChartVisibility.mutate({ chartId, isPublic })
                    }
                    onDelete={(chartId) =>
                      setDeleteTarget({ type: 'chart', id: chartId, name: chart.title })
                    }
                  />
                ))}
            </div>
          )}
        </>
      ) : (
        /* --- Folder detail view --- */
        <>
          {charts.length === 0 ? (
            <div
              className={cn(
                CARD_CONTAINER,
                'flex flex-col items-center justify-center px-6 py-20 text-center'
              )}
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
                <FolderOpenIcon size={20} className="text-white/60" />
              </div>
              <h3 className="text-[14px] font-medium text-white">This folder is empty</h3>
              <p className="mt-1 max-w-xs text-[12px] text-white/80">
                Save charts from race pages and organize them into this folder.
              </p>
              <Link
                to="/calendar"
                className="mt-4 rounded-md border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/[0.04]"
              >
                Browse races
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {charts.map((chart) => (
                <ChartCard
                  key={chart.id}
                  chart={chart}
                  chartTypeLabels={chartTypeLabels}
                  onToggleVisibility={(chartId, isPublic) =>
                    toggleChartVisibility.mutate({ chartId, isPublic })
                  }
                  onDelete={(chartId) =>
                    setDeleteTarget({ type: 'chart', id: chartId, name: chart.title })
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onSuccess={() => {
          setShowCreateFolder(false);
          queryClient.invalidateQueries({ queryKey: ['savedFolders'] });
          toast.success('Folder created');
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={deleteTarget?.type === 'folder' ? 'Delete folder' : 'Remove chart'}
        description={
          deleteTarget?.type === 'folder'
            ? `Are you sure you want to delete "${deleteTarget.name}"? Charts inside will be moved out of the folder, not deleted.`
            : `Are you sure you want to remove "${deleteTarget?.name}" from your saved charts?`
        }
        confirmLabel={deleteTarget?.type === 'folder' ? 'Delete folder' : 'Remove'}
        confirmVariant="danger"
        isLoading={deleteFolder.isPending || deleteChart.isPending}
      />
    </>
  );
};

// --- Chart Card ---

function ChartCard({
  chart,
  chartTypeLabels,
  onToggleVisibility,
  onDelete,
}: {
  chart: SavedChart;
  chartTypeLabels: Record<string, string>;
  onToggleVisibility: (chartId: string, isPublic: boolean) => void;
  onDelete: (chartId: string) => void;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(CARD_CONTAINER, 'group relative overflow-hidden')}
    >
      {/* Thumbnail */}
      {chart.thumbnail_url ? (
        <div className="h-28 w-full border-b border-white/[0.04] bg-white/[0.02]">
          <img src={chart.thumbnail_url} alt={chart.title} className="size-full object-cover" />
        </div>
      ) : (
        <div className="flex h-28 w-full items-center justify-center border-b border-white/[0.04] bg-white/[0.02]">
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/20">
            {chartTypeLabels[chart.chart_type] || chart.chart_type}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-white">{chart.title}</p>
            {chart.race_name && (
              <p className="mt-0.5 truncate text-[11px] text-white/60">{chart.race_name}</p>
            )}
          </div>
          {!chart.is_public && <LockIcon className="size-3 shrink-0 text-white/30" />}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-white/60">
            {chartTypeLabels[chart.chart_type] || chart.chart_type}
          </span>
          {chart.folder_name && (
            <span className="text-[10px] text-white/40">📁 {chart.folder_name}</span>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
        <button
          onClick={() => onToggleVisibility(chart.id, chart.is_public)}
          className="rounded bg-black/80 p-1 text-white/70 backdrop-blur-sm transition-colors hover:text-white"
          title={chart.is_public ? 'Make private' : 'Make public'}
        >
          {chart.is_public ? <LockIcon className="size-3" /> : <Globe02Icon className="size-3" />}
        </button>
        <button
          onClick={() => onDelete(chart.id)}
          className="rounded bg-black/80 p-1 text-red-400/70 backdrop-blur-sm transition-colors hover:text-red-400"
          title="Remove"
        >
          <Delete02Icon className="size-3" />
        </button>
      </div>
    </m.div>
  );
}

interface SavedChart {
  id: string;
  title: string;
  description: string | null;
  chart_type: string;
  race_name: string | null;
  thumbnail_url: string | null;
  created_at: string;
  folder_id: string | null;
  folder_name: string | null;
  is_public: boolean;
}

export default Saved;
