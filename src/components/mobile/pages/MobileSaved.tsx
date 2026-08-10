import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  Bookmark02Icon,
  FolderOpenIcon,
  Add01Icon,
  Delete02Icon,
  LockIcon,
  Globe02Icon,
  ArrowLeft02Icon,
  ArrowDown01Icon,
  FilterIcon,
  Tick01Icon,
  Cancel01Icon,
  SortingAZ01Icon,
  MoreHorizontalIcon,
  Move01Icon,
} from 'hugeicons-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  bulkDeleteSavedCharts,
  bulkMoveSavedCharts,
  deleteSavedChart,
  deleteSavedFolder,
  updateSavedChart,
  updateSavedFolder,
} from '@/lib/app-data-api';
import { supabase } from '@/lib/supabase';
import { ConfirmDialog } from '@/components/ui/dialog';
import { CreateFolderDialog } from '@/components/saved/CreateFolderDialog';
import { SavedChartRenderer, buildChartUrl } from '@/components/saved/SavedChartRenderer';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

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
  chart_config: Record<string, unknown> | null;
  thumbnail_url: string | null;
  created_at: string;
  folder_id: string | null;
  folder_name: string | null;
  is_public: boolean;
}

type SortMode = 'newest' | 'oldest' | 'az';
type VisibilityFilter = 'all' | 'public' | 'private';

const CHART_TYPE_LABELS: Record<string, string> = {
  speed_trace: 'Speed Trace',
  throttle: 'Throttle',
  brake: 'Brake',
  rpm: 'RPM',
  gear_map: 'Gear Map',
  drs: 'DRS',
  lap_times: 'Lap Times',
  pace_analysis: 'Pace',
  gap_to_leader: 'Gap to Leader',
  position_changes: 'Positions',
  circuit_comparison: 'Head to Head',
  tire_strategy: 'Strategy',
  team_pace_breakdown: 'Team Pace',
  driver_championship: 'Driver Champ',
  team_championship: 'Team Champ',
  championship_progression: 'Championship',
  peak_vs_consistent: 'Peak vs Consistent',
  pace_evolution: 'Pace Evolution',
  pace_gap: 'Pace Gap',
};

const ALL_CHART_TYPE_LABELS: Record<string, string> = {
  h2h: 'Head to Head',
  ...CHART_TYPE_LABELS,
};

// --- Component ---

const MobileSaved = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedFolder = searchParams.get('folder') || null;

  const setSelectedFolder = (folderId: string | null) => {
    clearSelection();
    if (folderId) {
      setSearchParams({ folder: folderId });
    } else {
      setSearchParams({});
    }
  };

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'folder' | 'chart';
    id: string;
    name: string;
  } | null>(null);

  // Organisation state
  const [sortBy, setSortBy] = useState<SortMode>('newest');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterVisibility, setFilterVisibility] = useState<VisibilityFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<{
    type: 'folder' | 'chart';
    count: number;
  } | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showMoveSheet, setShowMoveSheet] = useState(false);

  const isSelecting = selectedIds.size > 0;

  const clearSelection = () => setSelectedIds(new Set());

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
          'id, title, description, chart_type, race_name, chart_config, thumbnail_url, created_at, folder_id, folder_name, is_public'
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

  // Mutations
  const toggleFolderVisibility = useMutation({
    mutationFn: async ({ folderId, isPublic }: { folderId: string; isPublic: boolean }) => {
      await updateSavedFolder(folderId, { is_public: !isPublic });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedFolders'] });
      toast.success('Folder visibility updated');
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async (folderId: string) => deleteSavedFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedFolders'] });
      queryClient.invalidateQueries({ queryKey: ['savedCharts'] });
      if (selectedFolder) setSelectedFolder(null);
      setDeleteTarget(null);
      clearSelection();
      toast.success('Folder deleted');
    },
  });

  const deleteChart = useMutation({
    mutationFn: async (chartId: string) => deleteSavedChart(chartId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedCharts'] });
      queryClient.invalidateQueries({ queryKey: ['savedFolders'] });
      setDeleteTarget(null);
      toast.success('Chart removed');
    },
  });

  const bulkDeleteCharts = useMutation({
    mutationFn: async (chartIds: string[]) => bulkDeleteSavedCharts(chartIds),
    onSuccess: (_data, chartIds) => {
      queryClient.invalidateQueries({ queryKey: ['savedCharts'] });
      queryClient.invalidateQueries({ queryKey: ['savedFolders'] });
      setBulkDeleteTarget(null);
      clearSelection();
      toast.success(`${chartIds.length} chart${chartIds.length !== 1 ? 's' : ''} removed`);
    },
  });

  const bulkMoveCharts = useMutation({
    mutationFn: async ({ chartIds, folderId }: { chartIds: string[]; folderId: string }) =>
      bulkMoveSavedCharts(chartIds, folderId),
    onSuccess: (_data, { chartIds }) => {
      queryClient.invalidateQueries({ queryKey: ['savedCharts'] });
      queryClient.invalidateQueries({ queryKey: ['savedFolders'] });
      clearSelection();
      setShowMoveSheet(false);
      toast.success(`${chartIds.length} chart${chartIds.length !== 1 ? 's' : ''} moved`);
    },
  });

  const toggleChartVisibility = useMutation({
    mutationFn: async ({ chartId, isPublic }: { chartId: string; isPublic: boolean }) => {
      await updateSavedChart(chartId, { is_public: !isPublic });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedCharts'] });
      toast.success('Chart visibility updated');
    },
  });

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      if (deleteTarget.type === 'folder') {
        deleteFolder.mutate(deleteTarget.id);
      } else {
        deleteChart.mutate(deleteTarget.id);
      }
    } else if (bulkDeleteTarget) {
      const chartIds = Array.from(selectedIds).filter((id) => charts.some((c) => c.id === id));
      bulkDeleteCharts.mutate(chartIds);
    }
  };

  const selectedFolderData = folders.find((f) => f.id === selectedFolder);

  // Clear invalid folder param from URL
  useEffect(() => {
    if (!isLoadingFolders && selectedFolder && !selectedFolderData) {
      setSearchParams({}, { replace: true });
    }
  }, [isLoadingFolders, selectedFolder, selectedFolderData, setSearchParams]);

  // Derived data: filters + sort
  const displayedCharts = useMemo(() => {
    let filtered = selectedFolder ? charts : charts.filter((c) => !c.folder_id);

    if (filterType) {
      filtered = filtered.filter((c) => c.chart_type === filterType);
    }
    if (filterVisibility !== 'all') {
      filtered = filtered.filter((c) =>
        filterVisibility === 'public' ? c.is_public : !c.is_public
      );
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'az') return a.title.localeCompare(b.title);
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
    });
  }, [charts, selectedFolder, filterType, filterVisibility, sortBy]);

  const displayedFolders = useMemo(() => {
    if (selectedFolder) return [];
    let filtered = folders;
    if (filterVisibility !== 'all') {
      filtered = filtered.filter((f) =>
        filterVisibility === 'public' ? f.is_public : !f.is_public
      );
    }
    return [...filtered].sort((a, b) => {
      if (sortBy === 'az') return a.name.localeCompare(b.name);
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
    });
  }, [folders, selectedFolder, filterVisibility, sortBy]);

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    (selectedFolder ? charts : charts.filter((c) => !c.folder_id)).forEach((c) => {
      types.add(c.chart_type);
    });
    return Array.from(types);
  }, [charts, selectedFolder]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      displayedFolders.forEach((f) => next.add(f.id));
      displayedCharts.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const hasActiveFilters = filterType !== null || filterVisibility !== 'all' || sortBy !== 'newest';

  // --- Unauthenticated state ---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#0a0a0a]/95 px-4 pb-2 pt-3 backdrop-blur-sm">
          <div className="flex items-center justify-center">
            <FastlyticsLogo size={22} />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <Bookmark02Icon className="mb-3 size-8 text-white/20" />
          <div className="text-[14px] font-medium text-white/60">Sign in to see saved items</div>
          <Link
            to="/login"
            className="mt-2 text-[12px] text-sky-400 hover:underline active:text-sky-300"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const isLoading = isLoadingCharts || isLoadingFolders;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Sticky Logo Header */}
      <div className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#0a0a0a]/95 px-4 pb-2 pt-3 backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <FastlyticsLogo size={22} />
        </div>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div className="flex items-center gap-2.5">
          {selectedFolder && (
            <button
              onClick={() => {
                setSelectedFolder(null);
                clearSelection();
              }}
              className="active:scale-[0.98] -ml-1 flex size-8 items-center justify-center rounded-lg border border-white/[0.04] text-white/60 transition-colors"
            >
              <ArrowLeft02Icon className="size-4" />
            </button>
          )}
          <div>
            <h1 className="text-[18px] font-semibold tracking-[-0.01em] text-white">
              {selectedFolderData ? selectedFolderData.name : 'Saved'}
            </h1>
            <p className="text-[12px] text-white/40">
              {selectedFolderData
                ? `${displayedCharts.length} chart${displayedCharts.length !== 1 ? 's' : ''}`
                : `${displayedFolders.length} folder${displayedFolders.length !== 1 ? 's' : ''} · ${displayedCharts.length} chart${displayedCharts.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSelecting ? (
            <button
              onClick={clearSelection}
              className="active:scale-[0.98] flex items-center gap-1 rounded-lg border border-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-white/60 transition-colors"
            >
              <Cancel01Icon className="size-3" />
              Cancel
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowFilterSheet(true)}
                className={cn(
                  'active:scale-[0.98] flex size-8 items-center justify-center rounded-lg border transition-colors',
                  hasActiveFilters
                    ? 'border-amber-500/30 bg-amber-500/[0.06] text-amber-300'
                    : 'border-white/[0.04] text-white/60'
                )}
              >
                <FilterIcon className="size-4" />
              </button>
              {!selectedFolder && (
                <button
                  onClick={() => setShowCreateFolder(true)}
                  className="active:scale-[0.98] flex size-8 items-center justify-center rounded-lg border border-white/[0.04] text-white/60 transition-colors"
                >
                  <Add01Icon className="size-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center px-4 py-20">
          <div className="size-6 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
          <p className="mt-3 text-[12px] text-white/40">Loading saved items…</p>
        </div>
      ) : !selectedFolder ? (
        /* --- Root view: folders + unfiled charts --- */
        <>
          {displayedFolders.length === 0 && displayedCharts.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-lg border border-white/[0.04] bg-white/[0.02]">
                <Bookmark02Icon size={20} className="text-white/40" />
              </div>
              <h3 className="text-[14px] font-medium text-white">No saved items yet</h3>
              <p className="mt-1 max-w-xs text-[12px] text-white/40">
                Create a folder to organize your charts, or save charts from any race page.
              </p>
              <div className="mt-4 flex flex-col items-center gap-2">
                <button
                  onClick={() => setShowCreateFolder(true)}
                  className="active:scale-[0.98] flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-[12px] font-medium text-black transition-colors"
                >
                  <Add01Icon className="size-3.5" />
                  Create a folder
                </button>
                <Link
                  to="/calendar"
                  className="rounded-lg border border-white/[0.04] px-4 py-2 text-[12px] font-medium text-white/60 transition-colors"
                >
                  Browse races
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-1 px-4 pb-4">
              {/* Folders section */}
              {displayedFolders.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
                      Folders ({displayedFolders.length})
                    </h2>
                    <button
                      onClick={selectAll}
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white/30 transition-colors active:text-white/60"
                    >
                      Select all
                    </button>
                  </div>
                  <div className="space-y-1">
                    {displayedFolders.map((folder) => (
                      <FolderRow
                        key={folder.id}
                        folder={folder}
                        isSelected={selectedIds.has(folder.id)}
                        isSelecting={isSelecting}
                        onToggleSelect={() => toggleSelect(folder.id)}
                        onClick={() => {
                          if (isSelecting) {
                            toggleSelect(folder.id);
                          } else {
                            clearSelection();
                            setSelectedFolder(folder.id);
                          }
                        }}
                        onToggleVisibility={(folderId, isPublic) =>
                          toggleFolderVisibility.mutate({ folderId, isPublic })
                        }
                        onDelete={(folderId, name) =>
                          setDeleteTarget({ type: 'folder', id: folderId, name })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Charts section */}
              {displayedCharts.length > 0 && (
                <div className={displayedFolders.length > 0 ? 'mt-5' : ''}>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
                      Charts ({displayedCharts.length})
                    </h2>
                    {displayedFolders.length === 0 && (
                      <button
                        onClick={selectAll}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white/30 transition-colors active:text-white/60"
                      >
                        Select all
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {displayedCharts.map((chart) => (
                      <ChartRow
                        key={chart.id}
                        chart={chart}
                        isSelected={selectedIds.has(chart.id)}
                        isSelecting={isSelecting}
                        onToggleSelect={() => toggleSelect(chart.id)}
                        onToggleVisibility={(chartId, isPublic) =>
                          toggleChartVisibility.mutate({ chartId, isPublic })
                        }
                        onDelete={(chartId) =>
                          setDeleteTarget({ type: 'chart', id: chartId, name: chart.title })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* --- Folder detail view --- */
        <>
          {displayedCharts.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-lg border border-white/[0.04] bg-white/[0.02]">
                <FolderOpenIcon size={20} className="text-white/40" />
              </div>
              <h3 className="text-[14px] font-medium text-white">This folder is empty</h3>
              <p className="mt-1 max-w-xs text-[12px] text-white/40">
                Save charts from race pages and organize them into this folder.
              </p>
              <Link
                to="/calendar"
                className="mt-4 active:scale-[0.98] rounded-lg border border-white/[0.04] px-4 py-2 text-[12px] font-medium text-white/60 transition-colors"
              >
                Browse races
              </Link>
            </div>
          ) : (
            <div className="px-4 pb-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
                  Charts ({displayedCharts.length})
                </h2>
                <button
                  onClick={selectAll}
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white/30 transition-colors active:text-white/60"
                >
                  Select all
                </button>
              </div>
              <div className="space-y-1">
                {displayedCharts.map((chart) => (
                  <ChartRow
                    key={chart.id}
                    chart={chart}
                    isSelected={selectedIds.has(chart.id)}
                    isSelecting={isSelecting}
                    onToggleSelect={() => toggleSelect(chart.id)}
                    onToggleVisibility={(chartId, isPublic) =>
                      toggleChartVisibility.mutate({ chartId, isPublic })
                    }
                    onDelete={(chartId) =>
                      setDeleteTarget({ type: 'chart', id: chartId, name: chart.title })
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Bottom action bar (bulk operations) */}
      <AnimatePresence>
        {isSelecting && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.04] bg-[#0a0a0a]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-medium text-white/60">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => selectAll()}
                className="text-[11px] font-medium text-white/30 active:text-white/60"
              >
                Select all
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkDeleteTarget({ type: 'chart', count: selectedIds.size })}
                className="active:scale-[0.98] flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/[0.04] px-3 py-2.5 text-[12px] font-medium text-red-400 transition-colors"
              >
                <Delete02Icon className="size-3.5" />
                Delete
              </button>
              {!selectedFolder && folders.length > 0 && (
                <button
                  onClick={() => setShowMoveSheet(true)}
                  className="active:scale-[0.98] flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.04] px-3 py-2.5 text-[12px] font-medium text-white/80 transition-colors"
                >
                  <Move01Icon className="size-3.5" />
                  Move
                </button>
              )}
              <button
                onClick={clearSelection}
                className="active:scale-[0.98] flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.04] px-3 py-2.5 text-[12px] font-medium text-white/60 transition-colors"
              >
                <Cancel01Icon className="size-3.5" />
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter bottom sheet */}
      <BottomSheet open={showFilterSheet} onClose={() => setShowFilterSheet(false)} title="Filters">
        <div className="space-y-5">
          {/* Sort */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-white/30">
              Sort by
            </label>
            <div className="flex gap-2">
              {(
                [
                  { mode: 'newest' as SortMode, label: 'Newest' },
                  { mode: 'oldest' as SortMode, label: 'Oldest' },
                  { mode: 'az' as SortMode, label: 'A – Z' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.mode}
                  onClick={() => setSortBy(opt.mode)}
                  className={cn(
                    'active:scale-[0.98] rounded-lg px-3 py-2 text-[12px] font-medium transition-colors',
                    sortBy === opt.mode
                      ? 'bg-white/[0.08] text-white'
                      : 'border border-white/[0.04] text-white/40'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility filter */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-white/30">
              Visibility
            </label>
            <div className="flex gap-2">
              {(
                [
                  { mode: 'all' as VisibilityFilter, label: 'All', icon: null },
                  {
                    mode: 'public' as VisibilityFilter,
                    label: 'Public',
                    icon: <Globe02Icon className="size-3" />,
                  },
                  {
                    mode: 'private' as VisibilityFilter,
                    label: 'Private',
                    icon: <LockIcon className="size-3" />,
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.mode}
                  onClick={() => setFilterVisibility(opt.mode)}
                  className={cn(
                    'active:scale-[0.98] flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors',
                    filterVisibility === opt.mode
                      ? 'bg-white/[0.08] text-white'
                      : 'border border-white/[0.04] text-white/40'
                  )}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart type filter */}
          {availableTypes.length > 1 && (
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Chart type
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType(null)}
                  className={cn(
                    'active:scale-[0.98] rounded-lg px-3 py-2 text-[12px] font-medium transition-colors',
                    filterType === null
                      ? 'bg-white/[0.08] text-white'
                      : 'border border-white/[0.04] text-white/40'
                  )}
                >
                  All
                </button>
                {availableTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={cn(
                      'active:scale-[0.98] rounded-lg px-3 py-2 text-[12px] font-medium transition-colors',
                      filterType === type
                        ? 'bg-white/[0.08] text-white'
                        : 'border border-white/[0.04] text-white/40'
                    )}
                  >
                    {ALL_CHART_TYPE_LABELS[type] || type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSortBy('newest');
                setFilterType(null);
                setFilterVisibility('all');
              }}
              className="active:scale-[0.98] w-full rounded-lg border border-white/[0.04] py-2.5 text-[12px] font-medium text-white/40 transition-colors"
            >
              Reset filters
            </button>
          )}
        </div>
      </BottomSheet>

      {/* Move-to-folder bottom sheet */}
      <BottomSheet
        open={showMoveSheet}
        onClose={() => setShowMoveSheet(false)}
        title="Move to folder"
      >
        <div className="space-y-1">
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                bulkMoveCharts.mutate({
                  chartIds: Array.from(selectedIds).filter((id) => charts.some((c) => c.id === id)),
                  folderId: f.id,
                });
              }}
              className="active:scale-[0.98] flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors active:bg-white/[0.04]"
            >
              <FolderOpenIcon className="size-4 text-white/40" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-white">{f.name}</p>
                <p className="text-[11px] text-white/30">
                  {f.chart_count} chart{f.chart_count !== 1 ? 's' : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>

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
        open={!!deleteTarget || !!bulkDeleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setBulkDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={
          bulkDeleteTarget
            ? `Delete ${bulkDeleteTarget.count} chart${bulkDeleteTarget.count !== 1 ? 's' : ''}`
            : deleteTarget?.type === 'folder'
              ? 'Delete folder'
              : 'Remove chart'
        }
        description={
          bulkDeleteTarget
            ? `This will permanently delete ${bulkDeleteTarget.count} chart${bulkDeleteTarget.count !== 1 ? 's' : ''}. This action cannot be undone.`
            : deleteTarget?.type === 'folder'
              ? `Are you sure you want to delete "${deleteTarget.name}"? Charts inside will be moved out of the folder, not deleted.`
              : `Are you sure you want to remove "${deleteTarget?.name}" from your saved charts?`
        }
        confirmLabel={
          bulkDeleteTarget
            ? `Delete ${bulkDeleteTarget.count} chart${bulkDeleteTarget.count !== 1 ? 's' : ''}`
            : deleteTarget?.type === 'folder'
              ? 'Delete folder'
              : 'Remove'
        }
        confirmVariant="danger"
        isLoading={deleteFolder.isPending || deleteChart.isPending || bulkDeleteCharts.isPending}
      />
    </div>
  );
};

// --- Folder Row ---

function FolderRow({
  folder,
  isSelected,
  isSelecting,
  onToggleSelect,
  onClick,
  onToggleVisibility,
  onDelete,
}: {
  folder: SavedFolder;
  isSelected: boolean;
  isSelecting: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
  onToggleVisibility: (folderId: string, isPublic: boolean) => void;
  onDelete: (folderId: string, name: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'active:scale-[0.98] relative flex items-center gap-3 rounded-lg border border-white/[0.04] px-3 py-3 transition-colors',
        isSelected && 'border-red-500/30 bg-red-500/[0.02]'
      )}
      onClick={onClick}
    >
      {/* Select checkbox */}
      {isSelecting && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded border transition-all',
            isSelected
              ? 'border-red-500 bg-red-500 text-white'
              : 'border-white/[0.12] text-transparent'
          )}
        >
          {isSelected && <Tick01Icon className="size-3" />}
        </button>
      )}

      {/* Icon */}
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.03]">
        <FolderOpenIcon className="size-5 text-white/30" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-white">{folder.name}</p>
        <p className="mt-0.5 text-[11px] text-white/30">
          {folder.chart_count} chart{folder.chart_count !== 1 ? 's' : ''}
          {folder.is_public && (
            <span className="ml-2 inline-flex items-center gap-0.5 text-sky-400/60">
              <Globe02Icon className="size-2.5" />
              Public
            </span>
          )}
        </p>
      </div>

      {/* Actions menu */}
      {!isSelecting && (
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="flex size-8 items-center justify-center rounded-lg text-white/30 transition-colors active:text-white/60"
          >
            <MoreHorizontalIcon className="size-4" />
          </button>
          {showActions && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(false);
                }}
              />
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-white/[0.04] bg-[#141414] p-1 shadow-2xl">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(folder.id, folder.is_public);
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[12px] text-white/60 transition-colors active:bg-white/[0.04]"
                >
                  {folder.is_public ? (
                    <LockIcon className="size-3.5" />
                  ) : (
                    <Globe02Icon className="size-3.5" />
                  )}
                  {folder.is_public ? 'Make private' : 'Make public'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(folder.id, folder.name);
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[12px] text-red-400 transition-colors active:bg-white/[0.04]"
                >
                  <Delete02Icon className="size-3.5" />
                  Delete folder
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

// --- Chart Row ---

function ChartRow({
  chart,
  isSelected,
  isSelecting,
  onToggleSelect,
  onToggleVisibility,
  onDelete,
}: {
  chart: SavedChart;
  isSelected: boolean;
  isSelecting: boolean;
  onToggleSelect: () => void;
  onToggleVisibility: (chartId: string, isPublic: boolean) => void;
  onDelete: (chartId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  const href =
    chart.chart_type && chart.chart_config
      ? buildChartUrl(chart.chart_type, chart.chart_config as Record<string, unknown>)
      : '#';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'active:scale-[0.98] relative flex items-center gap-3 rounded-lg border border-white/[0.04] px-3 py-3 transition-colors',
        isSelected && 'border-red-500/30 bg-red-500/[0.02]'
      )}
    >
      {/* Select checkbox */}
      {isSelecting && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded border transition-all',
            isSelected
              ? 'border-red-500 bg-red-500 text-white'
              : 'border-white/[0.12] text-transparent'
          )}
        >
          {isSelected && <Tick01Icon className="size-3" />}
        </button>
      )}

      {/* Chart thumbnail */}
      <Link
        to={href}
        className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.03]"
      >
        {chart.chart_config ? (
          <SavedChartRenderer
            chartType={chart.chart_type}
            chartConfig={chart.chart_config as Record<string, unknown>}
          />
        ) : (
          <span className="text-[8px] font-medium uppercase tracking-wider text-white/15">
            {ALL_CHART_TYPE_LABELS[chart.chart_type]?.slice(0, 3) || '?'}
          </span>
        )}
      </Link>

      {/* Info */}
      <Link to={href} className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-white">{chart.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-white/30">
          {chart.race_name || ALL_CHART_TYPE_LABELS[chart.chart_type] || chart.chart_type}
          {!chart.is_public && <LockIcon className="ml-1 inline size-2.5 text-white/20" />}
        </p>
      </Link>

      {/* Actions menu */}
      {!isSelecting && (
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="flex size-8 items-center justify-center rounded-lg text-white/30 transition-colors active:text-white/60"
          >
            <MoreHorizontalIcon className="size-4" />
          </button>
          {showActions && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(false);
                }}
              />
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-white/[0.04] bg-[#141414] p-1 shadow-2xl">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(chart.id, chart.is_public);
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[12px] text-white/60 transition-colors active:bg-white/[0.04]"
                >
                  {chart.is_public ? (
                    <LockIcon className="size-3.5" />
                  ) : (
                    <Globe02Icon className="size-3.5" />
                  )}
                  {chart.is_public ? 'Make private' : 'Make public'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(chart.id);
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[12px] text-red-400 transition-colors active:bg-white/[0.04]"
                >
                  <Delete02Icon className="size-3.5" />
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

// --- Bottom Sheet ---

function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-white/[0.04] bg-[#0a0a0a] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
          >
            {/* Handle */}
            <div className="mb-3 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-white/10" />
            </div>

            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-white">{title}</h3>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-lg text-white/30 transition-colors active:text-white/60"
              >
                <Cancel01Icon className="size-4" />
              </button>
            </div>

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default MobileSaved;
