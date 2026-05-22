import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { m, AnimatePresence } from 'motion/react';
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
} from 'hugeicons-react';
import { SEO } from '@/components/layout/SEO';
import { CARD_CONTAINER } from '@/lib/card-styles';
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
import { PageLoader } from '@/components/ui/PageLoader';
import { ConfirmDialog } from '@/components/ui/dialog';
import { CreateFolderDialog } from '@/components/saved/CreateFolderDialog';
import { SavedChartRenderer, buildChartUrl } from '@/components/saved/SavedChartRenderer';

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

const Saved = () => {
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

  // Toggle folder visibility
  const toggleFolderVisibility = useMutation({
    mutationFn: async ({ folderId, isPublic }: { folderId: string; isPublic: boolean }) => {
      await updateSavedFolder(folderId, { is_public: !isPublic });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedFolders'] });
      toast.success('Folder visibility updated');
    },
  });

  // Delete folder
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

  // Delete chart
  const deleteChart = useMutation({
    mutationFn: async (chartId: string) => deleteSavedChart(chartId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedCharts'] });
      queryClient.invalidateQueries({ queryKey: ['savedFolders'] });
      setDeleteTarget(null);
      toast.success('Chart removed');
    },
  });

  // Bulk delete charts
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

  // Bulk move charts to folder
  const bulkMoveCharts = useMutation({
    mutationFn: async ({ chartIds, folderId }: { chartIds: string[]; folderId: string }) =>
      bulkMoveSavedCharts(chartIds, folderId),
    onSuccess: (_data, { chartIds }) => {
      queryClient.invalidateQueries({ queryKey: ['savedCharts'] });
      queryClient.invalidateQueries({ queryKey: ['savedFolders'] });
      clearSelection();
      toast.success(`${chartIds.length} chart${chartIds.length !== 1 ? 's' : ''} moved`);
    },
  });

  // Toggle chart visibility
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

  // If URL has a folder param that doesn't match any folder, clear it
  useEffect(() => {
    if (!isLoadingFolders && selectedFolder && !selectedFolderData) {
      setSearchParams({}, { replace: true });
    }
  }, [isLoadingFolders, selectedFolder, selectedFolderData, setSearchParams]);

  const firstChartByFolder = useMemo(() => {
    const map = new Map<string, SavedChart>();
    charts.forEach((c) => {
      if (c.folder_id && !map.has(c.folder_id)) {
        map.set(c.folder_id, c);
      }
    });
    return map;
  }, [charts]);

  // --- Derived data: apply filters + sort ---
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

  // Available chart types for filter
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    (selectedFolder ? charts : charts.filter((c) => !c.folder_id)).forEach((c) => {
      types.add(c.chart_type);
    });
    return Array.from(types);
  }, [charts, selectedFolder]);

  // Toggle selection for an item
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFolders = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      displayedFolders.forEach((f) => next.add(f.id));
      return next;
    });
  };

  const selectAllCharts = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      displayedCharts.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const deselectAllFolders = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      displayedFolders.forEach((f) => next.delete(f.id));
      return next;
    });
  };

  const deselectAllCharts = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      displayedCharts.forEach((c) => next.delete(c.id));
      return next;
    });
  };

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

  const isLoading = isLoadingCharts || isLoadingFolders;

  return (
    <>
      <SEO title="Saved" description="Your saved charts and collections." noIndex />

      {/* Bulk actions bar */}
      <AnimatePresence>
        {isSelecting && (
          <m.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="sticky top-0 z-30 mb-4 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/[0.04] px-4 py-2.5"
          >
            <span className="text-[12px] font-medium text-red-300">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() =>
                setBulkDeleteTarget({
                  type: 'chart',
                  count: selectedIds.size,
                })
              }
              className="flex items-center gap-1 rounded-md border border-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <Delete02Icon className="size-3" />
              Delete
            </button>
            {!selectedFolder && folders.length > 0 && (
              <BulkMoveMenu
                folders={folders}
                selectedIds={selectedIds}
                onMove={(folderId) =>
                  bulkMoveCharts.mutate({
                    chartIds: Array.from(selectedIds).filter((id) =>
                      charts.some((c) => c.id === id)
                    ),
                    folderId,
                  })
                }
              />
            )}
            <div className="flex-1" />
            <button
              onClick={clearSelection}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-white/60 transition-colors hover:text-white"
            >
              <Cancel01Icon className="size-3" />
              Cancel
            </button>
          </m.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {selectedFolder && (
            <button
              onClick={() => {
                setSelectedFolder(null);
                clearSelection();
              }}
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
                ? `${displayedCharts.length} chart${displayedCharts.length !== 1 ? 's' : ''}`
                : `${displayedFolders.length} folder${displayedFolders.length !== 1 ? 's' : ''} · ${displayedCharts.length} chart${displayedCharts.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <SortDropdown sortBy={sortBy} onChange={setSortBy} />

          {/* Filter by chart type */}
          {availableTypes.length > 1 && (
            <FilterDropdown types={availableTypes} selected={filterType} onChange={setFilterType} />
          )}

          {/* Filter by visibility */}
          <VisibilityFilterDropdown selected={filterVisibility} onChange={setFilterVisibility} />

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
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoader message="Loading saved items…" />
      ) : !selectedFolder ? (
        /* --- Root view: folders + unfiled charts --- */
        <>
          {displayedFolders.length === 0 && displayedCharts.length === 0 ? (
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
            <div className="space-y-6">
              {/* Folders section */}
              {displayedFolders.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-[13px] font-semibold uppercase tracking-wider text-white/60">
                      Folders ({displayedFolders.length})
                    </h2>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={selectAllFolders}
                        className="rounded px-2 py-0.5 text-[10px] font-medium text-white/50 transition-colors hover:text-white/80"
                      >
                        Select all
                      </button>
                      <button
                        onClick={deselectAllFolders}
                        className="rounded px-2 py-0.5 text-[10px] font-medium text-white/50 transition-colors hover:text-white/80"
                      >
                        Deselect
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {displayedFolders.map((folder) => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        firstChart={firstChartByFolder.get(folder.id)}
                        isSelected={selectedIds.has(folder.id)}
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
                <div>
                  {displayedFolders.length > 0 && <div className="mb-4 h-px bg-white/[0.04]" />}
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-[13px] font-semibold uppercase tracking-wider text-white/60">
                      Charts ({displayedCharts.length})
                    </h2>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={selectAllCharts}
                        className="rounded px-2 py-0.5 text-[10px] font-medium text-white/50 transition-colors hover:text-white/80"
                      >
                        Select all
                      </button>
                      <button
                        onClick={deselectAllCharts}
                        className="rounded px-2 py-0.5 text-[10px] font-medium text-white/50 transition-colors hover:text-white/80"
                      >
                        Deselect
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {displayedCharts.map((chart) => (
                      <ChartCard
                        key={chart.id}
                        chart={chart}
                        isSelected={selectedIds.has(chart.id)}
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
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold uppercase tracking-wider text-white/60">
                  Charts ({displayedCharts.length})
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={selectAllCharts}
                    className="rounded px-2 py-0.5 text-[10px] font-medium text-white/50 transition-colors hover:text-white/80"
                  >
                    Select all
                  </button>
                  <button
                    onClick={deselectAllCharts}
                    className="rounded px-2 py-0.5 text-[10px] font-medium text-white/50 transition-colors hover:text-white/80"
                  >
                    Deselect
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {displayedCharts.map((chart) => (
                  <ChartCard
                    key={chart.id}
                    chart={chart}
                    isSelected={selectedIds.has(chart.id)}
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
    </>
  );
};

// --- Folder Card ---

function FolderCard({
  folder,
  firstChart,
  isSelected,
  onToggleSelect,
  onClick,
  onToggleVisibility,
  onDelete,
}: {
  folder: SavedFolder;
  firstChart?: SavedChart;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
  onToggleVisibility: (folderId: string, isPublic: boolean) => void;
  onDelete: (folderId: string, name: string) => void;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        CARD_CONTAINER,
        'group relative cursor-pointer overflow-hidden aspect-square transition-colors hover:border-white/[0.08]',
        isSelected && 'border-red-500/30 bg-red-500/[0.02]'
      )}
      onClick={onClick}
    >
      {/* Select checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        className={cn(
          'absolute left-2 top-2 z-10 flex size-5 items-center justify-center rounded border transition-all',
          isSelected
            ? 'border-red-500 bg-red-500 text-white'
            : 'border-white/[0.12] bg-black/60 text-transparent group-hover:text-white/60'
        )}
      >
        {isSelected && <Tick01Icon className="size-3" />}
      </button>

      {/* Cover image or first chart thumbnail */}
      {folder.cover_image_url ? (
        <img
          src={folder.cover_image_url}
          alt={folder.name}
          className="absolute inset-0 size-full object-cover"
        />
      ) : firstChart?.chart_config ? (
        <SavedChartRenderer
          chartType={firstChart.chart_type}
          chartConfig={firstChart.chart_config as Record<string, unknown>}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-white/[0.01]">
          <FolderOpenIcon className="size-8 text-white/[0.06]" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Folder info */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 py-2.5">
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
            onToggleVisibility(folder.id, folder.is_public);
          }}
          className="rounded bg-black/80 p-1 text-white/70 backdrop-blur-sm transition-colors hover:text-white"
          title={folder.is_public ? 'Make private' : 'Make public'}
        >
          {folder.is_public ? <LockIcon className="size-3" /> : <Globe02Icon className="size-3" />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(folder.id, folder.name);
          }}
          className="rounded bg-black/80 p-1 text-red-400/70 backdrop-blur-sm transition-colors hover:text-red-400"
          title="Delete folder"
        >
          <Delete02Icon className="size-3" />
        </button>
      </div>
    </m.div>
  );
}

// --- Chart Card ---

function ChartCard({
  chart,
  isSelected,
  onToggleSelect,
  onToggleVisibility,
  onDelete,
}: {
  chart: SavedChart;
  isSelected: boolean;
  onToggleSelect: () => void;
  onToggleVisibility: (chartId: string, isPublic: boolean) => void;
  onDelete: (chartId: string) => void;
}) {
  const href =
    chart.chart_type && chart.chart_config
      ? buildChartUrl(chart.chart_type, chart.chart_config as Record<string, unknown>)
      : '#';

  return (
    <m.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        CARD_CONTAINER,
        'group relative overflow-hidden aspect-square',
        isSelected && 'border-red-500/30 bg-red-500/[0.02]'
      )}
    >
      {/* Select checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        className={cn(
          'absolute left-2 top-2 z-10 flex size-5 items-center justify-center rounded border transition-all',
          isSelected
            ? 'border-red-500 bg-red-500 text-white'
            : 'border-white/[0.12] bg-black/60 text-transparent group-hover:text-white/60'
        )}
      >
        {isSelected && <Tick01Icon className="size-3" />}
      </button>

      {/* Chart rendered live */}
      <Link to={href} className="absolute inset-0">
        {chart.chart_config ? (
          <SavedChartRenderer
            chartType={chart.chart_type}
            chartConfig={chart.chart_config as Record<string, unknown>}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-white/[0.02]">
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/15">
              {ALL_CHART_TYPE_LABELS[chart.chart_type] || chart.chart_type}
            </span>
          </div>
        )}
      </Link>

      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 py-2.5">
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
            {ALL_CHART_TYPE_LABELS[chart.chart_type] || chart.chart_type}
          </span>
          {chart.folder_name && (
            <span className="text-[10px] text-white/40">📁 {chart.folder_name}</span>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(chart.id, chart.is_public);
          }}
          className="rounded bg-black/80 p-1 text-white/70 backdrop-blur-sm transition-colors hover:text-white"
          title={chart.is_public ? 'Make private' : 'Make public'}
        >
          {chart.is_public ? <LockIcon className="size-3" /> : <Globe02Icon className="size-3" />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(chart.id);
          }}
          className="rounded bg-black/80 p-1 text-red-400/70 backdrop-blur-sm transition-colors hover:text-red-400"
          title="Remove"
        >
          <Delete02Icon className="size-3" />
        </button>
      </div>
    </m.div>
  );
}

// --- Sort Dropdown ---

function SortDropdown({ sortBy, onChange }: { sortBy: SortMode; onChange: (s: SortMode) => void }) {
  const [open, setOpen] = useState(false);

  const options: { mode: SortMode; label: string }[] = [
    { mode: 'newest', label: 'Newest first' },
    { mode: 'oldest', label: 'Oldest first' },
    { mode: 'az', label: 'A – Z' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 py-1.5 text-[11px] font-medium text-white/70 transition-colors hover:border-white/[0.12] hover:text-white"
      >
        <SortingAZ01Icon className="size-3" />
        {options.find((o) => o.mode === sortBy)?.label}
        <ArrowDown01Icon className="size-2.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-white/[0.08] bg-[#0c0c0e] p-1 shadow-2xl">
            {options.map((opt) => (
              <button
                key={opt.mode}
                onClick={() => {
                  onChange(opt.mode);
                  setOpen(false);
                }}
                className={cn(
                  'w-full rounded px-3 py-1.5 text-left text-[12px] transition-colors',
                  sortBy === opt.mode
                    ? 'bg-white/[0.06] text-white'
                    : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// --- Filter Dropdown (chart type) ---

function FilterDropdown({
  types,
  selected,
  onChange,
}: {
  types: string[];
  selected: string | null;
  onChange: (t: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors',
          selected
            ? 'border-amber-500/30 bg-amber-500/[0.06] text-amber-300'
            : 'border-white/[0.08] text-white/70 hover:border-white/[0.12] hover:text-white'
        )}
      >
        <FilterIcon className="size-3" />
        {selected ? ALL_CHART_TYPE_LABELS[selected] || selected : 'All types'}
        <ArrowDown01Icon className="size-2.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-white/[0.08] bg-[#0c0c0e] p-1 shadow-2xl">
            <button
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className={cn(
                'w-full rounded px-3 py-1.5 text-left text-[12px] transition-colors',
                !selected
                  ? 'bg-white/[0.06] text-white'
                  : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
              )}
            >
              All types
            </button>
            {types.map((type) => (
              <button
                key={type}
                onClick={() => {
                  onChange(type);
                  setOpen(false);
                }}
                className={cn(
                  'w-full rounded px-3 py-1.5 text-left text-[12px] transition-colors',
                  selected === type
                    ? 'bg-white/[0.06] text-white'
                    : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                )}
              >
                {ALL_CHART_TYPE_LABELS[type] || type}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// --- Visibility Filter ---

function VisibilityFilterDropdown({
  selected,
  onChange,
}: {
  selected: VisibilityFilter;
  onChange: (v: VisibilityFilter) => void;
}) {
  const [open, setOpen] = useState(false);

  const options: { mode: VisibilityFilter; label: string; icon: React.ReactNode }[] = [
    { mode: 'all', label: 'All', icon: null },
    { mode: 'public', label: 'Public', icon: <Globe02Icon className="size-3" /> },
    { mode: 'private', label: 'Private', icon: <LockIcon className="size-3" /> },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 py-1.5 text-[11px] font-medium text-white/70 transition-colors hover:border-white/[0.12] hover:text-white'
        )}
      >
        {options.find((o) => o.mode === selected)?.icon}
        {options.find((o) => o.mode === selected)?.label}
        <ArrowDown01Icon className="size-2.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-lg border border-white/[0.08] bg-[#0c0c0e] p-1 shadow-2xl">
            {options.map((opt) => (
              <button
                key={opt.mode}
                onClick={() => {
                  onChange(opt.mode);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-[12px] transition-colors',
                  selected === opt.mode
                    ? 'bg-white/[0.06] text-white'
                    : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// --- Bulk Move Menu ---

function BulkMoveMenu({
  folders,
  selectedIds,
  onMove,
}: {
  folders: SavedFolder[];
  selectedIds: Set<string>;
  onMove: (folderId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-md border border-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white"
      >
        <FolderOpenIcon className="size-3" />
        Move to folder
        <ArrowDown01Icon className="size-2.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-white/[0.08] bg-[#0c0c0e] p-1 shadow-2xl">
            <div className="px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/30">
              Move to folder
            </div>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  onMove(f.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-[12px] text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                <FolderOpenIcon className="size-3.5" />
                {f.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Saved;
