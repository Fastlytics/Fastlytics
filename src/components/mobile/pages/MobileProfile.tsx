import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
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
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';
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

const MobileProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('comments');
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch public profile (same Supabase query as desktop)
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

  // Fetch user's comments (same query as desktop)
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

  // Fetch saved charts (same query as desktop)
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

      if (!isOwnProfile) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;
      if (error) return [];
      return (data || []) as SavedChart[];
    },
    enabled: !!profile?.id && activeTab === 'saved' && showSaved,
  });

  // --- Loading state ---
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm pt-3 px-4 pb-2 border-b border-white/[0.04]">
          <div className="flex items-center justify-center">
            <FastlyticsLogo size={22} />
          </div>
        </div>
        <div className="px-4 py-6 space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full bg-white/[0.04]" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-32 rounded bg-white/[0.04]" />
                <div className="h-4 w-20 rounded bg-white/[0.04]" />
              </div>
            </div>
            <div className="h-16 rounded-lg bg-white/[0.04]" />
          </div>
        </div>
      </div>
    );
  }

  // --- Not found ---
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm pt-3 px-4 pb-2 border-b border-white/[0.04]">
          <div className="flex items-center justify-center">
            <FastlyticsLogo size={22} />
          </div>
        </div>
        <div className="px-4 py-10">
          <div className="flex flex-col items-center justify-center rounded-lg border border-white/[0.04] px-6 py-16 text-center">
            <h3 className="text-[14px] font-medium text-white">User not found</h3>
            <p className="mt-1 text-[12px] text-white/40">
              This profile doesn't exist or has been removed.
            </p>
            <Link
              to="/dashboard"
              className="mt-4 rounded-lg border border-white/[0.08] px-4 py-2 text-[12px] font-medium text-white transition-colors active:scale-[0.98] active:bg-white/[0.04]"
            >
              Back to Dashboard
            </Link>
          </div>
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
    { key: 'saved', label: 'Saved', icon: Bookmark02Icon },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Sticky logo header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm pt-3 px-4 pb-2 border-b border-white/[0.04]">
        <div className="flex items-center justify-center">
          <FastlyticsLogo size={22} />
        </div>
      </div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-4 pt-5 pb-4"
      >
        {/* Avatar + Name */}
        <div className="flex items-start gap-4">
          <Avatar className="size-16 shrink-0 border border-white/[0.06]">
            <AvatarImage src={profile.avatar_url ?? undefined} className="object-cover" />
            <AvatarFallback className="bg-white/[0.04] text-[18px] font-medium text-white">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h1 className="text-[18px] font-semibold tracking-tight text-white">{displayName}</h1>
            {profile.username && <p className="text-[12px] text-white/40">@{profile.username}</p>}

            {/* Bio */}
            {profile.bio && (
              <p className="mt-2 text-[13px] leading-relaxed text-white/80">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-sky-400 transition-colors active:text-sky-300"
            >
              <LinkSquare01Icon className="size-3" />
              {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          )}
          {joinDate && (
            <span className="flex items-center gap-1 text-[11px] text-white/40">
              <Calendar03Icon className="size-3" />
              Joined {joinDate}
            </span>
          )}
        </div>

        {/* Favorite badges */}
        {showFavorites && (profile.favorite_driver || profile.favorite_team) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.favorite_driver && (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] font-medium text-white/80">
                🏎️ {profile.favorite_driver}
              </span>
            )}
            {profile.favorite_team && (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] font-medium text-white/80">
                🏁 {profile.favorite_team}
              </span>
            )}
          </div>
        )}

        {/* Edit button — full width on mobile */}
        {isOwnProfile && (
          <button
            onClick={() => setEditDialogOpen(true)}
            className="mt-4 w-full rounded-lg border border-white/[0.08] px-4 py-2.5 text-[13px] font-medium text-white transition-colors active:scale-[0.98] active:bg-white/[0.04]"
          >
            Edit profile
          </button>
        )}
      </motion.div>

      {/* Profile picture suggestion */}
      {isOwnProfile && !profile.avatar_url && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="mx-4 mb-4 flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
            <Camera01Icon className="size-4 text-white/60" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-white/90">Add a profile picture</p>
            <p className="text-[11px] text-white/50">Help others recognize you in the community.</p>
          </div>
          <button
            onClick={() => setAvatarDialogOpen(true)}
            className="shrink-0 rounded-lg bg-white/[0.08] px-3 py-2 text-[12px] font-medium text-white transition-colors active:scale-[0.98] active:bg-white/[0.12]"
          >
            Upload
          </button>
        </motion.div>
      )}

      {/* Tab navigation */}
      <div className="sticky top-[52px] z-30 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/[0.04]">
        <nav className="flex">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'relative flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-medium transition-colors active:bg-white/[0.02]',
                activeTab === key ? 'text-white' : 'text-white/40'
              )}
            >
              <Icon className="size-3.5" />
              {label}
              {activeTab === key && (
                <motion.div
                  layoutId="mobile-profile-tab-indicator"
                  className="absolute inset-x-4 -bottom-px h-px bg-white"
                  transition={{ duration: 0.2 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="px-4 pt-4 pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'comments' && (
            <motion.div
              key="comments"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15 }}
            >
              {showComments ? (
                <MobileCommentsTab comments={comments} isLoading={isLoadingComments} />
              ) : (
                <PrivateContentMessage />
              )}
            </motion.div>
          )}
          {activeTab === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15 }}
            >
              {showSaved ? (
                <MobileSavedChartsTab
                  charts={savedCharts}
                  isLoading={isLoadingSaved}
                  isOwnProfile={isOwnProfile}
                />
              ) : (
                <PrivateContentMessage />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs (shared with desktop) */}
      {isOwnProfile && (
        <ProfilePictureUpload open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)} />
      )}
      <EditProfileDialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} />
    </div>
  );
};

// --- Mobile Comments Tab ---

function MobileCommentsTab({
  comments,
  isLoading,
}: {
  comments: ProfileComment[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
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
      <div className="flex flex-col items-center justify-center rounded-lg border border-white/[0.04] px-6 py-16 text-center">
        <Comment01Icon className="mb-2 size-5 text-white/40" />
        <p className="text-[13px] font-medium text-white/80">No comments yet</p>
        <p className="mt-0.5 text-[12px] text-white/40">
          Comments on news discussions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {comments.map((comment, i) => (
        <motion.div
          key={comment.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.03 }}
          className="rounded-lg border border-white/[0.04] px-4 py-3"
        >
          <p className="text-[13px] leading-relaxed text-white/90">{comment.body}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[11px] text-white/40">
              {new Date(comment.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {comment.article_id && (
              <Link
                to={`/news/${comment.article_id}`}
                className="text-[11px] text-sky-400/80 transition-colors active:text-sky-300"
              >
                View discussion →
              </Link>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// --- Mobile Saved Charts Tab ---

function MobileSavedChartsTab({
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
      <div className="grid grid-cols-2 gap-2">
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
      <div className="flex flex-col items-center justify-center rounded-lg border border-white/[0.04] px-6 py-16 text-center">
        <Bookmark02Icon className="mb-2 size-5 text-white/40" />
        <p className="text-[13px] font-medium text-white/80">
          {isOwnProfile ? 'No saved charts yet' : 'No public charts'}
        </p>
        <p className="mt-0.5 text-[12px] text-white/40">
          {isOwnProfile
            ? 'Save charts from race pages to build your collection.'
            : "This user hasn't shared any charts publicly."}
        </p>
        {isOwnProfile && (
          <Link
            to="/calendar"
            className="mt-4 rounded-lg border border-white/[0.08] px-4 py-2 text-[12px] font-medium text-white transition-colors active:scale-[0.98] active:bg-white/[0.04]"
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
    <div className="space-y-5">
      {/* Folders */}
      {Array.from(folders.entries()).map(([folderName, folderCharts]) => (
        <div key={folderName}>
          <div className="mb-2 flex items-center gap-2">
            <GridViewIcon className="size-3.5 text-white/40" />
            <h3 className="text-[13px] font-medium text-white">{folderName}</h3>
            <span className="text-[11px] text-white/40">{folderCharts.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {folderCharts.map((chart) => (
              <MobileChartCard key={chart.id} chart={chart} isOwnProfile={isOwnProfile} />
            ))}
          </div>
        </div>
      ))}

      {/* Ungrouped charts */}
      {ungrouped.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {ungrouped.map((chart) => (
            <MobileChartCard key={chart.id} chart={chart} isOwnProfile={isOwnProfile} />
          ))}
        </div>
      )}
    </div>
  );
}

function MobileChartCard({ chart, isOwnProfile }: { chart: SavedChart; isOwnProfile: boolean }) {
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
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative aspect-square overflow-hidden rounded-lg border border-white/[0.04]"
    >
      {/* Chart rendered live */}
      <Link to={href} className="absolute inset-0 active:opacity-80">
        {chart.chart_config ? (
          <SavedChartRenderer
            chartType={chart.chart_type}
            chartConfig={chart.chart_config as Record<string, unknown>}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02]">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/15">
              {chartTypeLabels[chart.chart_type] || chart.chart_type}
            </span>
          </div>
        )}
      </Link>

      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-2.5 py-2">
        <div className="flex items-start justify-between gap-1">
          <p className="truncate text-[11px] font-medium text-white">{chart.title}</p>
          {isOwnProfile && !chart.is_public && (
            <LockIcon className="size-2.5 shrink-0 text-white/40" />
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="rounded bg-white/[0.06] px-1 py-0.5 text-[9px] font-medium text-white/60">
            {chartTypeLabels[chart.chart_type] || chart.chart_type}
          </span>
          <span className="text-[9px] text-white/40">
            {new Date(chart.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function PrivateContentMessage() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-white/[0.04] px-6 py-16 text-center">
      <LockIcon className="mb-2 size-5 text-white/40" />
      <p className="text-[13px] font-medium text-white/40">This account is private</p>
      <p className="mt-0.5 text-[12px] text-white/40">
        This user has chosen to keep their content private.
      </p>
    </div>
  );
}

export default MobileProfile;
