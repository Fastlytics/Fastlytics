import type { ElementType, FormEvent, ReactNode } from 'react';
import { m } from 'motion/react';
import type { User } from '@supabase/supabase-js';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CheckmarkCircle01Icon,
  PencilEdit02Icon,
  Tick02Icon,
  Cancel01Icon,
  LinkSquare01Icon,
  Analytics01Icon,
  UserIcon,
  SecurityCheckIcon,
  StarIcon,
} from 'hugeicons-react';
import ActivityItem, { type ActivityItemProps } from '@/components/activity/ActivityItem';
import { cn } from '@/lib/utils';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import type { DriverStanding, TeamStanding } from '@/lib/api';
import { getTeamLogo } from '@/lib/teamUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub, faDiscord } from '@fortawesome/free-brands-svg-icons';
import type { AccountSection } from './accountState';

const ACCOUNT_SECTIONS: {
  key: AccountSection;
  label: string;
  icon: ElementType;
}[] = [
  { key: 'profile', label: 'Profile', icon: UserIcon },
  { key: 'favorites', label: 'Favorites', icon: StarIcon },
  { key: 'security', label: 'Security', icon: SecurityCheckIcon },
  { key: 'history', label: 'History', icon: Analytics01Icon },
  { key: 'subscription', label: 'Subscription', icon: LinkSquare01Icon },
];

// --- Header ---

export function AccountHeader({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-medium tracking-[-0.01em] text-white">Account</h1>
        <button
          onClick={onSignOut}
          className="text-[12px] font-medium text-red-400 transition-colors hover:text-red-300"
        >
          Sign out
        </button>
      </div>
      <div className="mt-6 h-px w-full bg-white/[0.06]" />
    </div>
  );
}

// --- Sidebar ---

export function AccountSidebar({
  activeSection,
  onSelectSection,
}: {
  activeSection: AccountSection;
  onSelectSection: (section: AccountSection) => void;
}) {
  return (
    <aside className="w-full shrink-0 lg:w-44">
      <nav className="sticky top-24 flex flex-row gap-0.5 lg:flex-col">
        {ACCOUNT_SECTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onSelectSection(key)}
            className={cn(
              'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors',
              activeSection === key ? 'text-white' : 'text-white/80 hover:text-white'
            )}
          >
            <Icon className="size-[14px]" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

// --- Section Shell ---

function SectionShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="mb-5 text-[14px] font-medium text-white">{title}</h2>
      {children}
    </m.div>
  );
}

// --- Shared styles ---

const inputClass =
  'h-9 border-white/[0.06] bg-transparent text-[13px] text-white rounded-md px-3 py-2 placeholder:text-white/50 focus:border-white/[0.12] focus:ring-0';

const labelClass = 'text-[11px] text-white/80 font-medium';

const primaryBtnClass =
  'bg-white text-black text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors hover:bg-white/90 disabled:opacity-50';

const destructiveBtnClass = 'text-red-400 text-[12px] font-medium';

// --- Profile ---

type EditableField = 'fullName' | 'username' | 'email';
type SocialProvider = 'google' | 'github' | 'discord';
type AccountSubscription = {
  plan: string;
  billing_interval?: string | null;
  current_period_end?: string;
};

export function ProfileSection({
  user,
  profileForm,
  editingField,
  isLoading,
  onStartEdit,
  onCancelEdit,
  onChangeField,
  onSaveField,
}: {
  user: User;
  profileForm: { fullName: string; username: string; email: string };
  editingField: EditableField | null;
  isLoading: boolean;
  onStartEdit: (field: EditableField) => void;
  onCancelEdit: () => void;
  onChangeField: (field: keyof typeof profileForm, value: string) => void;
  onSaveField: (field: EditableField) => void;
}) {
  const rows: {
    field: EditableField;
    label: string;
    value: string;
    emptyLabel?: string;
  }[] = [
    { field: 'fullName', label: 'Full Name', value: profileForm.fullName },
    { field: 'username', label: 'Username', value: profileForm.username, emptyLabel: 'Not set' },
    { field: 'email', label: 'Email Address', value: profileForm.email },
  ];

  return (
    <SectionShell title="Profile">
      {/* Avatar row */}
      <div className="mb-8 flex items-center gap-4">
        <Avatar className="size-12 border border-white/[0.06]">
          <AvatarImage src={user.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-white/[0.04] text-[13px] font-medium text-white">
            {user.email?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-[13px] font-medium text-white">
            {user.user_metadata?.full_name || 'User'}
          </p>
          <p className="text-[12px] text-white/80">{user.email}</p>
        </div>
      </div>

      {/* Fields */}
      <div className={cn(CARD_CONTAINER, 'divide-y divide-white/[0.04]')}>
        {rows.map(({ field, label, value, emptyLabel }) => (
          <div key={field} className="flex items-center justify-between px-5 py-4">
            <div className="space-y-1">
              <p className={labelClass}>{label}</p>
              {editingField === field ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={value}
                    onChange={(event) => onChangeField(field, event.target.value)}
                    className={cn(inputClass, 'w-56')}
                  />
                  <button
                    onClick={() => onSaveField(field)}
                    disabled={isLoading}
                    className="text-emerald-400 transition-colors hover:text-emerald-300 disabled:opacity-50"
                  >
                    <Tick02Icon className="size-3.5" />
                  </button>
                  <button
                    onClick={onCancelEdit}
                    disabled={isLoading}
                    className="text-white/80 transition-colors hover:text-white disabled:opacity-50"
                  >
                    <Cancel01Icon className="size-3.5" />
                  </button>
                </div>
              ) : (
                <p className="text-[13px] text-white">{value || emptyLabel}</p>
              )}
            </div>
            {editingField !== field && (
              <button
                onClick={() => onStartEdit(field)}
                className="text-white/80 transition-colors hover:text-white"
              >
                <PencilEdit02Icon className="size-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// --- Favorites ---

export function FavoritesSection({
  drivers,
  teams,
  favoriteDriver,
  favoriteTeam,
  isLoading,
  getDriverImageForYear,
  onSelectDriver,
  onSelectTeam,
  onSave,
}: {
  drivers: DriverStanding[];
  teams: TeamStanding[];
  favoriteDriver: string | null;
  favoriteTeam: string | null;
  isLoading: boolean;
  getDriverImageForYear: (driverCode: string) => string;
  onSelectDriver: (driverCode: string) => void;
  onSelectTeam: (teamName: string) => void;
  onSave: () => void;
}) {
  return (
    <SectionShell title="Favorites">
      <p className="mb-5 text-[13px] text-white/80">
        Select your favorite driver and team to personalize your dashboard.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Drivers */}
        <div>
          <p className={cn(labelClass, 'mb-2')}>Driver</p>
          <div
            className={cn(CARD_CONTAINER, 'custom-scrollbar max-h-[320px] overflow-y-auto p-1.5')}
          >
            {drivers.map((driver) => (
              <button
                key={driver.code}
                onClick={() => onSelectDriver(driver.code)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors',
                  favoriteDriver === driver.code
                    ? 'border border-white/[0.12] bg-white/[0.03]'
                    : 'border border-transparent hover:bg-white/[0.02]'
                )}
              >
                <Avatar className="size-7 shrink-0 border border-white/[0.06]">
                  <AvatarImage
                    src={getDriverImageForYear(driver.code)}
                    className="object-cover object-top"
                  />
                  <AvatarFallback className="bg-white/[0.04] text-[9px] font-medium">
                    {driver.code}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-white">
                    {driver.name.split(' ').pop()}
                  </p>
                  <p className="truncate text-[11px] text-white/80">{driver.team}</p>
                </div>
                {favoriteDriver === driver.code && (
                  <CheckmarkCircle01Icon className="size-3.5 shrink-0 text-white" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Teams */}
        <div>
          <p className={cn(labelClass, 'mb-2')}>Team</p>
          <div
            className={cn(CARD_CONTAINER, 'custom-scrollbar max-h-[320px] overflow-y-auto p-1.5')}
          >
            {teams.map((team) => (
              <button
                key={team.team}
                onClick={() => onSelectTeam(team.team)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors',
                  favoriteTeam === team.team
                    ? 'border border-white/[0.12] bg-white/[0.03]'
                    : 'border border-transparent hover:bg-white/[0.02]'
                )}
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded border border-white/[0.06] bg-white/[0.02] p-1">
                  <img
                    src={getTeamLogo(team.team) || ''}
                    alt={team.team}
                    className="size-full object-contain"
                  />
                </div>
                <span className="flex-1 truncate text-[12px] font-medium text-white">
                  {team.team}
                </span>
                {favoriteTeam === team.team && (
                  <CheckmarkCircle01Icon className="size-3.5 shrink-0 text-white" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={onSave} disabled={isLoading} className={primaryBtnClass}>
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </SectionShell>
  );
}

// --- Security ---

const SOCIAL_PROVIDERS: {
  provider: SocialProvider;
  icon: typeof faGoogle;
  label: string;
}[] = [
  { provider: 'google', icon: faGoogle, label: 'Google' },
  { provider: 'github', icon: faGithub, label: 'GitHub' },
  { provider: 'discord', icon: faDiscord, label: 'Discord' },
];

export function SecuritySection({
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
  onPasswordChange: (field: keyof typeof passwordForm, value: string) => void;
  onSubmitPassword: (event: FormEvent) => void;
  onConnectSocial: (provider: SocialProvider) => void;
}) {
  return (
    <SectionShell title="Security">
      {/* Password form */}
      <form onSubmit={onSubmitPassword} className="max-w-sm space-y-4">
        {[
          { id: 'oldPassword', label: 'Current Password', field: 'oldPassword' },
          { id: 'password', label: 'New Password', field: 'password' },
          { id: 'confirmPassword', label: 'Confirm Password', field: 'confirmPassword' },
        ].map(({ id, label, field }) => (
          <div key={id} className="space-y-1.5">
            <label htmlFor={id} className={labelClass}>
              {label}
            </label>
            <Input
              id={id}
              type="password"
              value={passwordForm[field as keyof typeof passwordForm]}
              onChange={(event) =>
                onPasswordChange(field as keyof typeof passwordForm, event.target.value)
              }
              className={inputClass}
              placeholder={label}
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={isLoading || !passwordForm.password || !passwordForm.oldPassword}
          className={primaryBtnClass}
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      {/* Connected accounts */}
      <div className="mt-10">
        <div className="mb-4 h-px w-full bg-white/[0.04]" />
        <h3 className="mb-4 text-[14px] font-medium text-white">Connected Accounts</h3>
        <div className={cn(CARD_CONTAINER, 'divide-y divide-white/[0.04]')}>
          {SOCIAL_PROVIDERS.map((social) => {
            const isConnected = isProviderConnected(social.provider);
            return (
              <div key={social.provider} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={social.icon} className="text-[13px] text-white/80" />
                  <span className="text-[13px] text-white">{social.label}</span>
                </div>
                {isConnected ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                    <Tick02Icon className="size-3" /> Connected
                  </span>
                ) : (
                  <button
                    onClick={() => onConnectSocial(social.provider)}
                    disabled={isLoading}
                    className="text-[11px] font-medium text-white/80 transition-colors hover:text-white disabled:opacity-50"
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}

// --- History ---

export function HistorySection({
  isLoadingActivity,
  userActivity,
}: {
  isLoadingActivity: boolean;
  userActivity: ActivityItemProps['activity'][];
}) {
  return (
    <SectionShell title="Activity">
      {isLoadingActivity ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-12 animate-pulse rounded-md border border-white/[0.04] bg-white/[0.02]"
            />
          ))}
        </div>
      ) : userActivity.length > 0 ? (
        <div className={cn(CARD_CONTAINER, 'divide-y divide-white/[0.04]')}>
          {userActivity.map((activity) => (
            <div key={activity.id} className="px-4 py-3">
              <ActivityItem activity={activity} drivers={[]} />
            </div>
          ))}
        </div>
      ) : (
        <div className={cn(CARD_CONTAINER, 'py-16 text-center')}>
          <Analytics01Icon className="mx-auto mb-2 size-5 text-white/80" />
          <p className="text-[13px] text-white/80">No recent activity</p>
        </div>
      )}
    </SectionShell>
  );
}

// --- Subscription ---

export function SubscriptionSection({
  subscription,
  hasProSubscription,
  isOpeningPortal,
  onOpenPortal,
  onUpgrade,
}: {
  subscription: AccountSubscription | null;
  hasProSubscription: boolean;
  isOpeningPortal: boolean;
  onOpenPortal: () => void;
  onUpgrade: () => void;
}) {
  return (
    <SectionShell title="Subscription">
      {hasProSubscription && subscription ? (
        <>
          {/* Plan info grid */}
          <div className={cn(CARD_CONTAINER, 'grid grid-cols-3 divide-x divide-white/[0.04]')}>
            <div className="px-5 py-4">
              <p className={CARD_LABEL}>Plan</p>
              <p className="mt-1 text-[13px] font-medium capitalize text-white">
                {subscription.plan}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className={CARD_LABEL}>Billing</p>
              <p className="mt-1 text-[13px] font-medium capitalize text-white">
                {subscription.billing_interval || 'Monthly'}
              </p>
            </div>
            <div className="px-5 py-4" suppressHydrationWarning>
              <p className={CARD_LABEL}>Renews</p>
              <p className="mt-1 text-[13px] font-medium text-white">
                {subscription.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString()
                  : 'Active'}
              </p>
            </div>
          </div>

          {/* Manage */}
          <div className="mt-6 flex items-center gap-4">
            <button onClick={onOpenPortal} disabled={isOpeningPortal} className={primaryBtnClass}>
              {isOpeningPortal ? 'Opening...' : 'Manage Subscription'}
            </button>
            <button
              onClick={onOpenPortal}
              disabled={isOpeningPortal}
              className={destructiveBtnClass}
            >
              {isOpeningPortal ? 'Opening...' : 'Cancel'}
            </button>
          </div>
        </>
      ) : (
        <div className={cn(CARD_CONTAINER, 'px-5 py-5')}>
          <p className="text-[13px] font-medium text-white">Free plan</p>
          <p className="mt-1 max-w-md text-[12px] leading-relaxed text-white/80">
            Upgrade to Pro to unlock historical seasons and unlimited session replay.
          </p>
          <button onClick={onUpgrade} className={cn(primaryBtnClass, 'mt-4')}>
            Upgrade to Pro
          </button>
        </div>
      )}
    </SectionShell>
  );
}
