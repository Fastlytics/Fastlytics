import type { ElementType, FormEvent, ReactNode } from 'react';
import { m } from 'motion/react';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Logout01Icon,
} from 'hugeicons-react';
import ActivityItem, { type ActivityItemProps } from '@/components/activity/ActivityItem';
import { cn } from '@/lib/utils';
import type { DriverStanding, TeamStanding } from '@/lib/api';
import { getTeamLogo } from '@/lib/teamUtils';
import { StarIcon } from 'lucide-react';
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

export function AccountHeader({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="mb-10">
      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold uppercase italic tracking-[-0.025em] text-white sm:text-4xl">
              My Account
            </h1>
            <p className="mt-1 text-[15px] text-white/50">Manage your profile and preferences</p>
          </div>
          <Button
            onClick={onSignOut}
            className="h-10 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-5 text-[13px] font-semibold text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/[0.12] hover:text-red-300"
          >
            <Logout01Icon className="mr-2 size-4" /> Sign Out
          </Button>
        </div>
      </m.div>
      <div className="mt-8 h-px w-full bg-white/[0.05]" />
    </div>
  );
}

export function AccountSidebar({
  activeSection,
  onSelectSection,
}: {
  activeSection: AccountSection;
  onSelectSection: (section: AccountSection) => void;
}) {
  return (
    <aside className="w-full shrink-0 lg:w-56">
      <div className="sticky top-24 space-y-1.5">
        {ACCOUNT_SECTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onSelectSection(key)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider transition-all',
              activeSection === key
                ? 'border-white/[0.08] bg-white/[0.06] text-white'
                : 'border-transparent text-white/45 hover:bg-white/[0.03] hover:text-white'
            )}
          >
            <Icon
              className={cn('size-4', activeSection === key ? 'text-red-400' : 'text-white/30')}
            />
            {label}
          </button>
        ))}
      </div>
    </aside>
  );
}

function SectionShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">{title}</h2>
      </div>
      {children}
    </m.div>
  );
}

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
    <SectionShell title="Profile Settings">
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 lg:p-8">
        <div className="mb-8 flex items-center gap-5">
          <Avatar className="size-20 border border-white/[0.08]">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-[#1a1a1e] text-[18px] font-bold text-white/70">
              {user.email?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-[18px] font-semibold text-white">
              {user.user_metadata?.full_name || 'User'}
            </h3>
            <p className="text-[14px] text-white/40">{user.email}</p>
          </div>
        </div>

        <div className="max-w-lg space-y-6">
          {rows.map(({ field, label, value, emptyLabel }) => (
            <div key={field} className="space-y-2">
              <Label className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                {label}
              </Label>
              <div className="flex items-center gap-3">
                {editingField === field ? (
                  <>
                    <Input
                      value={value}
                      onChange={(event) => onChangeField(field, event.target.value)}
                      className="h-11 rounded-xl border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/20 focus:border-red-500/40 focus:ring-red-500/20"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onSaveField(field)}
                      disabled={isLoading}
                      className="size-10 shrink-0 rounded-xl text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                    >
                      <Tick02Icon className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={onCancelEdit}
                      disabled={isLoading}
                      className="size-10 shrink-0 rounded-xl text-white/30 hover:bg-white/[0.06] hover:text-white/60"
                    >
                      <Cancel01Icon className="size-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-2.5 text-[15px] text-white">
                      {value || emptyLabel}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onStartEdit(field)}
                      className="size-10 shrink-0 rounded-xl text-white/30 hover:bg-white/[0.06] hover:text-white/60"
                    >
                      <PencilEdit02Icon className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

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
    <SectionShell title="My Favorites">
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 lg:p-8">
        <p className="mb-6 text-[14px] text-white/40">
          Update your favorite driver and team to personalize your dashboard.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <Label className="text-[11px] font-medium uppercase tracking-wider text-white/35">
              Favorite Driver
            </Label>
            <div className="custom-scrollbar max-h-[340px] space-y-1 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
              {drivers.map((driver) => (
                <button
                  key={driver.code}
                  onClick={() => onSelectDriver(driver.code)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                    favoriteDriver === driver.code
                      ? 'bg-red-500/[0.1] text-white'
                      : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                  )}
                >
                  <Avatar className="size-9 shrink-0 border border-white/[0.08]">
                    <AvatarImage
                      src={getDriverImageForYear(driver.code)}
                      className="object-cover object-top"
                    />
                    <AvatarFallback className="bg-[#1a1a1e] text-[10px] font-bold">
                      {driver.code}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold">
                      {driver.name.split(' ').pop()}
                    </div>
                    <div
                      className={cn(
                        'text-[11px]',
                        favoriteDriver === driver.code ? 'text-red-400/60' : 'text-white/30'
                      )}
                    >
                      {driver.team}
                    </div>
                  </div>
                  {favoriteDriver === driver.code && (
                    <CheckmarkCircle01Icon className="size-4 shrink-0 text-red-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[11px] font-medium uppercase tracking-wider text-white/35">
              Favorite Team
            </Label>
            <div className="custom-scrollbar max-h-[340px] space-y-1 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
              {teams.map((team) => (
                <button
                  key={team.team}
                  onClick={() => onSelectTeam(team.team)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                    favoriteTeam === team.team
                      ? 'bg-red-500/[0.1] text-white'
                      : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                  )}
                >
                  <div className="flex h-9 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04] p-1.5">
                    <img
                      src={getTeamLogo(team.team) || ''}
                      alt={team.team}
                      className="size-full object-contain"
                    />
                  </div>
                  <span className="flex-1 truncate text-[14px] font-semibold">{team.team}</span>
                  {favoriteTeam === team.team && (
                    <CheckmarkCircle01Icon className="size-4 shrink-0 text-red-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={onSave}
            disabled={isLoading}
            className="h-11 rounded-xl bg-white px-6 text-[13px] font-semibold text-black transition-all hover:bg-white/90"
          >
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </SectionShell>
  );
}

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
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 lg:p-8">
        <h3 className="mb-6 text-[18px] font-semibold text-white">Change Password</h3>
        <form onSubmit={onSubmitPassword} className="max-w-lg space-y-5">
          {[
            {
              id: 'oldPassword',
              label: 'Current Password',
              field: 'oldPassword',
              placeholder: 'Enter current password',
            },
            {
              id: 'password',
              label: 'New Password',
              field: 'password',
              placeholder: 'Enter new password',
            },
            {
              id: 'confirmPassword',
              label: 'Confirm Password',
              field: 'confirmPassword',
              placeholder: 'Confirm new password',
            },
          ].map(({ id, label, field, placeholder }) => (
            <div key={id} className="space-y-2">
              <Label
                htmlFor={id}
                className="text-[11px] font-medium uppercase tracking-wider text-white/35"
              >
                {label}
              </Label>
              <Input
                id={id}
                type="password"
                value={passwordForm[field as keyof typeof passwordForm]}
                onChange={(event) =>
                  onPasswordChange(field as keyof typeof passwordForm, event.target.value)
                }
                className="h-11 rounded-xl border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/20 focus:border-red-500/40"
                placeholder={placeholder}
              />
            </div>
          ))}
          <Button
            type="submit"
            disabled={isLoading || !passwordForm.password || !passwordForm.oldPassword}
            className="h-11 rounded-xl bg-white px-6 text-[13px] font-semibold text-black transition-all hover:bg-white/90"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>

        <div className="mt-10 border-t border-white/[0.04] pt-8">
          <h3 className="mb-5 text-[18px] font-semibold text-white">Connected Accounts</h3>
          <div className="max-w-lg space-y-3">
            {SOCIAL_PROVIDERS.map((social) => {
              const isConnected = isProviderConnected(social.provider);
              return (
                <div
                  key={social.provider}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]">
                      <FontAwesomeIcon icon={social.icon} className="text-[16px] text-white/50" />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-white">{social.label}</div>
                      <div className="text-[12px] text-white/35">
                        {isConnected ? 'Connected' : 'Not connected'}
                      </div>
                    </div>
                  </div>
                  {isConnected ? (
                    <div className="flex items-center text-[12px] font-semibold text-emerald-400">
                      <Tick02Icon className="mr-1.5 size-4" /> Connected
                    </div>
                  ) : (
                    <Button
                      onClick={() => onConnectSocial(social.provider)}
                      variant="outline"
                      className="h-9 rounded-xl border-white/[0.08] bg-white/[0.03] px-4 text-[12px] font-medium text-white/60 hover:bg-white/[0.06] hover:text-white"
                      disabled={isLoading}
                    >
                      <LinkSquare01Icon className="mr-1.5 size-3.5" /> Connect
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

export function HistorySection({
  isLoadingActivity,
  userActivity,
}: {
  isLoadingActivity: boolean;
  userActivity: ActivityItemProps['activity'][];
}) {
  return (
    <SectionShell title="Activity History">
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 lg:p-8">
        <p className="mb-6 text-[14px] text-white/40">Your recent interactions on Fastlytics.</p>
        {isLoadingActivity ? (
          <div className="space-y-3">
            {[
              'activity-skeleton-1',
              'activity-skeleton-2',
              'activity-skeleton-3',
              'activity-skeleton-4',
              'activity-skeleton-5',
            ].map((skeletonKey) => (
              <div
                key={skeletonKey}
                className="h-16 animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.02]"
              />
            ))}
          </div>
        ) : userActivity.length > 0 ? (
          <div className="space-y-2">
            {userActivity.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} drivers={[]} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Analytics01Icon className="mx-auto mb-3 size-10 text-white/15" />
            <p className="text-[14px] text-white/35">No recent activity found.</p>
          </div>
        )}
      </div>
    </SectionShell>
  );
}

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
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 lg:p-8">
        {hasProSubscription && subscription ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                  Plan
                </p>
                <p className="mt-2 text-[18px] font-bold capitalize text-white">
                  {subscription.plan}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                  Billing
                </p>
                <p className="mt-2 text-[18px] font-bold capitalize text-white">
                  {subscription.billing_interval || 'Monthly'}
                </p>
              </div>
              <div
                className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4"
                suppressHydrationWarning
              >
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                  Renews / Expires
                </p>
                <p className="mt-2 text-[18px] font-bold text-white">
                  {subscription.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString()
                    : 'Active'}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
              <h3 className="text-[16px] font-semibold text-white">Manage your subscription</h3>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/45">
                Open the Dodo Payments customer portal to update billing details or cancel your
                subscription.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={onOpenPortal}
                  disabled={isOpeningPortal}
                  className="h-11 rounded-xl bg-white px-5 text-[13px] font-semibold text-black transition-all hover:bg-white/90"
                >
                  {isOpeningPortal ? 'Opening...' : 'Manage Subscription'}
                </Button>
                <Button
                  onClick={onOpenPortal}
                  disabled={isOpeningPortal}
                  className="h-11 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-5 text-[13px] font-semibold text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/[0.12] hover:text-red-300"
                >
                  {isOpeningPortal ? 'Opening...' : 'Cancel Subscription'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
            <h3 className="text-[16px] font-semibold text-white">Free plan</h3>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/45">
              You are currently on the free plan. Upgrade to Pro to unlock historical seasons and
              unlimited session replay.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={onUpgrade}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/12 px-5 text-[13px] font-semibold text-sky-200 transition-all hover:border-sky-300/35 hover:bg-sky-400/18 hover:text-sky-100"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        )}
      </div>
    </SectionShell>
  );
}
