import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  fetchNewsFeed,
  fetchNewsNotifications,
  fetchDiscussionNotifications,
  markNotificationsRead,
  markDiscussionNotificationsRead,
  fetchNewsPreferences,
  updateNewsPreferences,
  type NewsFeedParams,
} from '@/lib/news-api';
import { useAuth } from '@/contexts/AuthContext';

// --- Query Keys ---

export const newsKeys = {
  all: ['news'] as const,
  feed: (params?: NewsFeedParams) => [...newsKeys.all, 'feed', params] as const,
  notifications: () => [...newsKeys.all, 'notifications'] as const,
  preferences: () => [...newsKeys.all, 'preferences'] as const,
};

// --- Hooks ---

/** Fetch the personalized news feed. Filters by driver/team/source. */
export function useNewsFeed(params?: NewsFeedParams) {
  return useQuery({
    queryKey: newsKeys.feed(params),
    queryFn: () => fetchNewsFeed(params),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

const PAGE_SIZE = 20;

/** Infinite scroll news feed. */
export function useInfiniteNewsFeed(params?: Omit<NewsFeedParams, 'limit' | 'offset'>) {
  return useInfiniteQuery({
    queryKey: [...newsKeys.all, 'infinite-feed', params] as const,
    queryFn: ({ pageParam = 0 }) =>
      fetchNewsFeed({ ...params, limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined; // no more pages
      return allPages.length * PAGE_SIZE;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch unread news notifications for the current user. */
export function useNewsNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: newsKeys.notifications(),
    queryFn: () => fetchNewsNotifications(true),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

/** Fetch ALL news notifications (including read) for the notifications page. */
export function useAllNewsNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...newsKeys.all, 'all-notifications'] as const,
    queryFn: () => fetchNewsNotifications(false),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}

/** Fetch unread discussion notifications (replies to your comments). */
export function useDiscussionNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...newsKeys.all, 'discussion-notifications'] as const,
    queryFn: () => fetchDiscussionNotifications(true),
    enabled: !!user,
    staleTime: 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
  });
}

/** Fetch ALL discussion notifications (including read) for the notifications page. */
export function useAllDiscussionNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...newsKeys.all, 'all-discussion-notifications'] as const,
    queryFn: () => fetchDiscussionNotifications(false),
    enabled: !!user,
    staleTime: 60 * 1000,
  });
}

/** Mark notifications as read. */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ notificationIds, all }: { notificationIds?: string[]; all?: boolean }) =>
      markNotificationsRead(notificationIds, all),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.notifications() });
    },
  });
}

/** Fetch user's news source preferences. */
export function useNewsPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: newsKeys.preferences(),
    queryFn: fetchNewsPreferences,
    enabled: !!user,
    staleTime: 30 * 60 * 1000,
  });
}

/** Update user's news source preferences. */
export function useUpdateNewsPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sources: string[]) => updateNewsPreferences(sources),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.preferences() });
      queryClient.invalidateQueries({ queryKey: newsKeys.feed() });
    },
  });
}

/** Mark discussion notifications as read. */
export function useMarkDiscussionNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ notificationIds, all }: { notificationIds?: string[]; all?: boolean }) =>
      markDiscussionNotificationsRead(notificationIds, all),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...newsKeys.all, 'discussion-notifications'] });
    },
  });
}
