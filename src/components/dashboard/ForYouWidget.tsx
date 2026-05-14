import React from 'react';
import { m } from 'motion/react';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import { useNewsFeed } from '@/hooks/useNews';
import { useNavigate } from 'react-router-dom';

interface ForYouWidgetProps {
  favoriteDriverName?: string;
  favoriteTeamName?: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

const ForYouWidget: React.FC<ForYouWidgetProps> = ({ favoriteDriverName, favoriteTeamName }) => {
  const navigate = useNavigate();
  const hasFavorites = Boolean(favoriteDriverName || favoriteTeamName);

  const { data: articles, isLoading } = useNewsFeed(
    hasFavorites ? { driver: favoriteDriverName, team: favoriteTeamName, limit: 3 } : { limit: 3 }
  );

  const personaLine = hasFavorites
    ? `News for ${favoriteDriverName ?? 'your drivers'} & ${favoriteTeamName ?? 'your teams'}`
    : 'Latest F1 news from top sources';

  const hasArticles = articles && articles.length > 0;

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`${CARD_CONTAINER} flex h-full flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className={CARD_LABEL}>For you</span>
        </div>
      </div>

      <p className="px-5 pb-2 text-[12px] text-white/50">{personaLine}</p>

      {/* Articles */}
      <div className="flex-1 px-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-3 py-2.5 animate-pulse">
              <div className="size-10 shrink-0 rounded bg-white/[0.06]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-full rounded bg-white/[0.06]" />
                <div className="h-2.5 w-2/3 rounded bg-white/[0.04]" />
              </div>
            </div>
          ))
        ) : hasArticles ? (
          articles.slice(0, 3).map((article) => (
            <a
              key={article.id}
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
            >
              <div className="h-12 w-18 shrink-0 overflow-hidden rounded border border-white/[0.06] bg-white/[0.02]">
                {article.image_url ? (
                  <img
                    src={article.image_url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center"></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-[13px] font-medium leading-snug text-white/90">
                  {article.rewritten_title}
                </div>
                <div className="mt-0.5 text-[11px] text-white/40">
                  {article.source_name} · {timeAgo(article.published_at)}
                </div>
              </div>
            </a>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
            <div className="text-[12px] text-white/40">
              No personalized news yet. Articles will appear once the feed updates.
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-white/[0.04] px-5 py-2.5">
        <button
          type="button"
          onClick={() => navigate('/news')}
          className="flex w-full items-center justify-between gap-2 text-[11px] font-medium text-white/50 transition-colors hover:text-white/80"
        >
          <span>View all news</span>
          <span>→</span>
        </button>
      </div>
    </m.div>
  );
};

export default ForYouWidget;
