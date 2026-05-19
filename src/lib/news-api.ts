import { request } from './api-client';

// --- Types ---

export interface NewsArticle {
  id: string;
  source_name: string;
  source_url: string;
  original_title: string;
  rewritten_title: string;
  summary: string;
  image_url: string | null;
  published_at: string;
  drivers: string[];
  teams: string[];
  categories: string[];
  created_at: string;
  vote_score?: number;
  comment_count?: number;
}

export interface NewsNotification {
  id: string;
  read: boolean;
  created_at: string;
  article: NewsArticle;
}

export interface NewsPreferences {
  id?: string;
  user_id?: string;
  sources: string[];
}

export interface NewsFeedParams {
  driver?: string;
  team?: string;
  source?: string;
  limit?: number;
  offset?: number;
}

// --- Available Sources ---

export const NEWS_SOURCES = [
  { id: 'motorsport', name: 'Motorsport.com', logo: '🏎️' },
  { id: 'the-race', name: 'The Race', logo: '📰' },
  { id: 'formula1', name: 'Formula1.com', logo: '🏆' },
  { id: 'crash-net', name: 'Crash.net', logo: '💥' },
  { id: 'fia', name: 'FIA', logo: '🏛️' },
  { id: 'racefans', name: 'RaceFans', logo: '📊' },
] as const;

export const NEWS_TOPICS = [
  { id: 'race-weekend', label: 'Race Weekend', emoji: '🏁' },
  { id: 'transfers', label: 'Transfers', emoji: '🔄' },
  { id: 'technical', label: 'Technical', emoji: '🔧' },
  { id: 'regulations', label: 'Regulations', emoji: '📋' },
  { id: 'penalties', label: 'Penalties', emoji: '⚠️' },
  { id: 'strategy', label: 'Strategy', emoji: '♟️' },
  { id: 'contracts', label: 'Contracts', emoji: '✍️' },
  { id: 'rookies', label: 'Rookies', emoji: '⭐' },
  { id: 'retirements', label: 'Retirements', emoji: '👋' },
  { id: 'rivalries', label: 'Rivalries', emoji: '⚔️' },
  { id: 'records', label: 'Records', emoji: '📈' },
  { id: 'injuries', label: 'Injuries', emoji: '🏥' },
  { id: 'testing', label: 'Testing', emoji: '🧪' },
  { id: 'budget-cap', label: 'Budget Cap', emoji: '💰' },
  { id: 'sustainability', label: 'Sustainability', emoji: '🌱' },
] as const;

// --- API Functions ---

export async function fetchNewsFeed(params?: NewsFeedParams): Promise<NewsArticle[]> {
  const searchParams = new URLSearchParams();
  if (params?.driver) searchParams.set('driver', params.driver);
  if (params?.team) searchParams.set('team', params.team);
  if (params?.source) searchParams.set('source', params.source);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  const query = searchParams.toString();
  return request<NewsArticle[]>(`/api/news/feed${query ? `?${query}` : ''}`);
}

export async function fetchNewsNotifications(unreadOnly = true): Promise<NewsNotification[]> {
  return request<NewsNotification[]>(
    `/api/news/notifications?unread=${unreadOnly ? 'true' : 'false'}`
  );
}

export interface DiscussionNotification {
  id: string;
  article_id: string;
  comment_id: string;
  triggered_by: string;
  type: 'reply' | 'mention';
  read: boolean;
  created_at: string;
  triggered_by_profile: { username: string | null; full_name: string | null } | null;
  article_title: string | null;
  comment_body: string | null;
}

export async function fetchDiscussionNotifications(
  unreadOnly = true
): Promise<DiscussionNotification[]> {
  return request<DiscussionNotification[]>(
    `/api/news/discussion-notifications?unread=${unreadOnly ? 'true' : 'false'}`
  );
}

export async function markDiscussionNotificationsRead(
  notificationIds?: string[],
  all = false
): Promise<void> {
  await request('/api/news/discussion-notifications/read', {
    method: 'POST',
    body: JSON.stringify(all ? { all: true } : { notification_ids: notificationIds }),
  });
}

export async function markNotificationsRead(
  notificationIds?: string[],
  all = false
): Promise<void> {
  await request('/api/news/notifications/read', {
    method: 'POST',
    body: JSON.stringify(all ? { all: true } : { notification_ids: notificationIds }),
  });
}

export async function fetchNewsPreferences(): Promise<NewsPreferences> {
  return request<NewsPreferences>('/api/news/preferences');
}

export async function updateNewsPreferences(sources: string[]): Promise<NewsPreferences> {
  return request<NewsPreferences>('/api/news/preferences', {
    method: 'POST',
    body: JSON.stringify({ sources }),
  });
}
