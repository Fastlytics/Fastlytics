import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export interface SaveChartPayload {
  title: string;
  description?: string;
  chart_type: string;
  race_name?: string;
  /** JSON-serialized chart config/params for re-rendering */
  chart_config?: Record<string, unknown>;
  folder_id?: string;
  is_public?: boolean;
}

interface SavedFolder {
  id: string;
  name: string;
  is_public: boolean;
}

/**
 * Hook for saving charts from race pages.
 *
 * Usage:
 * ```tsx
 * const { saveChart, isSaving, folders } = useSaveChart();
 *
 * saveChart({
 *   title: 'VER vs NOR — Bahrain 2025',
 *   chart_type: 'h2h',
 *   race_name: '2025 Bahrain Grand Prix',
 * });
 * ```
 */
export function useSaveChart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's folders for the save dialog
  const { data: folders = [] } = useQuery<SavedFolder[]>({
    queryKey: ['savedFolders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_folders')
        .select('id, name, is_public')
        .eq('user_id', user!.id)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []) as SavedFolder[];
    },
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: async (payload: SaveChartPayload) => {
      if (!user) throw new Error('Must be signed in to save charts');

      const { data, error } = await supabase
        .from('saved_charts')
        .insert({
          user_id: user.id,
          title: payload.title,
          description: payload.description || null,
          chart_type: payload.chart_type,
          race_name: payload.race_name || null,
          chart_config: payload.chart_config || null,
          folder_id: payload.folder_id || null,
          is_public: payload.is_public ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedCharts'] });
      queryClient.invalidateQueries({ queryKey: ['savedFolders'] });
      toast.success('Chart saved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save chart');
    },
  });

  return {
    saveChart: mutation.mutate,
    saveChartAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
    folders,
    isAuthenticated: !!user,
  };
}
