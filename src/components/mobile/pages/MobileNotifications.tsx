import { Link } from 'react-router-dom';
import { Notification03Icon } from 'hugeicons-react';
import {
  useAllNewsNotifications,
  useAllDiscussionNotifications,
  useNewsNotifications,
  useDiscussionNotifications,
  useMarkNotificationsRead,
  useMarkDiscussionNotificationsRead,
} from '@/hooks/useNews';
import { NewsNotification, DiscussionNotification } from '@/lib/news-api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d`;
}

export default function MobileNotifications() {
  const { user } = useAuth();
  const { data: newsNotifications, isLoading: loadingNews } = useAllNewsNotifications();
  const { data: discussionNotifications, isLoading: loadingDiscussion } =
    useAllDiscussionNotifications();
  const { data: unreadNews } = useNewsNotifications();
  const { data: unreadDiscussion } = useDiscussionNotifications();
  const markNewsRead = useMarkNotificationsRead();
  const markDiscussionRead = useMarkDiscussionNotificationsRead();

  const isLoading = loadingNews || loadingDiscussion;
  const unreadCount = (unreadNews?.length ?? 0) + (unreadDiscussion?.length ?? 0);

  // Combine and sort all notifications by date
  const allNotifications = [
    ...(discussionNotifications || []).map((n) => ({
      id: n.id,
      type: 'reply' as const,
      read: n.read,
      created_at: n.created_at,
      sort_date: n.created_at,
      data: n,
    })),
    ...(newsNotifications || []).map((n) => ({
      id: n.id,
      type: 'news' as const,
      read: n.read,
      created_at: n.created_at,
      sort_date: n.article?.published_at || n.created_at,
      data: n,
    })),
  ].sort((a, b) => new Date(b.sort_date).getTime() - new Date(a.sort_date).getTime());

  const hasNotifications = allNotifications.length > 0;

  const handleMarkAllRead = () => {
    markNewsRead.mutate({ all: true });
    markDiscussionRead.mutate({ all: true });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Sticky Logo Header */}
        <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm pt-3 px-4 pb-2 border-b border-white/[0.04]">
          <div className="flex items-center justify-center">
            <FastlyticsLogo size={22} />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <Notification03Icon className="mb-3 size-8 text-white/20" />
          <div className="text-[14px] font-medium text-white/60">Sign in to see notifications</div>
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Sticky Logo Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm pt-3 px-4 pb-2 border-b border-white/[0.04]">
        <div className="flex items-center justify-center">
          <FastlyticsLogo size={22} />
        </div>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[18px] font-semibold tracking-[-0.01em] text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-400 tabular-nums">
              {unreadCount}
            </span>
          )}
        </div>
        {hasNotifications && unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-[12px] font-medium text-white/50 active:text-white/80 transition-colors min-h-[44px] flex items-center"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      {isLoading ? (
        <div className="divide-y divide-white/[0.04]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse px-4 py-4">
              <div className="h-3.5 w-3/4 rounded bg-white/[0.06]" />
              <div className="mt-2 h-3 w-1/3 rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      ) : hasNotifications ? (
        <div className="divide-y divide-white/[0.04]">
          {allNotifications.map((notif) => {
            const isUnread = !notif.read;

            if (notif.type === 'reply') {
              const n = notif.data as DiscussionNotification;
              const who =
                n.triggered_by_profile?.username || n.triggered_by_profile?.full_name || 'Someone';

              return (
                <Link
                  key={notif.id}
                  to={`/news/${n.article_id}`}
                  onClick={() => {
                    if (isUnread) markDiscussionRead.mutate({ notificationIds: [n.id] });
                  }}
                  className={cn(
                    'flex items-start gap-3 px-4 py-4 active:bg-white/[0.03] transition-colors',
                    isUnread ? '' : 'opacity-50'
                  )}
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 flex w-2 shrink-0 justify-center">
                    {isUnread && <span className="size-1.5 rounded-full bg-sky-400" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-white/80">
                      <span className="font-semibold text-white">{who}</span>
                      {' replied to your comment'}
                    </p>
                    {n.comment_body && (
                      <p className="mt-1 line-clamp-2 text-[12px] text-white/40">
                        {n.comment_body}
                      </p>
                    )}
                    <span className="mt-1 block text-[11px] text-white/30">
                      {n.article_title} · {timeAgo(n.created_at)}
                    </span>
                  </div>
                </Link>
              );
            }

            // News notification
            const n = notif.data as NewsNotification;
            return (
              <Link
                key={notif.id}
                to={`/news/${n.article?.id}`}
                onClick={() => {
                  if (isUnread) markNewsRead.mutate({ notificationIds: [n.id] });
                }}
                className={cn(
                  'flex items-start gap-3 px-4 py-4 active:bg-white/[0.03] transition-colors',
                  isUnread ? '' : 'opacity-50'
                )}
              >
                {/* Unread dot */}
                <div className="mt-1.5 flex w-2 shrink-0 justify-center">
                  {isUnread && <span className="size-1.5 rounded-full bg-emerald-400" />}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-white/80">New article about your favorites</p>
                  <p className="mt-0.5 line-clamp-1 text-[13px] font-medium text-white/90">
                    {n.article?.rewritten_title}
                  </p>
                  <span className="mt-1 block text-[11px] text-white/30">
                    {n.article?.source_name} · {timeAgo(n.article?.published_at || n.created_at)}
                  </span>
                </div>

                {/* Small thumbnail */}
                {n.article?.image_url && (
                  <div className="size-11 shrink-0 overflow-hidden rounded">
                    <img src={n.article.image_url} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <Notification03Icon className="mb-3 size-7 text-white/20" />
          <div className="text-[14px] font-medium text-white/50">You&apos;re all caught up</div>
          <div className="mt-1 text-[12px] text-white/30 max-w-[260px]">
            We&apos;ll notify you when there&apos;s news about your favorites or replies to your
            comments
          </div>
        </div>
      )}
    </div>
  );
}
