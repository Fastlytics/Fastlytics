import { useState, useRef, useEffect, useCallback } from 'react';
import { m } from 'motion/react';
import { Link } from 'react-router-dom';
import { News01Icon, LinkSquare01Icon, Message01Icon } from 'hugeicons-react';
import { useInfiniteNewsFeed } from '@/hooks/useNews';
import { useAuth } from '@/contexts/AuthContext';
import { NEWS_SOURCES, NEWS_TOPICS } from '@/lib/news-api';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import { SEO } from '@/components/layout/SEO';
import { useQuery } from '@tanstack/react-query';
import { fetchDriverStandings, fetchTeamStandings } from '@/lib/api';
import { useSeason } from '@/contexts/SeasonContext';

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
  if (diffDays === 1) return 'yesterday';
  return `${diffDays}d ago`;
}

export default function NewsPage() {
  const { profile } = useAuth();
  const { selectedYear } = useSeason();
  const [activeSource, setActiveSource] = useState<string | undefined>(undefined);
  const [activeTopic, setActiveTopic] = useState<string | undefined>(undefined);
  const [showPersonalized, setShowPersonalized] = useState(true);

  // Resolve driver code (e.g. "LEC") to last name (e.g. "Leclerc") for filtering
  const { data: driverStandings } = useQuery({
    queryKey: ['driverStandings', selectedYear],
    queryFn: () => fetchDriverStandings(selectedYear),
    staleTime: 30 * 60 * 1000,
  });

  const { data: teamStandings } = useQuery({
    queryKey: ['teamStandings', selectedYear],
    queryFn: () => fetchTeamStandings(selectedYear),
    staleTime: 30 * 60 * 1000,
  });

  const favoriteDriver = (() => {
    if (!profile?.favorite_driver || !driverStandings?.length) return undefined;
    const driver = driverStandings.find(
      (d) =>
        d.code === profile.favorite_driver ||
        d.name.toLowerCase().includes(profile.favorite_driver.toLowerCase())
    );
    return driver?.name.split(' ').pop(); // Last name
  })();

  const favoriteTeam = (() => {
    if (!profile?.favorite_team || !teamStandings?.length) return undefined;
    const team = teamStandings.find(
      (t) =>
        t.team === profile.favorite_team ||
        t.team.toLowerCase().includes(profile.favorite_team.toLowerCase())
    );
    // Normalize: "Red Bull Racing" -> "Red Bull" to match article tags
    const name = team?.team ?? profile.favorite_team;
    return name?.replace(' Racing', '');
  })();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteNewsFeed({
    driver: showPersonalized ? favoriteDriver : undefined,
    team: showPersonalized ? favoriteTeam : undefined,
    source: activeSource,
  });

  const articles = data?.pages.flat();

  // Client-side topic filter (topics are in the categories array)
  const filteredArticles = activeTopic
    ? articles?.filter((a) => a.categories?.includes(activeTopic))
    : articles;

  const hasFavorites = Boolean(favoriteDriver || favoriteTeam);

  // Infinite scroll: observe a sentinel element at the bottom
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <>
      <SEO
        title="News | Fastlytics"
        description="AI-powered F1 news feed personalized to your favorite drivers and teams."
      />

      <div className="space-y-5 text-white">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold tracking-[-0.01em] text-white">News</h1>
            </div>
            <p className="mt-0.5 text-[12px] text-white/60">
              Personalized F1 news from top sources
            </p>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Personalized toggle */}
          {hasFavorites && (
            <button
              type="button"
              onClick={() => setShowPersonalized(!showPersonalized)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
                showPersonalized
                  ? 'border-sky-400/30 bg-sky-400/10 text-sky-400'
                  : 'border-white/[0.08] text-white/50 hover:border-white/[0.12] hover:text-white/70'
              }`}
            >
              {showPersonalized ? `For ${favoriteDriver || favoriteTeam}` : 'All news'}
            </button>
          )}

          <div className="h-4 w-px bg-white/[0.06]" />

          {/* Source filters */}
          <button
            type="button"
            onClick={() => setActiveSource(undefined)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
              !activeSource
                ? 'border-white/20 bg-white/[0.06] text-white'
                : 'border-white/[0.08] text-white/50 hover:border-white/[0.12] hover:text-white/70'
            }`}
          >
            All sources
          </button>
          {NEWS_SOURCES.map((source) => (
            <button
              key={source.id}
              type="button"
              onClick={() => setActiveSource(activeSource === source.id ? undefined : source.id)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
                activeSource === source.id
                  ? 'border-white/20 bg-white/[0.06] text-white'
                  : 'border-white/[0.08] text-white/50 hover:border-white/[0.12] hover:text-white/70'
              }`}
            >
              {source.name}
            </button>
          ))}
        </div>

        {/* Topic filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`${CARD_LABEL} mr-1`}>Topics</span>
          <button
            type="button"
            onClick={() => setActiveTopic(undefined)}
            className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all ${
              !activeTopic
                ? 'border-white/20 bg-white/[0.06] text-white'
                : 'border-white/[0.06] text-white/40 hover:text-white/60'
            }`}
          >
            All
          </button>
          {NEWS_TOPICS.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => setActiveTopic(activeTopic === topic.id ? undefined : topic.id)}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all ${
                activeTopic === topic.id
                  ? 'border-white/20 bg-white/[0.06] text-white'
                  : 'border-white/[0.06] text-white/40 hover:text-white/60'
              }`}
            >
              {topic.emoji} {topic.label}
            </button>
          ))}
        </div>

        {/* Articles grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className={`${CARD_CONTAINER} animate-pulse overflow-hidden`}>
                <div className="aspect-[16/9] bg-white/[0.04]" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
                  <div className="h-3 w-full rounded bg-white/[0.04]" />
                  <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredArticles && filteredArticles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article, i) => (
              <m.div
                key={article.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: Math.min(i * 0.03, 0.3) }}
                className={`${CARD_CONTAINER} group flex flex-col overflow-hidden transition-colors hover:border-white/[0.08]`}
              >
                {/* Thumbnail — links to discussion */}
                <Link
                  to={`/news/${article.id}`}
                  className="relative aspect-[16/9] overflow-hidden bg-white/[0.02]"
                >
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <News01Icon className="size-8 text-white/10" />
                    </div>
                  )}
                  {/* Source badge overlay */}
                  <div className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                    {article.source_name}
                  </div>
                </Link>

                {/* Content — links to discussion */}
                <Link to={`/news/${article.id}`} className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-[14px] font-medium leading-snug text-white/90 group-hover:text-white">
                    {article.rewritten_title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-white/50">
                    {article.summary}
                  </p>

                  {/* Tags */}
                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
                    <span className="text-[11px] text-white/30">
                      {timeAgo(article.published_at)}
                    </span>
                    {article.drivers.length > 0 && (
                      <>
                        <span className="text-white/20">·</span>
                        {article.drivers.slice(0, 2).map((d) => (
                          <span
                            key={d}
                            className="rounded border border-sky-400/20 px-1.5 py-0.5 text-[10px] font-medium text-sky-400/80"
                          >
                            {d}
                          </span>
                        ))}
                      </>
                    )}
                    {article.teams.length > 0 && (
                      <>
                        {article.drivers.length === 0 && <span className="text-white/20">·</span>}
                        {article.teams.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="rounded border border-emerald-400/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400/80"
                          >
                            {t}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </Link>

                {/* Footer — discussion count + read article link */}
                <div className="flex items-center justify-between border-t border-white/[0.04] px-4 py-2.5">
                  <Link
                    to={`/news/${article.id}`}
                    className="flex items-center gap-1.5 text-[11px] text-white/40 transition-colors hover:text-white/70"
                  >
                    <Message01Icon size={12} />
                    <span>{article.comment_count || 0} comments</span>
                  </Link>
                  <a
                    href={article.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-[11px] text-white/40 transition-colors hover:text-white/70"
                  >
                    Read article
                    <LinkSquare01Icon size={11} />
                  </a>
                </div>
              </m.div>
            ))}
          </div>
        ) : (
          <div
            className={`${CARD_CONTAINER} flex flex-col items-center justify-center px-4 py-16 text-center`}
          >
            <News01Icon className="mb-3 size-8 text-white/20" />
            <div className="text-[14px] font-medium text-white/60">No articles found</div>
            <div className="mt-1 text-[12px] text-white/40">
              {showPersonalized
                ? 'Try showing all news or adjusting your filters'
                : 'News articles will appear here once the feed updates'}
            </div>
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={loadMoreRef} className="h-10" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          </div>
        )}
      </div>
    </>
  );
}
