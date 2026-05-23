import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { m } from 'motion/react';
import {
  UserIcon,
  Settings02Icon,
  SecurityCheckIcon,
  EyeIcon,
  PaintBoardIcon,
  CreditCardIcon,
  AlertDiamondIcon,
  Tick02Icon,
  Cancel01Icon,
  PencilEdit02Icon,
  ApiIcon,
  Copy01Icon,
  Delete02Icon,
  PlusSignIcon,
  StarIcon,
  DashboardSquare02Icon,
} from 'hugeicons-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  fetchDriverStandings,
  fetchTeamStandings,
  type DriverStanding,
  type TeamStanding,
} from '@/lib/api';
import { useAnalytics } from '@/hooks/useAnalytics';
import { SEO } from '@/components/layout/SEO';
import {
  createMcpKeyRecord,
  getMcpUsage,
  getTelemetryAnalysisUsage,
  listMcpKeys,
  purgeAccountData,
  revokeMcpKey,
} from '@/lib/app-data-api';
import { request } from '@/lib/api-client';
import { updateMyProfile } from '@/lib/profile-api';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getTeamLogo } from '@/lib/teamUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { getCurrentSeasonYear, resolveSeasonYear } from '@/lib/seasonUtils';
import UpgradeModal from '@/components/payments/UpgradeModal';
import { ProfilePictureUpload } from '@/components/profile/ProfilePictureUpload';
import { CheckIcon } from '@/pages/auth/icons';

// ─── Types ───────────────────────────────────────────────────────────────────

type SettingsSection =
  | 'profile'
  | 'favorites'
  | 'preferences'
  | 'privacy'
  | 'appearance'
  | 'security'
  | 'subscription'
  | 'api-keys'
  | 'usage'
  | 'danger';

type RaceLandingTab = 'overview' | 'strategy' | 'lap-analysis' | 'head-to-head' | 'telemetry';
type SpeedUnit = 'kmh' | 'mph';

interface UserPreferences {
  defaultSeason: 'auto' | number;
  raceLandingTab: RaceLandingTab;
  speedUnit: SpeedUnit;
  sidebarCollapsed: boolean;
  reducedMotion: boolean;
}

interface PrivacySettings {
  profilePublic: boolean;
  showFavorites: boolean;
  showComments: boolean;
  showSavedCharts: boolean;
}

const PREFS_KEY = 'fastlytics-user-preferences';
const SIDEBAR_COLLAPSE_KEY = 'fastlytics-sidebar-collapsed';

function loadPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) return { ...defaultPreferences(), ...JSON.parse(stored) };
  } catch {
    // Ignore parse errors, fall through to defaults
  }
  return defaultPreferences();
}

function defaultPreferences(): UserPreferences {
  return {
    defaultSeason: 'auto',
    raceLandingTab: 'overview',
    speedUnit: 'kmh',
    sidebarCollapsed: localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === 'true',
    reducedMotion: false,
  };
}

function savePreferences(prefs: UserPreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(prefs.sidebarCollapsed));
}

// ─── Nav Items ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { key: SettingsSection; label: string; icon: typeof UserIcon }[] = [
  { key: 'profile', label: 'Profile', icon: UserIcon },
  { key: 'favorites', label: 'Favorites', icon: StarIcon },
  { key: 'preferences', label: 'Preferences', icon: Settings02Icon },
  { key: 'privacy', label: 'Privacy', icon: EyeIcon },
  { key: 'appearance', label: 'Appearance', icon: PaintBoardIcon },
  { key: 'security', label: 'Security', icon: SecurityCheckIcon },
  { key: 'subscription', label: 'Subscription', icon: CreditCardIcon },
  { key: 'api-keys', label: 'API Keys', icon: ApiIcon },
  { key: 'usage', label: 'Usage', icon: DashboardSquare02Icon },
  { key: 'danger', label: 'Danger Zone', icon: AlertDiamondIcon },
];

// ─── Main Component ──────────────────────────────────────────────────────────

const Settings = () => {
  const { user, profile, refreshProfile, signOut, subscription, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { trackEvent } = useAnalytics();

  const initialSection = (searchParams.get('section') as SettingsSection) || 'profile';
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const [isLoading, setIsLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    firstName: profile?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || '',
    lastName:
      profile?.last_name || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
    username: profile?.username || '',
    email: user?.email || '',
  });
  const [editingField, setEditingField] = useState<
    'firstName' | 'lastName' | 'username' | 'email' | null
  >(null);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    password: '',
    confirmPassword: '',
  });

  // Preferences
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);

  // Privacy
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profilePublic: true,
    showFavorites: true,
    showComments: true,
    showSavedCharts: true,
  });

  // Portal loading
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  // Derive profile form from auth state — reset when profile refreshes (unless actively editing)
  const derivedFirstName =
    profile?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || '';
  const derivedLastName =
    profile?.last_name || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';
  const derivedUsername = profile?.username || '';
  const derivedEmail = user?.email || '';

  if (
    !editingField &&
    (profileForm.firstName !== derivedFirstName ||
      profileForm.lastName !== derivedLastName ||
      profileForm.username !== derivedUsername ||
      profileForm.email !== derivedEmail)
  ) {
    setProfileForm({
      firstName: derivedFirstName,
      lastName: derivedLastName,
      username: derivedUsername,
      email: derivedEmail,
    });
  }

  // Sync section to URL
  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
    setSearchParams(section === 'profile' ? {} : { section });
  };

  // ─── Profile Handlers ────────────────────────────────────────────────────

  const handleSaveField = async (field: 'firstName' | 'lastName' | 'username' | 'email') => {
    if (!user) return;
    setIsLoading(true);
    try {
      let error;
      if (field === 'firstName' || field === 'lastName') {
        const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim();
        const { error: e } = await supabase.auth.updateUser({
          data: { full_name: fullName },
        });
        error = e;
        if (!e) {
          await updateMyProfile({
            full_name: fullName,
            first_name: profileForm.firstName,
            last_name: profileForm.lastName,
          });
        }
      } else if (field === 'username') {
        await updateMyProfile({ username: profileForm.username });
        error = null;
      } else if (field === 'email') {
        if (profileForm.email !== user.email) {
          // Send OTP to the new email address for verification
          const { error: e } = await supabase.auth.updateUser(
            { email: profileForm.email },
            { emailRedirectTo: undefined }
          );
          error = e;
          if (!e) {
            setEmailOtpSent(true);
            toast.info('A verification code has been sent to your new email address.');
            setIsLoading(false);
            return;
          }
        } else {
          setEditingField(null);
          setIsLoading(false);
          return;
        }
      }
      if (error) throw error;
      toast.success('Updated successfully');
      trackEvent('profile_updated', { field });
      await refreshProfile();
      setEditingField(null);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp.trim()) {
      toast.error('Please enter the verification code');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: profileForm.email,
        token: emailOtp,
        type: 'email_change',
      });
      if (error) throw error;
      toast.success('Email updated successfully');
      trackEvent('profile_updated', { field: 'email' });
      await refreshProfile();
      setEditingField(null);
      setEmailOtpSent(false);
      setEmailOtp('');
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEmailOtpSent(false);
    setEmailOtp('');
    setProfileForm({
      firstName: profile?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || '',
      lastName:
        profile?.last_name || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
      username: profile?.username || '',
      email: user?.email || '',
    });
  };

  // ─── Password Handler ────────────────────────────────────────────────────

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (!passwordForm.oldPassword) {
      toast.error('Enter your current password');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
      if (error) throw error;
      toast.success('Password updated');
      setPasswordForm({ oldPassword: '', password: '', confirmPassword: '' });
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Social Connect ──────────────────────────────────────────────────────

  const handleConnectSocial = async (provider: 'google' | 'github' | 'discord') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: provider === 'github' ? 'read:user user:email' : undefined,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.assign(data.url);
    } catch (e: unknown) {
      const err = e as Error;
      if (err.message?.includes('manual linking is disabled')) {
        toast.error('Manual linking is disabled in your Supabase config.');
      } else {
        toast.error(err.message);
      }
      setIsLoading(false);
    }
  };

  const isProviderConnected = (provider: string) =>
    user?.identities?.some((i) => i.provider === provider);

  // ─── Preferences Handler ─────────────────────────────────────────────────

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value };
      savePreferences(next);
      return next;
    });
    toast.success('Preference saved');
  };

  // ─── Privacy Handler ─────────────────────────────────────────────────────

  const updatePrivacy = async <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    if (!user) return;
    setPrivacy((prev) => ({ ...prev, [key]: value }));

    // Persist to profiles table (columns may not exist yet — fail silently)
    const columnMap: Record<string, string> = {
      profilePublic: 'is_public',
      showFavorites: 'show_favorites',
      showComments: 'show_comments',
      showSavedCharts: 'show_saved_charts',
    };
    await updateMyProfile({ [columnMap[key]]: value } as Parameters<typeof updateMyProfile>[0]);
    toast.success('Privacy setting updated');
  };

  // ─── Subscription ────────────────────────────────────────────────────────

  const handleOpenPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const data = await request<{ link: string }>('/api/payments/customer-portal', {
        method: 'POST',
      });
      window.location.assign(data.link);
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to open portal');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  // ─── Danger Zone ─────────────────────────────────────────────────────────

  const handleExportData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [{ data: comments }, { data: charts }] = await Promise.all([
        supabase.from('comments').select('*').eq('user_id', user.id),
        supabase.from('saved_charts').select('*').eq('user_id', user.id),
      ]);
      const exportData = { profile, comments: comments || [], savedCharts: charts || [] };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fastlytics-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported');
    } catch {
      toast.error('Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'This will permanently delete your account and all associated data. This cannot be undone. Are you sure?'
    );
    if (!confirmed) return;
    const doubleConfirm = window.confirm('Last chance. Delete everything?');
    if (!doubleConfirm) return;

    setIsLoading(true);
    try {
      await purgeAccountData();
      await signOut();
      toast.success('Account deleted');
      navigate('/');
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to delete account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch {
      toast.error('Error signing out');
    }
  };

  if (!user) return null;

  return (
    <>
      <SEO title="Settings" description="Manage your Fastlytics settings." noIndex />

      <div className="flex h-[calc(100vh-56px)] overflow-hidden">
        {/* ─── Left Nav ─── */}
        <aside className="hidden w-56 shrink-0 border-r border-white/[0.04] lg:block">
          <div className="sticky top-0 flex h-full flex-col px-3 py-6">
            <h1 className="mb-6 px-3 text-[15px] font-semibold tracking-tight text-white">
              Settings
            </h1>
            <nav className="flex flex-1 flex-col gap-0.5">
              {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => handleSectionChange(key)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-medium transition-all',
                    activeSection === key
                      ? 'bg-white/[0.05] text-white'
                      : 'text-white/60 hover:bg-white/[0.02] hover:text-white/90',
                    key === 'danger' && 'mt-auto text-red-400/80 hover:text-red-400'
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </nav>
            <div className="mt-4 border-t border-white/[0.04] pt-4">
              <button
                onClick={handleSignOut}
                className="w-full rounded-md px-3 py-2 text-left text-[12px] font-medium text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* ─── Mobile Nav ─── */}
        <div className="border-b border-white/[0.04] px-4 py-3 lg:hidden">
          <select
            value={activeSection}
            onChange={(e) => handleSectionChange(e.target.value as SettingsSection)}
            className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-[13px] text-white"
          >
            {NAV_ITEMS.map(({ key, label }) => (
              <option key={key} value={key} className="bg-[#0a0a0a]">
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* ─── Content ─── */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-8 py-10">
            <m.div
              key={activeSection}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === 'profile' && (
                <ProfilePanel
                  user={user}
                  profile={profile}
                  form={profileForm}
                  editingField={editingField}
                  isLoading={isLoading}
                  emailOtpSent={emailOtpSent}
                  emailOtp={emailOtp}
                  isVerifyingOtp={isVerifyingOtp}
                  onFormChange={(field, value) => setProfileForm((p) => ({ ...p, [field]: value }))}
                  onStartEdit={setEditingField}
                  onCancelEdit={cancelEdit}
                  onSaveField={handleSaveField}
                  onEmailOtpChange={setEmailOtp}
                  onVerifyEmailOtp={handleVerifyEmailOtp}
                />
              )}
              {activeSection === 'favorites' && (
                <FavoritesPanel user={user} profile={profile} onRefreshProfile={refreshProfile} />
              )}
              {activeSection === 'preferences' && (
                <PreferencesPanel preferences={preferences} onUpdate={updatePreference} />
              )}
              {activeSection === 'privacy' && (
                <PrivacyPanel privacy={privacy} onUpdate={updatePrivacy} />
              )}
              {activeSection === 'appearance' && (
                <AppearancePanel preferences={preferences} onUpdate={updatePreference} />
              )}
              {activeSection === 'security' && (
                <SecurityPanel
                  passwordForm={passwordForm}
                  isLoading={isLoading}
                  isProviderConnected={isProviderConnected}
                  onPasswordChange={(field, value) =>
                    setPasswordForm((p) => ({ ...p, [field]: value }))
                  }
                  onSubmitPassword={handleUpdatePassword}
                  onConnectSocial={handleConnectSocial}
                />
              )}
              {activeSection === 'subscription' && (
                <SubscriptionPanel
                  subscription={subscription}
                  isSubscribed={isSubscribed}
                  isOpeningPortal={isOpeningPortal}
                  onOpenPortal={handleOpenPortal}
                  onUpgrade={() => setUpgradeOpen(true)}
                />
              )}
              {activeSection === 'api-keys' && <ApiKeysPanel userId={user?.id} />}
              {activeSection === 'usage' && (
                <UsagePanel subscription={subscription} isSubscribed={isSubscribed} />
              )}
              {activeSection === 'danger' && (
                <DangerPanel
                  isLoading={isLoading}
                  onExport={handleExportData}
                  onDelete={handleDeleteAccount}
                />
              )}
            </m.div>
          </div>
        </main>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        cancelPath="/settings?section=subscription"
      />
    </>
  );
};

export default Settings;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION PANELS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Shared UI ───────────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-[16px] font-semibold tracking-tight text-white">{title}</h2>
      {description && <p className="mt-1 text-[13px] text-white/60">{description}</p>}
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] py-4 last:border-0">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-white">{label}</p>
        {description && <p className="mt-0.5 text-[12px] text-white/50">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        checked ? 'bg-white' : 'bg-white/[0.12]'
      )}
    >
      <span
        className={cn(
          'inline-block size-3.5 rounded-full transition-transform',
          checked ? 'translate-x-[18px] bg-black' : 'translate-x-[3px] bg-white/60'
        )}
      />
    </button>
  );
}

function SelectField({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-white/[0.08] bg-transparent px-2.5 py-1.5 text-[12px] font-medium text-white outline-none transition-colors hover:border-white/[0.12] focus:border-white/[0.16]"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-[#0a0a0a]">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ─── Profile Panel ───────────────────────────────────────────────────────────

function ProfilePanel({
  user,
  profile,
  form,
  editingField,
  isLoading,
  emailOtpSent,
  emailOtp,
  isVerifyingOtp,
  onFormChange,
  onStartEdit,
  onCancelEdit,
  onSaveField,
  onEmailOtpChange,
  onVerifyEmailOtp,
}: {
  user: { email?: string; user_metadata?: { avatar_url?: string; full_name?: string } };
  profile: {
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  } | null;
  form: { firstName: string; lastName: string; username: string; email: string };
  editingField: 'firstName' | 'lastName' | 'username' | 'email' | null;
  isLoading: boolean;
  emailOtpSent: boolean;
  emailOtp: string;
  isVerifyingOtp: boolean;
  onFormChange: (field: string, value: string) => void;
  onStartEdit: (field: 'firstName' | 'lastName' | 'username' | 'email') => void;
  onCancelEdit: () => void;
  onSaveField: (field: 'firstName' | 'lastName' | 'username' | 'email') => void;
  onEmailOtpChange: (value: string) => void;
  onVerifyEmailOtp: () => void;
}) {
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>(
    'idle'
  );
  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
  const displayName =
    `${form.firstName} ${form.lastName}`.trim() || user.email?.split('@')[0] || '';

  // Debounced username availability check
  useEffect(() => {
    if (editingField !== 'username') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsernameStatus('idle');
      return;
    }

    const value = form.username.trim();
    if (value === (profile?.username || '')) {
      setUsernameStatus('idle');
      return;
    }
    if (!value || value.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');

    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    usernameDebounceRef.current = setTimeout(async () => {
      try {
        const { data } = await supabase.rpc('check_username_available', {
          desired_username: value,
        });
        setUsernameStatus(data === true ? 'available' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 400);

    return () => {
      if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    };
  }, [form.username, editingField, profile?.username]);

  const isUsernameSaveDisabled =
    editingField === 'username' &&
    form.username.trim() !== (profile?.username || '') &&
    usernameStatus !== 'available';

  return (
    <>
      <SectionHeader
        title="Profile"
        description="Manage your personal information and how others see you on Fastlytics."
      />

      {/* Profile Card Header */}
      <div className="mb-8 rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent p-6">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setAvatarDialogOpen(true)}
            className="group relative shrink-0"
            aria-label="Change profile picture"
          >
            <Avatar className="size-[72px] border-2 border-white/[0.08] shadow-lg transition-all group-hover:border-white/[0.16]">
              <AvatarImage src={avatarUrl ?? undefined} className="object-cover" />
              <AvatarFallback className="bg-white/[0.04] text-[18px] font-semibold text-white">
                {(form.firstName?.[0] || user.email?.[0] || '').toUpperCase()}
                {(form.lastName?.[0] || '').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
              <PencilEdit02Icon className="size-4 text-white" />
            </div>
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[16px] font-semibold text-white">{displayName}</h3>
            {profile?.username && (
              <p className="mt-0.5 text-[13px] text-white/50">@{profile.username}</p>
            )}
            <p className="mt-0.5 text-[12px] text-white/40">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => setAvatarDialogOpen(true)}
            className="shrink-0 rounded-lg border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white/70 transition-colors hover:border-white/[0.12] hover:bg-white/[0.03] hover:text-white"
          >
            Change photo
          </button>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="mb-6">
        <h3 className="mb-4 text-[13px] font-semibold text-white">Personal Information</h3>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01]">
          {/* First Name & Last Name Row */}
          <div className="grid grid-cols-2 gap-px border-b border-white/[0.04]">
            {/* First Name */}
            <div className="px-5 py-4">
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">
                First name
              </label>
              {editingField === 'firstName' ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={form.firstName}
                    onChange={(e) => onFormChange('firstName', e.target.value)}
                    placeholder="First name"
                    className="h-8 border-white/[0.08] bg-transparent text-[13px] text-white placeholder:text-white/30 focus:border-white/[0.16] focus:ring-0"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSaveField('firstName');
                      if (e.key === 'Escape') onCancelEdit();
                    }}
                  />
                  <button
                    onClick={() => onSaveField('firstName')}
                    disabled={isLoading}
                    className="text-emerald-400 transition-colors hover:text-emerald-300 disabled:opacity-50"
                  >
                    <Tick02Icon className="size-4" />
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="text-white/50 transition-colors hover:text-white"
                  >
                    <Cancel01Icon className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-white">
                    {form.firstName || <span className="text-white/30">Not set</span>}
                  </p>
                  <button
                    onClick={() => onStartEdit('firstName')}
                    className="rounded-md p-1 text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/70"
                  >
                    <PencilEdit02Icon className="size-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Last Name */}
            <div className="border-l border-white/[0.04] px-5 py-4">
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">
                Last name
              </label>
              {editingField === 'lastName' ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={form.lastName}
                    onChange={(e) => onFormChange('lastName', e.target.value)}
                    placeholder="Last name"
                    className="h-8 border-white/[0.08] bg-transparent text-[13px] text-white placeholder:text-white/30 focus:border-white/[0.16] focus:ring-0"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSaveField('lastName');
                      if (e.key === 'Escape') onCancelEdit();
                    }}
                  />
                  <button
                    onClick={() => onSaveField('lastName')}
                    disabled={isLoading}
                    className="text-emerald-400 transition-colors hover:text-emerald-300 disabled:opacity-50"
                  >
                    <Tick02Icon className="size-4" />
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="text-white/50 transition-colors hover:text-white"
                  >
                    <Cancel01Icon className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-white">
                    {form.lastName || <span className="text-white/30">Not set</span>}
                  </p>
                  <button
                    onClick={() => onStartEdit('lastName')}
                    className="rounded-md p-1 text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/70"
                  >
                    <PencilEdit02Icon className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Username */}
          <div className="border-b border-white/[0.04] px-5 py-4">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">
              Username
            </label>
            {editingField === 'username' ? (
              <div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-white/30">
                      @
                    </span>
                    <Input
                      value={form.username}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                        onFormChange('username', value);
                      }}
                      placeholder="username"
                      className={cn(
                        'h-8 pl-7 border-white/[0.08] bg-transparent text-[13px] text-white placeholder:text-white/30 focus:ring-0',
                        usernameStatus === 'taken' && 'border-red-500/50 focus:border-red-500/70',
                        usernameStatus === 'available' &&
                          'border-emerald-500/50 focus:border-emerald-500/70',
                        usernameStatus !== 'taken' &&
                          usernameStatus !== 'available' &&
                          'focus:border-white/[0.16]'
                      )}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isUsernameSaveDisabled) onSaveField('username');
                        if (e.key === 'Escape') onCancelEdit();
                      }}
                    />
                  </div>
                  {usernameStatus === 'checking' && (
                    <div className="size-4 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  )}
                  {usernameStatus === 'available' && (
                    <svg
                      className="size-4 shrink-0 text-emerald-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                  {usernameStatus === 'taken' && (
                    <svg
                      className="size-4 shrink-0 text-red-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  )}
                  <button
                    onClick={() => onSaveField('username')}
                    disabled={isLoading || isUsernameSaveDisabled}
                    className="text-emerald-400 transition-colors hover:text-emerald-300 disabled:opacity-50"
                  >
                    <Tick02Icon className="size-4" />
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="text-white/50 transition-colors hover:text-white"
                  >
                    <Cancel01Icon className="size-4" />
                  </button>
                </div>
                {usernameStatus === 'taken' && (
                  <p className="mt-1.5 text-[11px] text-red-400">This username is already taken.</p>
                )}
                {usernameStatus === 'available' && (
                  <p className="mt-1.5 text-[11px] text-emerald-400">Username is available!</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-white">
                  {form.username ? (
                    `@${form.username}`
                  ) : (
                    <span className="text-white/30">Not set</span>
                  )}
                </p>
                <button
                  onClick={() => onStartEdit('username')}
                  className="rounded-md p-1 text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/70"
                >
                  <PencilEdit02Icon className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="px-5 py-4">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">
              Email address
            </label>
            {editingField === 'email' ? (
              <div>
                {!emailOtpSent ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={form.email}
                      onChange={(e) => onFormChange('email', e.target.value)}
                      placeholder="you@example.com"
                      type="email"
                      className="h-8 border-white/[0.08] bg-transparent text-[13px] text-white placeholder:text-white/30 focus:border-white/[0.16] focus:ring-0"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onSaveField('email');
                        if (e.key === 'Escape') onCancelEdit();
                      }}
                    />
                    <button
                      onClick={() => onSaveField('email')}
                      disabled={isLoading || form.email === user.email}
                      className="shrink-0 rounded-md bg-white px-3 py-1.5 text-[11px] font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
                    >
                      {isLoading ? 'Sending...' : 'Send code'}
                    </button>
                    <button
                      onClick={onCancelEdit}
                      className="text-white/50 transition-colors hover:text-white"
                    >
                      <Cancel01Icon className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="mb-3 text-[12px] text-white/60">
                      We sent a verification code to{' '}
                      <span className="font-medium text-white">{form.email}</span>. Enter it below
                      to confirm the change.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={emailOtp}
                        onChange={(e) => onEmailOtpChange(e.target.value)}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className="h-8 max-w-[180px] border-white/[0.08] bg-transparent text-center font-mono text-[14px] tracking-widest text-white placeholder:text-white/30 focus:border-white/[0.16] focus:ring-0"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') onVerifyEmailOtp();
                          if (e.key === 'Escape') onCancelEdit();
                        }}
                      />
                      <button
                        onClick={onVerifyEmailOtp}
                        disabled={isVerifyingOtp || emailOtp.length < 6}
                        className="shrink-0 rounded-md bg-white px-3 py-1.5 text-[11px] font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
                      >
                        {isVerifyingOtp ? 'Verifying...' : 'Verify'}
                      </button>
                      <button
                        onClick={onCancelEdit}
                        className="text-[11px] text-white/50 transition-colors hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] text-white">{form.email}</p>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    Verified
                  </span>
                </div>
                <button
                  onClick={() => onStartEdit('email')}
                  className="rounded-md p-1 text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/70"
                >
                  <PencilEdit02Icon className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfilePictureUpload open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)} />
    </>
  );
}

// ─── Favorites Panel ─────────────────────────────────────────────────────────

function FavoritesPanel({
  user,
  profile,
  onRefreshProfile,
}: {
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
  profile: NonNullable<ReturnType<typeof useAuth>['profile']>;
  onRefreshProfile: () => Promise<void>;
}) {
  const { trackEvent } = useAnalytics();
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [teams, setTeams] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(profile.favorite_driver);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(profile.favorite_team);
  const [saving, setSaving] = useState(false);
  const year = getCurrentSeasonYear();

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedYear = await resolveSeasonYear(fetchDriverStandings);
        const [d, t] = await Promise.all([
          fetchDriverStandings(resolvedYear),
          fetchTeamStandings(resolvedYear),
        ]);
        setDrivers(d);
        setTeams(t);
      } catch {
        toast.error('Failed to load F1 data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const saveFavorites = async (driver: string | null, team: string | null) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateMyProfile({ favorite_driver: driver, favorite_team: team });
      setSelectedDriver(driver);
      setSelectedTeam(team);
      toast.success('Favorites updated');
      trackEvent('favorites_updated', { driver, team });
      await onRefreshProfile();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const favoriteDriverName = profile.favorite_driver
    ? (drivers.find((d) => d.code === profile.favorite_driver)?.name ?? profile.favorite_driver)
    : null;

  const handleSelectDriver = (code: string) => {
    setSelectedDriver(code === selectedDriver ? null : code);
  };

  const handleSelectTeam = (name: string) => {
    setSelectedTeam(name === selectedTeam ? null : name);
  };

  if (loading) {
    return (
      <>
        <SectionHeader
          title="Favorites"
          description="Your favorite driver and team. They'll be highlighted across the app."
        />
        <div className="flex items-center justify-center py-20">
          <div className="size-5 animate-spin rounded-full border-2 border-white/10 border-t-red-500" />
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader
        title="Favorites"
        description="Your favorite driver and team. They'll be highlighted across the app."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Driver Selection */}
        <div>
          <div className="mb-4">
            <h3 className="text-[13px] font-medium text-white/80">Favorite Driver</h3>
            {profile.favorite_driver && (
              <p className="mt-1 text-[12px] text-white/40">
                Current: <span className="text-white/80">{favoriteDriverName}</span>
              </p>
            )}
          </div>
          <div className="scrollbar-hide max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {drivers.map((driver) => (
              <button
                key={driver.code}
                onClick={() => handleSelectDriver(driver.code)}
                className={cn(
                  'group relative flex w-full items-center gap-4 rounded-xl border p-3 text-left transition-all',
                  selectedDriver === driver.code
                    ? 'border-red-500/40 bg-red-500/[0.06]'
                    : 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.1] hover:bg-white/[0.03]'
                )}
              >
                <Avatar className="size-10 shrink-0 border border-white/[0.06]">
                  <AvatarImage
                    src={getDriverImage(driver.code, year)}
                    className="bg-zinc-800 object-cover object-top"
                  />
                  <AvatarFallback className="bg-white/[0.04] text-[10px] text-white/60">
                    {driver.code}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-white">{driver.name}</div>
                  <div className="mt-0.5 text-[11px] text-white/30">{driver.team}</div>
                </div>
                {selectedDriver === driver.code && (
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500">
                    <CheckIcon className="size-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Team Selection */}
        <div>
          <div className="mb-4">
            <h3 className="text-[13px] font-medium text-white/80">Favorite Team</h3>
            {profile.favorite_team && (
              <p className="mt-1 text-[12px] text-white/40">
                Current: <span className="text-white/80">{profile.favorite_team}</span>
              </p>
            )}
          </div>
          <div className="scrollbar-hide max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {teams.map((team) => (
              <button
                key={team.team}
                onClick={() => handleSelectTeam(team.team)}
                className={cn(
                  'group relative flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all',
                  selectedTeam === team.team
                    ? 'border-red-500/40 bg-red-500/[0.06]'
                    : 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.1] hover:bg-white/[0.03]'
                )}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] p-2">
                  <img
                    src={getTeamLogo(team.team) || ''}
                    alt={team.team}
                    className="size-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-white">{team.team}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] tabular-nums text-white/40">
                    <span>{team.points} pts</span>
                    <span className="text-white/15">·</span>
                    <span>{team.wins} wins</span>
                  </div>
                </div>
                {selectedTeam === team.team && (
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500">
                    <CheckIcon className="size-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(selectedDriver !== profile.favorite_driver || selectedTeam !== profile.favorite_team) && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => saveFavorites(selectedDriver, selectedTeam)}
            disabled={saving}
            className="rounded-lg bg-white px-6 py-2.5 text-[13px] font-semibold text-black transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.08)] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      )}
    </>
  );
}

// ─── Preferences Panel ───────────────────────────────────────────────────────

function PreferencesPanel({
  preferences,
  onUpdate,
}: {
  preferences: UserPreferences;
  onUpdate: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}) {
  const seasonOptions = [
    { value: 'auto', label: 'Auto-detect (latest)' },
    { value: '2025', label: '2025' },
    { value: '2024', label: '2024' },
    { value: '2023', label: '2023' },
    { value: '2022', label: '2022' },
    { value: '2021', label: '2021' },
    { value: '2020', label: '2020' },
    { value: '2019', label: '2019' },
  ];

  const raceTabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'strategy', label: 'Strategy' },
    { value: 'lap-analysis', label: 'Lap Analysis' },
    { value: 'head-to-head', label: 'Head to Head' },
    { value: 'telemetry', label: 'Telemetry' },
  ];

  const speedUnits = [
    { value: 'kmh', label: 'km/h' },
    { value: 'mph', label: 'mph' },
  ];

  return (
    <>
      <SectionHeader title="Preferences" description="Customize how Fastlytics works for you." />

      <div className="rounded-lg border border-white/[0.04]">
        <div className="px-5">
          <SettingRow
            label="Default season"
            description="Which season to load when you open the app"
          >
            <SelectField
              value={String(preferences.defaultSeason)}
              options={seasonOptions}
              onChange={(v) => onUpdate('defaultSeason', v === 'auto' ? 'auto' : Number(v))}
            />
          </SettingRow>

          <SettingRow
            label="Race landing tab"
            description="Which tab to show first when opening a race"
          >
            <SelectField
              value={preferences.raceLandingTab}
              options={raceTabs}
              onChange={(v) => onUpdate('raceLandingTab', v as RaceLandingTab)}
            />
          </SettingRow>

          <SettingRow label="Speed units" description="Unit for speed trace and telemetry charts">
            <SelectField
              value={preferences.speedUnit}
              options={speedUnits}
              onChange={(v) => onUpdate('speedUnit', v as SpeedUnit)}
            />
          </SettingRow>
        </div>
      </div>
    </>
  );
}

// ─── Privacy Panel ───────────────────────────────────────────────────────────

function PrivacyPanel({
  privacy,
  onUpdate,
}: {
  privacy: PrivacySettings;
  onUpdate: <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => void;
}) {
  return (
    <>
      <SectionHeader
        title="Privacy"
        description="Control what others can see on your profile. When your profile is private, visitors see a locked state with no personal data."
      />

      <div className="rounded-lg border border-white/[0.04]">
        <div className="px-5">
          <SettingRow
            label="Public profile"
            description="When off, your profile page shows a locked state to others"
          >
            <Toggle
              checked={privacy.profilePublic}
              onChange={(v) => onUpdate('profilePublic', v)}
            />
          </SettingRow>

          <SettingRow
            label="Show favorites"
            description="Display your favorite driver and team on your profile"
          >
            <Toggle
              checked={privacy.showFavorites}
              onChange={(v) => onUpdate('showFavorites', v)}
            />
          </SettingRow>

          <SettingRow
            label="Show comments"
            description="Display your comment history on your profile"
          >
            <Toggle checked={privacy.showComments} onChange={(v) => onUpdate('showComments', v)} />
          </SettingRow>

          <SettingRow
            label="Show saved charts"
            description="Display your public saved charts on your profile"
          >
            <Toggle
              checked={privacy.showSavedCharts}
              onChange={(v) => onUpdate('showSavedCharts', v)}
            />
          </SettingRow>
        </div>
      </div>
    </>
  );
}

// ─── Appearance Panel ────────────────────────────────────────────────────────

function AppearancePanel({
  preferences,
  onUpdate,
}: {
  preferences: UserPreferences;
  onUpdate: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}) {
  return (
    <>
      <SectionHeader title="Appearance" description="Adjust the look and feel of the interface." />

      <div className="rounded-lg border border-white/[0.04]">
        <div className="px-5">
          <SettingRow label="Theme" description="More themes coming soon">
            <span className="rounded-md border border-white/[0.08] px-2.5 py-1 text-[12px] font-medium text-white/60">
              Dark
            </span>
          </SettingRow>

          <SettingRow
            label="Sidebar default"
            description="Start with the sidebar collapsed or expanded"
          >
            <SelectField
              value={preferences.sidebarCollapsed ? 'collapsed' : 'expanded'}
              options={[
                { value: 'expanded', label: 'Expanded' },
                { value: 'collapsed', label: 'Collapsed' },
              ]}
              onChange={(v) => onUpdate('sidebarCollapsed', v === 'collapsed')}
            />
          </SettingRow>

          <SettingRow label="Reduced motion" description="Minimize animations throughout the app">
            <Toggle
              checked={preferences.reducedMotion}
              onChange={(v) => onUpdate('reducedMotion', v)}
            />
          </SettingRow>
        </div>
      </div>
    </>
  );
}

// ─── Security Panel ──────────────────────────────────────────────────────────

function SecurityPanel({
  passwordForm,
  isLoading,
  isProviderConnected,
  onPasswordChange,
  onSubmitPassword,
  onConnectSocial,
}: {
  passwordForm: { oldPassword: string; password: string; confirmPassword: string };
  isLoading: boolean;
  isProviderConnected: (provider: string) => boolean | undefined;
  onPasswordChange: (field: string, value: string) => void;
  onSubmitPassword: (e: FormEvent) => void;
  onConnectSocial: (provider: 'google' | 'github' | 'discord') => void;
}) {
  const socials: {
    provider: 'google' | 'github' | 'discord';
    icon: typeof faGoogle;
    label: string;
  }[] = [
    { provider: 'google', icon: faGoogle, label: 'Google' },
    { provider: 'github', icon: faGithub, label: 'GitHub' },
    { provider: 'discord', icon: faDiscord, label: 'Discord' },
  ];

  return (
    <>
      <SectionHeader title="Security" description="Manage your password and connected accounts." />

      {/* Password */}
      <div className="mb-8">
        <h3 className="mb-4 text-[13px] font-medium text-white">Change password</h3>
        <form onSubmit={onSubmitPassword} className="max-w-sm space-y-3">
          {[
            { id: 'oldPassword', label: 'Current password', field: 'oldPassword' },
            { id: 'password', label: 'New password', field: 'password' },
            { id: 'confirmPassword', label: 'Confirm new password', field: 'confirmPassword' },
          ].map(({ id, label, field }) => (
            <div key={id}>
              <label htmlFor={id} className="mb-1 block text-[11px] font-medium text-white/50">
                {label}
              </label>
              <Input
                id={id}
                type="password"
                value={passwordForm[field as keyof typeof passwordForm]}
                onChange={(e) => onPasswordChange(field, e.target.value)}
                placeholder={label}
                className="h-9 border-white/[0.08] bg-transparent text-[13px] text-white placeholder:text-white/30 focus:border-white/[0.16] focus:ring-0"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={isLoading || !passwordForm.password || !passwordForm.oldPassword}
            className="rounded-md bg-white px-3 py-1.5 text-[12px] font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>

      {/* Connected accounts */}
      <div>
        <h3 className="mb-4 text-[13px] font-medium text-white">Connected accounts</h3>
        <div className="rounded-lg border border-white/[0.04]">
          {socials.map((social) => {
            const connected = isProviderConnected(social.provider);
            return (
              <div
                key={social.provider}
                className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3.5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={social.icon} className="text-[14px] text-white/70" />
                  <span className="text-[13px] text-white">{social.label}</span>
                </div>
                {connected ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                    <Tick02Icon className="size-3" /> Connected
                  </span>
                ) : (
                  <button
                    onClick={() => onConnectSocial(social.provider)}
                    disabled={isLoading}
                    className="rounded-md border border-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Subscription Panel ──────────────────────────────────────────────────────

function SubscriptionPanel({
  subscription,
  isSubscribed,
  isOpeningPortal,
  onOpenPortal,
  onUpgrade,
}: {
  subscription: {
    plan: string;
    billing_interval?: string | null;
    current_period_end?: string;
  } | null;
  isSubscribed: (tier?: 'pro' | 'ultra') => boolean;
  isOpeningPortal: boolean;
  onOpenPortal: () => void;
  onUpgrade: () => void;
}) {
  const hasPaid = isSubscribed('pro');

  return (
    <>
      <SectionHeader title="Subscription" description="Manage your plan and billing." />

      {hasPaid && subscription ? (
        <>
          <div className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/[0.04]">
            <div className="bg-white/[0.01] px-5 py-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/50">Plan</p>
              <p className="mt-1 text-[14px] font-semibold capitalize text-white">
                {subscription.plan}
              </p>
            </div>
            <div className="border-l border-white/[0.04] bg-white/[0.01] px-5 py-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/50">
                Billing
              </p>
              <p className="mt-1 text-[14px] font-semibold capitalize text-white">
                {subscription.billing_interval || 'Monthly'}
              </p>
            </div>
            <div className="border-l border-white/[0.04] bg-white/[0.01] px-5 py-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/50">
                Renews
              </p>
              <p className="mt-1 text-[14px] font-semibold text-white">
                {subscription.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString()
                  : 'Active'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenPortal}
              disabled={isOpeningPortal}
              className="rounded-md bg-white px-3 py-1.5 text-[12px] font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
            >
              {isOpeningPortal ? 'Opening...' : 'Manage subscription'}
            </button>
            <button
              onClick={onOpenPortal}
              disabled={isOpeningPortal}
              className="text-[12px] font-medium text-red-400/80 transition-colors hover:text-red-400"
            >
              Cancel plan
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-white/[0.04] px-6 py-8">
          <div className="flex items-start gap-4">
            <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-2">
              <CreditCardIcon className="size-5 text-white/60" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-white">Free plan</p>
              <p className="mt-1 max-w-md text-[13px] leading-relaxed text-white/60">
                Upgrade to Pro to unlock historical seasons, session replay, advanced telemetry, and
                unlimited saved charts.
              </p>
              <button
                onClick={onUpgrade}
                className="mt-4 rounded-md bg-white px-4 py-2 text-[12px] font-medium text-black transition-colors hover:bg-white/90"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── API Keys Panel ──────────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
}

interface UsageLogEntry {
  tool_name: string;
  created_at: string;
}

function ApiKeysPanel({ userId }: { userId: string | null | undefined }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const { trackEvent } = useAnalytics();

  const loadKeys = async () => {
    const data = await listMcpKeys();
    setKeys(data as ApiKey[]);
  };

  useEffect(() => {
    async function init() {
      await loadKeys();
      setLoading(false);
    }
    init();
  }, []);

  async function generateKey(): Promise<{ raw: string; hash: string; prefix: string }> {
    const raw = 'fl_mcp_' + crypto.randomUUID().replace(/-/g, '');
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return { raw, hash, prefix: raw.slice(0, 15) };
  }

  async function handleCreateKey(e: FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    if (!userId) {
      toast.error('You must be signed in to create an API key');
      return;
    }
    setCreating(true);
    try {
      const { raw, hash, prefix } = await generateKey();
      await createMcpKeyRecord({ name: newKeyName.trim(), key_hash: hash, key_prefix: prefix });
      setNewKeyValue(raw);
      setNewKeyName('');
      await loadKeys();
      trackEvent('api_key_created');
    } catch {
      toast.error('Failed to create key');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevokeKey(id: string) {
    await revokeMcpKey(id);
    toast.success('Key revoked');
    await loadKeys();
    trackEvent('api_key_revoked');
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-white/5" />
        <div className="h-24 rounded bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Key creation */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-white/90">Create API Key</h2>
        <form onSubmit={handleCreateKey} className="flex gap-2">
          <Input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g. My Laptop)"
            className="flex-1"
            disabled={creating}
          />
          <button
            type="submit"
            disabled={creating || !newKeyName.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30 disabled:opacity-50"
          >
            <PlusSignIcon className="size-3.5" />
            Generate
          </button>
        </form>

        {newKeyValue && (
          <div className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
            <p className="mb-2 text-xs font-medium text-emerald-400">
              Key created — copy it now. You won't see it again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-black/30 px-3 py-1.5 text-xs font-mono text-white/80 break-all">
                {newKeyValue}
              </code>
              <button
                onClick={() => copyToClipboard(newKeyValue)}
                className="shrink-0 rounded-md bg-white/10 p-1.5 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
              >
                <Copy01Icon className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing keys */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-white/90">Your Keys</h2>
        {keys.length === 0 ? (
          <p className="text-xs text-white/40">No API keys yet.</p>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className={cn(
                  'flex items-center justify-between rounded-md border px-3 py-2.5 transition-colors',
                  key.revoked ? 'border-red-500/20 bg-red-500/5' : 'border-white/10 bg-white/[0.03]'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white/80">{key.name}</span>
                    {key.revoked && (
                      <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400">
                        Revoked
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-white/40">
                    <code className="font-mono">{key.key_prefix}...</code>
                    <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                    {key.last_used_at && (
                      <span>Last used {new Date(key.last_used_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                {!key.revoked && (
                  <button
                    onClick={() => handleRevokeKey(key.id)}
                    className="ml-2 shrink-0 rounded p-1 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Delete02Icon className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Usage Panel ────────────────────────────────────────────────────────────────

function UsagePanel({
  subscription,
  isSubscribed,
}: {
  subscription: { plan?: string } | null;
  isSubscribed: (tier?: 'pro' | 'ultra') => boolean;
}) {
  const [usage, setUsage] = useState<{ count: number; recent: UsageLogEntry[] }>({
    count: 0,
    recent: [],
  });
  const [aiUsage, setAiUsage] = useState<{ count: number }>({ count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const [usageData, aiUsageData] = await Promise.all([
        getMcpUsage(),
        getTelemetryAnalysisUsage(),
      ]);
      setUsage({ count: usageData.count, recent: usageData.recent as UsageLogEntry[] });
      setAiUsage({ count: aiUsageData.count });
      setLoading(false);
    }
    init();
  }, []);

  const tier = subscription?.plan || (isSubscribed('pro') ? 'pro' : 'free');
  const mcpLimit = tier === 'pro' ? 3000 : 300;
  const aiLimit = tier === 'pro' || tier === 'ultra' ? 100 : 5;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-white/5" />
        <div className="h-24 rounded bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-sm font-semibold text-white/90">MCP API Calls</h2>
        <p className="mb-6 text-[12px] text-white/50">
          Track your monthly usage of Fastlytics data through MCP (Model Context Protocol) tools.
        </p>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500/60 transition-all"
              style={{ width: `${Math.min((usage.count / mcpLimit) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs font-mono text-white/60 tabular-nums">
            {usage.count.toLocaleString()} / {mcpLimit.toLocaleString()}
          </span>
        </div>
        <p className="text-[11px] text-white/40">
          {tier === 'free'
            ? `Free tier: ${mcpLimit.toLocaleString()} calls/month. Upgrade to Pro for ${(mcpLimit * 10).toLocaleString()}.`
            : `Pro tier: ${mcpLimit.toLocaleString()} calls/month.`}
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-white/90">AI Telemetry Analysis</h2>
        <p className="mb-6 text-[12px] text-white/50">
          Monthly credits for advanced AI-powered telemetry analysis.
        </p>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-500/60 transition-all"
              style={{ width: `${Math.min((aiUsage.count / aiLimit) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs font-mono text-white/60 tabular-nums">
            {aiUsage.count.toLocaleString()} / {aiLimit.toLocaleString()}
          </span>
        </div>
        <p className="text-[11px] text-white/40">
          {tier === 'free'
            ? `Free tier: ${aiLimit} analyses/month. Upgrade to Pro for ${100} analyses/month.`
            : `Pro/Ultra tier: ${aiLimit} analyses/month.`}
        </p>
      </div>

      {usage.recent.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-white/90">Recent MCP Calls</h2>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {usage.recent.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded bg-white/[0.03] px-2.5 py-1.5 text-[11px]"
              >
                <code className="font-mono text-white/50">{entry.tool_name}</code>
                <span className="text-white/30">{new Date(entry.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Danger Zone Panel ───────────────────────────────────────────────────────

function DangerPanel({
  isLoading,
  onExport,
  onDelete,
}: {
  isLoading: boolean;
  onExport: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <SectionHeader
        title="Danger Zone"
        description="Irreversible actions. Proceed with caution."
      />

      <div className="space-y-4">
        {/* Export */}
        <div className="flex items-center justify-between rounded-lg border border-white/[0.04] px-5 py-4">
          <div>
            <p className="text-[13px] font-medium text-white">Export your data</p>
            <p className="mt-0.5 text-[12px] text-white/50">
              Download all your comments, saved charts, and profile data as JSON.
            </p>
          </div>
          <button
            onClick={onExport}
            disabled={isLoading}
            className="shrink-0 rounded-md border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/[0.04] disabled:opacity-50"
          >
            {isLoading ? 'Exporting...' : 'Export'}
          </button>
        </div>

        {/* Delete */}
        <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/[0.03] px-5 py-4">
          <div>
            <p className="text-[13px] font-medium text-red-400">Delete account</p>
            <p className="mt-0.5 text-[12px] text-red-400/60">
              Permanently delete your account and all data. This cannot be undone.
            </p>
          </div>
          <button
            onClick={onDelete}
            disabled={isLoading}
            className="shrink-0 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[12px] font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </>
  );
}
