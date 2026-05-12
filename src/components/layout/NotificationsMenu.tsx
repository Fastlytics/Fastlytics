import { useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Notification03Icon, Message01Icon, News01Icon } from 'hugeicons-react';
import {
  useNewsNotifications,
  useDiscussionNotifications,
  useMarkNotificationsRead,
  useMarkDiscussionNotificationsRead,
} from '@/hooks/useNews';
import { Link } from 'react-router-dom';

export interface NotificationsMenuProps {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

export function NotificationsMenu({ open, onClose, triggerRef }: NotificationsMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: newsNotifications } = useNewsNotifications();
  const { data: discussionNotifications } = useDiscussionNotifications();
  const markNewsRead = useMarkNotificationsRead();
  const markDiscussionRead = useMarkDiscussionNotificationsRead();

  const hasNews = newsNotifications && newsNotifications.length > 0;
  const hasDiscussion = discussionNotifications && discussionNotifications.length > 0;
  const hasAny = hasNews || hasDiscussion;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current && containerRef.current.contains(target)) return;
      if (triggerRef?.current && triggerRef.current.contains(target)) return;
      onClose();
    };
    const timeoutId = window.setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handler);
    };
  }, [open, onClose, triggerRef]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleMarkAllRead = () => {
    if (hasNews) markNewsRead.mutate({ all: true });
    if (hasDiscussion) markDiscussionRead.mutate({ all: true });
  };

  return (
    <AnimatePresence>
      {open && (
        <m.div
          ref={containerRef}
          initial={{ opacity: 0, y: 4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          role="dialog"
          aria-label="Notifications"
          className="absolute bottom-full left-0 z-50 mb-2 w-[300px] overflow-hidden rounded-lg border border-white/[0.08] bg-[#0a0a0a] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[12px] font-medium text-white">Notifications</span>
            {hasAny && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-white/50 transition-colors hover:text-white/80"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="my-1 h-px bg-white/[0.06]" />

          {hasAny ? (
            <div className="max-h-[360px] overflow-y-auto">
              {/* Discussion notifications (replies) */}
              {discussionNotifications?.map((notif) => (
                <Link
                  key={notif.id}
                  to={`/news/${notif.article_id}`}
                  onClick={() => {
                    markDiscussionRead.mutate({ notificationIds: [notif.id] });
                    onClose();
                  }}
                  className="flex items-start gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-sky-400/10">
                    <Message01Icon size={10} className="text-sky-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-white/80">
                      <span className="font-medium text-white/90">
                        {notif.triggered_by_profile?.username ||
                          notif.triggered_by_profile?.full_name ||
                          'Someone'}
                      </span>
                      {' replied to your comment'}
                    </div>
                    {notif.comment_body && (
                      <div className="mt-0.5 line-clamp-1 text-[11px] text-white/40 italic">
                        &ldquo;{notif.comment_body}&rdquo;
                      </div>
                    )}
                    <div className="mt-0.5 text-[10px] text-white/30">
                      {notif.article_title} · {timeAgo(notif.created_at)}
                    </div>
                  </div>
                </Link>
              ))}

              {/* News notifications */}
              {newsNotifications?.map((notif) => (
                <a
                  key={notif.id}
                  href={notif.article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => markNewsRead.mutate({ notificationIds: [notif.id] })}
                  className="flex items-start gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10">
                    <News01Icon size={10} className="text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-[12px] text-white/80">
                      {notif.article.rewritten_title}
                    </div>
                    <div className="mt-0.5 text-[10px] text-white/30">
                      {notif.article.source_name} · {timeAgo(notif.article.published_at)}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <div className="mb-3 flex size-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02]">
                <Notification03Icon size={20} className="text-white/60" />
              </div>
              <div className="text-[12px] font-medium text-white">You&apos;re all caught up</div>
              <div className="mt-1 text-[11px] text-white/80">
                We&apos;ll notify you when someone replies to your comments
              </div>
            </div>
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
}

export default NotificationsMenu;
