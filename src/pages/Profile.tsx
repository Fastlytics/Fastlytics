import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { m } from 'motion/react';
import {
  Calendar03Icon,
  Bookmark02Icon,
  Comment01Icon,
  LinkSquare01Icon,
  LockIcon,
  GridViewIcon,
  Camera01Icon,
} from 'hugeicons-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SEO } from '@/components/layout/SEO';
import { CARD_CONTAINER } from '@/lib/card-styles';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ProfilePictureUpload } from '@/components/profile/ProfilePictureUpload';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { resolveUploadUrl } from '@/lib/upload-url';
import { SavedChartRenderer, buildChartUrl } from '@/components/saved/SavedChartRenderer';

// --- Types ---

interface PublicProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  favorite_driver: string | null;
  favorite_team: string | null;
  created_at: string;
  is_public: boolean;
  show_favorites: boolean;
  show_comments: boolean;
  show_saved_charts: boolean;
}

interface ProfileComment {
  id: string;
  body: string;
  created_at: string;
  article_id: string;
  article_title: string | null;
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
  folder_name: string | null;
  is_public: boolean;
}

type ProfileTab = 'comments' | 'saved';

// --- Component ---

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('comments');
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch public profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery<PublicProfile | null>({
    queryKey: ['publicProfile', username],
    queryFn: async () => {
      const selectCols =
        'id, username, full_name, avatar_url, website, favorite_driver, favorite_team, is_public, show_favorites, show_comments, show_saved_charts, bio';

      // Try by username first
      const { data } = await supabase
        .from('profiles')
        .select(selectCols)
        .eq('username', username!)
        .maybeSingle();

      if (data) {
        return {
          ...data,
          avatar_url: resolveUploadUrl(data.avatar_url),
          created_at: '',
        } as PublicProfile;
      }

      // Fallback: try by ID
      const { data: byId } = await supabase
        .from('profiles')
        .select(selectCols)
        .eq('id', username!)
        .maybeSingle();

      if (byId) {
        return {
          ...byId,
          avatar_url: resolveUploadUrl(byId.avatar_url),
          created_at: '',
        } as PublicProfile;
      }
      return null;
    },
    enabled: !!username,
  });

  const isOwnProfile = !!user && (user.id === username || user.id === profile?.id);
  const isPrivateToViewer = !isOwnProfile && !(profile?.is_public ?? true);
  const showFavorites = isOwnProfile || (!isPrivateToViewer && (profile?.show_favorites ?? true));
  const showComments = isOwnProfile || (!isPrivateToViewer && (profile?.show_comments ?? true));
  const showSaved = isOwnProfile || (!isPrivateToViewer && (profile?.show_saved_charts ?? true));

  // Fetch user's comments
  const { data: comments = [], isLoading: isLoadingComments } = useQuery<ProfileComment[]>({
    queryKey: ['profileComments', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('id, body, created_at, article_id')
        .eq('user_id', profile!.id)
        .eq('deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) return [];
      return (data || []).map((c) => ({
        ...c,
        article_title: null,
      }));
    },
    enabled: !!profile?.id && activeTab === 'comments' && showComments,
  });

  // Fetch saved charts (public only for other users, all for own profile)
  const { data: savedCharts = [], isLoading: isLoadingSaved } = useQuery<SavedChart[]>({
    queryKey: ['profileSavedCharts', profile?.id, isOwnProfile],
    queryFn: async () => {
      let query = supabase
        .from('saved_charts')
        .select(
          'id, title, description, chart_type, race_name, chart_config, thumbnail_url, created_at, folder_name, is_public'
        )
        .eq('user_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Only show public charts for other users
      if (!isOwnProfile) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;
      if (error) return []; // Table may not exist yet
      return (data || []) as SavedChart[];
    },
    enabled: !!profile?.id && activeTab === 'saved' && showSaved,
  });

  if (isLoadingProfile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="size-20 rounded-full bg-white/[0.04]" />
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-white/[0.04]" />
              <div className="h-4 w-24 rounded bg-white/[0.04]" />
            </div>
          </div>
          <div className="h-20 rounded-lg bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div
          className={cn(
            CARD_CONTAINER,
            'flex flex-col items-center justify-center px-6 py-20 text-center'
          )}
        >
          <h3 className="text-[14px] font-medium text-white">User not found</h3>
          <p className="mt-1 text-[12px] text-white/80">
            This profile doesn't exist or has been removed.
          </p>
          <Link
            to="/dashboard"
            className="mt-4 rounded-md border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/[0.04]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile.full_name || profile.username || 'User';
  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  const tabs: { key: ProfileTab; label: string; icon: typeof Comment01Icon }[] = [
    { key: 'comments', label: 'Comments', icon: Comment01Icon },
    { key: 'saved', label: 'Saved Charts', icon: Bookmark02Icon },
  ];

  return (
    <>
      <SEO
        title={`${displayName} — Profile`}
        description={profile.bio || `${displayName}'s Fastlytics profile`}
      />

      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Profile Header */}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Avatar + Name */}
          <div className="flex items-start gap-4">
            <Avatar className="size-20 border border-white/[0.06]">
              <AvatarImage src={profile.avatar_url ?? undefined} className="object-cover" />
              <AvatarFallback className="bg-white/[0.04] text-[20px] font-medium text-white">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <h1 className="text-[20px] font-semibold tracking-tight text-white">{displayName}</h1>
              {profile.username && <p className="text-[13px] text-white/60">@{profile.username}</p>}

              {/* Bio */}
              {profile.bio && (
                <p className="mt-2 text-[13px] leading-relaxed text-white/80">{profile.bio}</p>
              )}

              {/* Meta row */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[12px] text-sky-400 transition-colors hover:text-sky-300"
                  >
                    <LinkSquare01Icon className="size-3" />
                    {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                )}
                {joinDate && (
                  <span className="flex items-center gap-1 text-[12px] text-white/60">
                    <Calendar03Icon className="size-3" />
                    Joined {joinDate}
                  </span>
                )}
              </div>

              {/* Favorite badges */}
              {showFavorites && (profile.favorite_driver || profile.favorite_team) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.favorite_driver && (
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[11px] font-medium text-white/80">
                      🏎️ {profile.favorite_driver}
                    </span>
                  )}
                  {profile.favorite_team && (
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[11px] font-medium text-white/80">
                      🏁 {profile.favorite_team}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Edit button for own profile */}
            {isOwnProfile && (
              <button
                onClick={() => setEditDialogOpen(true)}
                className="shrink-0 rounded-md border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/[0.04]"
              >
                Edit profile
              </button>
            )}
          </div>
        </m.div>

        {/* Profile picture suggestion for own profile without avatar */}
        {isOwnProfile && !profile.avatar_url && (
          <m.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            className="mt-4 flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
              <Camera01Icon className="size-4 text-white/60" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-white/90">Add a profile picture</p>
              <p className="text-[11px] text-white/50">
                Help others recognize you in the community.
              </p>
            </div>
            <button
              onClick={() => setAvatarDialogOpen(true)}
              className="shrink-0 rounded-md bg-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/[0.12]"
            >
              Upload
            </button>
          </m.div>
        )}

        {/* Tabs */}
        <div className="mt-8 border-b border-white/[0.06]">
          <nav className="flex gap-0">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'relative flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors',
                  activeTab === key ? 'text-white' : 'text-white/60 hover:text-white/80'
                )}
              >
                <Icon className="size-3.5" />
                {label}
                {activeTab === key && (
                  <m.div
                    layoutId="profile-tab-indicator"
                    className="absolute inset-x-0 -bottom-px h-px bg-white"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'comments' &&
            (showComments ? (
              <CommentsTab comments={comments} isLoading={isLoadingComments} />
            ) : (
              <PrivateContentMessage />
            ))}
          {activeTab === 'saved' &&
            (showSaved ? (
              <SavedChartsTab
                charts={savedCharts}
                isLoading={isLoadingSaved}
                isOwnProfile={isOwnProfile}
              />
            ) : (
              <PrivateContentMessage />
            ))}
        </div>
      </div>

      {isOwnProfile && (
        <ProfilePictureUpload open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)} />
      )}

      <EditProfileDialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} />
    </>
  );
};

// --- Comments Tab ---

function CommentsTab({ comments, isLoading }: { comments: ProfileComment[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={`skeleton-${i}`}
            className="h-16 animate-pulse rounded-lg border border-white/[0.04] bg-white/[0.02]"
          />
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div
        className={cn(
          CARD_CONTAINER,
          'flex flex-col items-center justify-center px-6 py-16 text-center'
        )}
      >
        <Comment01Icon className="mb-2 size-5 text-white/60" />
        <p className="text-[13px] text-white/80">No comments yet</p>
        <p className="mt-0.5 text-[12px] text-white/60">
          Comments on news discussions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <m.div
          key={comment.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(CARD_CONTAINER, 'px-4 py-3')}
        >
          <p className="text-[13px] leading-relaxed text-white/90">{comment.body}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[11px] text-white/50">
              {new Date(comment.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {comment.article_id && (
              <Link
                to={`/news/${comment.article_id}`}
                className="text-[11px] text-sky-400/80 transition-colors hover:text-sky-300"
              >
                View discussion →
              </Link>
            )}
          </div>
        </m.div>
      ))}
    </div>
  );
}

// --- Saved Charts Tab ---

function SavedChartsTab({
  charts,
  isLoading,
  isOwnProfile,
}: {
  charts: SavedChart[];
  isLoading: boolean;
  isOwnProfile: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={`skeleton-${i}`}
            className="aspect-square animate-pulse rounded-lg border border-white/[0.04] bg-white/[0.02]"
          />
        ))}
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div
        className={cn(
          CARD_CONTAINER,
          'flex flex-col items-center justify-center px-6 py-16 text-center'
        )}
      >
        <Bookmark02Icon className="mb-2 size-5 text-white/60" />
        <p className="text-[13px] text-white/80">
          {isOwnProfile ? 'No saved charts yet' : 'No public charts'}
        </p>
        <p className="mt-0.5 text-[12px] text-white/60">
          {isOwnProfile
            ? 'Save charts from race pages to build your collection.'
            : "This user hasn't shared any charts publicly."}
        </p>
        {isOwnProfile && (
          <Link
            to="/calendar"
            className="mt-4 rounded-md border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/[0.04]"
          >
            Browse races
          </Link>
        )}
      </div>
    );
  }

  // Group by folder
  const folders = new Map<string, SavedChart[]>();
  const ungrouped: SavedChart[] = [];

  charts.forEach((chart) => {
    if (chart.folder_name) {
      const existing = folders.get(chart.folder_name) || [];
      existing.push(chart);
      folders.set(chart.folder_name, existing);
    } else {
      ungrouped.push(chart);
    }
  });

  return (
    <div className="space-y-6">
      {/* Folders */}
      {Array.from(folders.entries()).map(([folderName, folderCharts]) => (
        <div key={folderName}>
          <div className="mb-2 flex items-center gap-2">
            <GridViewIcon className="size-3.5 text-white/60" />
            <h3 className="text-[13px] font-medium text-white">{folderName}</h3>
            <span className="text-[11px] text-white/50">{folderCharts.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {folderCharts.map((chart) => (
              <ChartCard key={chart.id} chart={chart} isOwnProfile={isOwnProfile} />
            ))}
          </div>
        </div>
      ))}

      {/* Ungrouped charts */}
      {ungrouped.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ungrouped.map((chart) => (
            <ChartCard key={chart.id} chart={chart} isOwnProfile={isOwnProfile} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChartCard({ chart, isOwnProfile }: { chart: SavedChart; isOwnProfile: boolean }) {
  const chartTypeLabels: Record<string, string> = {
    h2h: 'Head to Head',
    speed_trace: 'Speed Trace',
    lap_analysis: 'Lap Analysis',
    strategy: 'Strategy',
    telemetry: 'Telemetry',
    team_pace: 'Team Pace',
  };

  const href =
    chart.chart_type && chart.chart_config
      ? buildChartUrl(chart.chart_type, chart.chart_config as Record<string, unknown>)
      : '#';

  return (
    <m.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(CARD_CONTAINER, 'overflow-hidden aspect-square relative')}
    >
      {/* Chart rendered live inside the card */}
      <Link to={href} className="absolute inset-0">
        {chart.chart_config ? (
          <SavedChartRenderer
            chartType={chart.chart_type}
            chartConfig={chart.chart_config as Record<string, unknown>}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02]">
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/15">
              {chartTypeLabels[chart.chart_type] || chart.chart_type}
            </span>
          </div>
        )}
      </Link>

      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content — overlaid at bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-white">{chart.title}</p>
            {chart.race_name && (
              <p className="mt-0.5 truncate text-[11px] text-white/60">{chart.race_name}</p>
            )}
          </div>
          {isOwnProfile && !chart.is_public && (
            <LockIcon className="size-3 shrink-0 text-white/40" />
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-white/60">
            {chartTypeLabels[chart.chart_type] || chart.chart_type}
          </span>
          <span className="text-[10px] text-white/40">
            {new Date(chart.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>
    </m.div>
  );
}

function PrivateContentMessage() {
  return (
    <div
      className={cn(
        CARD_CONTAINER,
        'flex flex-col items-center justify-center px-6 py-16 text-center'
      )}
    >
      <LockIcon className="mb-2 size-5 text-white/40" />
      <p className="text-[13px] font-medium text-white/60">This account is private</p>
      <p className="mt-0.5 text-[12px] text-white/40">
        This user has chosen to keep their content private.
      </p>
    </div>
  );
}

export default Profile;
