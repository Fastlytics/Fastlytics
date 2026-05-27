import { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { ArrowRight01Icon, ArrowLeft01Icon, Camera01Icon } from 'hugeicons-react';
import type { DriverStanding, TeamStanding } from '@/lib/api';
import { getTeamLogo } from '@/lib/teamUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { TOTAL_STEPS, type UserIntent } from './onboardingState';
import { CheckIcon } from '../auth/icons';
import { ProfilePictureUpload } from '@/components/profile/ProfilePictureUpload';

// ─── Progress Bar ────────────────────────────────────────────────────────────

const STEP_LABELS = ['You', 'Intent', 'Driver', 'Team', 'Notifications', 'Photo', 'Ready'];

export function OnboardingProgress({ step }: { step: number }) {
  return (
    <div className="mb-8 mx-auto max-w-lg">
      <div className="mb-3 flex justify-between">
        {STEP_LABELS.map((label, i) => (
          <span
            key={label}
            className={cn(
              'text-[11px] font-medium uppercase tracking-wider transition-colors',
              i + 1 <= step ? 'text-white' : 'text-white/25'
            )}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="h-[2px] overflow-hidden rounded-full bg-white/[0.06]">
        <m.div
          className="h-full bg-red-500"
          initial={{ width: '0%' }}
          animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>
      <p className="mt-2 text-right text-[11px] tabular-nums text-white/30">
        {step} of {TOTAL_STEPS}
      </p>
    </div>
  );
}

// ─── Step Actions ────────────────────────────────────────────────────────────

function StepActions({
  onBack,
  onNext,
  nextLabel = 'Continue',
  disableNext,
  showBack = true,
  showSkip,
  onSkip,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  disableNext?: boolean;
  showBack?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
}) {
  return (
    <div
      className={cn(
        'flex w-full items-center pt-6',
        showBack ? 'justify-between' : 'justify-center'
      )}
    >
      {showBack ? (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <ArrowLeft01Icon className="size-4" /> Back
        </button>
      ) : null}
      <div className="flex items-center gap-3">
        {showSkip && onSkip && (
          <button
            onClick={onSkip}
            className="rounded-lg px-4 py-2 text-[13px] font-medium text-white/40 transition-colors hover:text-white/60"
          >
            Skip for now
          </button>
        )}
        <button
          onClick={onNext}
          disabled={disableNext}
          className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[13px] font-semibold text-black transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.08)] disabled:opacity-40 disabled:hover:shadow-none"
        >
          {nextLabel} <ArrowRight01Icon className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Intent Cards ────────────────────────────────────────────────────────────

const INTENTS: { id: UserIntent; emoji: string; title: string; description: string }[] = [
  {
    id: 'casual',
    emoji: '🏎️',
    title: 'Casual Fan',
    description: 'I watch races and want quick highlights and standings.',
  },
  {
    id: 'data',
    emoji: '📊',
    title: 'Data Enthusiast',
    description: 'I love telemetry, lap charts, and deep performance analysis.',
  },
  {
    id: 'fantasy',
    emoji: '🎮',
    title: 'Fantasy Player',
    description: 'I play F1 fantasy and need driver/team performance insights.',
  },
  {
    id: 'media',
    emoji: '📝',
    title: 'Media / Creator',
    description: 'I create content and need data for articles or videos.',
  },
];

// ─── Main Step Content ───────────────────────────────────────────────────────

export function OnboardingStepContent({
  step,
  isLoading,
  drivers,
  teams,
  firstName,
  lastName,
  username,
  selectedIntent,
  selectedDriver,
  selectedTeam,
  notifyRaceStart,
  notifyQualifying,
  notifyResults,
  getDriverImageForYear,
  onNext,
  onBack,
  onSetFirstName,
  onSetLastName,
  onSetUsername,
  onSelectIntent,
  onSelectDriver,
  onSelectTeam,
  onToggleNotifyRaceStart,
  onToggleNotifyQualifying,
  onToggleNotifyResults,
  onComplete,
  trackDriverSelection,
  trackTeamSelection,
}: {
  step: number;
  isLoading: boolean;
  drivers: DriverStanding[];
  teams: TeamStanding[];
  firstName: string;
  lastName: string;
  username: string;
  selectedIntent: UserIntent | null;
  selectedDriver: string | null;
  selectedTeam: string | null;
  notifyRaceStart: boolean;
  notifyQualifying: boolean;
  notifyResults: boolean;
  getDriverImageForYear: (driverCode: string) => string;
  onNext: () => void;
  onBack: () => void;
  onSetFirstName: (value: string) => void;
  onSetLastName: (value: string) => void;
  onSetUsername: (value: string) => void;
  onSelectIntent: (intent: UserIntent) => void;
  onSelectDriver: (driverCode: string) => void;
  onSelectTeam: (teamName: string) => void;
  onToggleNotifyRaceStart: () => void;
  onToggleNotifyQualifying: () => void;
  onToggleNotifyResults: () => void;
  onComplete: () => void;
  trackDriverSelection: (driverCode: string) => void;
  trackTeamSelection: (teamName: string) => void;
}) {
  return (
    <AnimatePresence mode="wait">
      {/* ─── Step 1: Name & Username ─── */}
      {step === 1 && (
        <NameUsernameStep
          firstName={firstName}
          lastName={lastName}
          username={username}
          onSetFirstName={onSetFirstName}
          onSetLastName={onSetLastName}
          onSetUsername={onSetUsername}
          onNext={onNext}
          onBack={onBack}
        />
      )}

      {/* ─── Step 2: What brings you here? ─── */}
      {step === 2 && (
        <m.div
          key="step2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          <div className="space-y-3 text-center">
            <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-white">
              What brings you to Fastlytics?
            </h1>
            <p className="mx-auto max-w-md text-[14px] text-white/40">
              This helps us tailor your dashboard to show what matters most to you.
            </p>
          </div>

          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            {INTENTS.map((intent) => (
              <button
                key={intent.id}
                onClick={() => onSelectIntent(intent.id)}
                className={cn(
                  'group relative flex flex-col items-start rounded-xl border p-5 text-left transition-all',
                  selectedIntent === intent.id
                    ? 'border-red-500/40 bg-red-500/[0.04]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.03]'
                )}
              >
                <span className="text-[24px]">{intent.emoji}</span>
                <h3 className="mt-3 text-[14px] font-semibold text-white">{intent.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-white/40">
                  {intent.description}
                </p>
                {selectedIntent === intent.id && (
                  <div className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-red-500">
                    <CheckIcon className="size-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <StepActions onBack={onBack} onNext={onNext} disableNext={!selectedIntent} />
        </m.div>
      )}

      {/* ─── Step 3: Select Favorite Driver ─── */}
      {step === 3 && (
        <m.div
          key="step3"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="space-y-2 text-center">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white">
              Pick your driver
            </h2>
            <p className="text-[13px] text-white/40">
              Who are you rooting for this season? We&apos;ll highlight their results on your
              dashboard.
            </p>
          </div>

          <div className="custom-scrollbar mx-auto grid max-h-[55vh] max-w-4xl grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {drivers.map((driver) => (
              <button
                key={driver.code}
                onClick={() => {
                  onSelectDriver(driver.code);
                  trackDriverSelection(driver.code);
                }}
                className={cn(
                  'group relative flex flex-col items-center rounded-xl border p-3 text-center transition-all',
                  selectedDriver === driver.code
                    ? 'border-red-500/40 bg-red-500/[0.06]'
                    : 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.1] hover:bg-white/[0.03]'
                )}
              >
                <Avatar className="mb-3 size-16 border border-white/[0.06]">
                  <AvatarImage
                    src={getDriverImageForYear(driver.code)}
                    className="bg-zinc-800 object-cover object-top"
                  />
                  <AvatarFallback className="bg-white/[0.04] text-[11px] text-white/60">
                    {driver.code}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[12px] font-semibold text-white">{driver.name}</span>
                <span className="mt-0.5 text-[10px] text-white/30">{driver.team}</span>
                {selectedDriver === driver.code && (
                  <div className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-red-500">
                    <CheckIcon className="size-2.5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <StepActions
            onBack={onBack}
            onNext={onNext}
            disableNext={!selectedDriver}
            showSkip
            onSkip={onNext}
          />
        </m.div>
      )}

      {/* ─── Step 4: Select Favorite Team ─── */}
      {step === 4 && (
        <m.div
          key="step4"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="space-y-2 text-center">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white">
              Pick your team
            </h2>
            <p className="text-[13px] text-white/40">
              Which constructor has your allegiance? We&apos;ll surface their performance data
              first.
            </p>
          </div>

          <div className="custom-scrollbar mx-auto grid max-h-[55vh] max-w-3xl grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            {teams.map((team) => (
              <button
                key={team.team}
                onClick={() => {
                  onSelectTeam(team.team);
                  trackTeamSelection(team.team);
                }}
                className={cn(
                  'group relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all',
                  selectedTeam === team.team
                    ? 'border-red-500/40 bg-red-500/[0.06]'
                    : 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.1] hover:bg-white/[0.03]'
                )}
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] p-2">
                  <img
                    src={getTeamLogo(team.team) || ''}
                    alt={team.team}
                    className="size-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-white">{team.team}</div>
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

          <StepActions
            onBack={onBack}
            onNext={onNext}
            disableNext={!selectedTeam}
            showSkip
            onSkip={onNext}
          />
        </m.div>
      )}

      {/* ─── Step 5: Notification Preferences ─── */}
      {step === 5 && (
        <m.div
          key="step5"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          <div className="space-y-2 text-center">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white">
              Stay in the loop
            </h2>
            <p className="text-[13px] text-white/40">
              Choose what you want to be notified about. You can change these anytime in settings.
            </p>
          </div>

          <div className="mx-auto max-w-md space-y-3">
            <NotificationToggle
              emoji="🏁"
              title="Race start alerts"
              description="Get notified 30 minutes before lights out"
              checked={notifyRaceStart}
              onToggle={onToggleNotifyRaceStart}
            />
            <NotificationToggle
              emoji="⏱️"
              title="Qualifying results"
              description="Instant grid positions after qualifying ends"
              checked={notifyQualifying}
              onToggle={onToggleNotifyQualifying}
            />
            <NotificationToggle
              emoji="🏆"
              title="Race results"
              description="Final classification and key moments after each race"
              checked={notifyResults}
              onToggle={onToggleNotifyResults}
            />
          </div>

          <StepActions onBack={onBack} onNext={onNext} nextLabel="Almost done" />
        </m.div>
      )}

      {/* ─── Step 6: Profile Picture ─── */}
      {step === 6 && (
        <m.div
          key="step6"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          <div className="space-y-2 text-center">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white">
              Add a profile picture
            </h2>
            <p className="text-[13px] text-white/40">
              Help others recognize you in the community. You can always change this later.
            </p>
          </div>

          <ProfilePictureStep onNext={onNext} onBack={onBack} />
        </m.div>
      )}

      {/* ─── Step 7: Ready / Completion ─── */}
      {step === 7 && (
        <m.div
          key="step7"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          <div className="space-y-4 text-center">
            {/* Animated SVG checkmark */}
            <m.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="mx-auto flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 ring-1 ring-red-500/20"
            >
              <m.svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <m.path
                  d="M20 6 9 17l-5-5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                />
              </m.svg>
            </m.div>

            <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-white">
              You&apos;re all set
            </h2>
            <p className="mx-auto max-w-sm text-[14px] leading-relaxed text-white/40">
              Your race desk is personalized and ready. Dive into telemetry, track your favorites,
              and never miss a moment.
            </p>
          </div>

          {/* Summary card */}
          <div className="mx-auto max-w-sm rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/30">
              Your setup
            </h3>
            <div className="space-y-2.5">
              {selectedDriver && (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white/50">Favorite driver</span>
                  <span className="text-[12px] font-medium text-white">{selectedDriver}</span>
                </div>
              )}
              {selectedTeam && (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white/50">Favorite team</span>
                  <span className="text-[12px] font-medium text-white">{selectedTeam}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/50">Notifications</span>
                <span className="text-[12px] font-medium text-white">
                  {[
                    notifyRaceStart && 'Race',
                    notifyQualifying && 'Quali',
                    notifyResults && 'Results',
                  ]
                    .filter(Boolean)
                    .join(', ') || 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-center pt-2">
            <button
              onClick={onComplete}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-8 py-3 text-[14px] font-semibold text-white transition-all hover:bg-red-700 hover:shadow-[0_0_40px_rgba(220,38,38,0.15)] disabled:opacity-50"
            >
              {isLoading ? 'Setting up...' : 'Go to my dashboard'}
              {!isLoading && <ArrowRight01Icon className="size-4" />}
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

// ─── Name & Username Step ────────────────────────────────────────────────────

function NameUsernameStep({
  firstName,
  lastName,
  username,
  onSetFirstName,
  onSetLastName,
  onSetUsername,
  onNext,
  onBack,
}: {
  firstName: string;
  lastName: string;
  username: string;
  onSetFirstName: (value: string) => void;
  onSetLastName: (value: string) => void;
  onSetUsername: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>(
    'idle'
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!username.trim() || username.length < 3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await supabase.rpc('check_username_available', {
          desired_username: username,
        });

        if (isMounted) {
          setUsernameStatus(data === true ? 'available' : 'taken');
        }
      } catch {
        if (isMounted) {
          setUsernameStatus('idle');
        }
      }
    }, 400);

    return () => {
      isMounted = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username]);

  const isUsernameValid = username.trim().length >= 3 && usernameStatus === 'available';

  return (
    <m.div
      key="step1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="space-y-3 text-center">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-white">
          Let&apos;s get to know you
        </h1>
        <p className="mx-auto max-w-md text-[14px] text-white/40">
          Set up your name and a unique username for your Fastlytics profile.
        </p>
      </div>

      <div className="mx-auto max-w-sm space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-white/50">
              First name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => onSetFirstName(e.target.value)}
              placeholder="Lewis"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/25 transition-colors focus:border-white/[0.2] focus:outline-none focus:ring-0"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-white/50">
              Last name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => onSetLastName(e.target.value)}
              placeholder="Hamilton"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/25 transition-colors focus:border-white/[0.2] focus:outline-none focus:ring-0"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-white/50">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-white/30">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) =>
                onSetUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
              }
              placeholder="lewishamilton"
              className={cn(
                'w-full rounded-lg border bg-white/[0.02] py-2.5 pl-8 pr-10 text-[14px] text-white placeholder:text-white/25 transition-colors focus:outline-none focus:ring-0',
                usernameStatus === 'taken'
                  ? 'border-red-500/50 focus:border-red-500/70'
                  : usernameStatus === 'available'
                    ? 'border-emerald-500/50 focus:border-emerald-500/70'
                    : 'border-white/[0.08] focus:border-white/[0.2]'
              )}
            />
            {/* Status indicator */}
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {usernameStatus === 'checking' && (
                <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
              )}
              {usernameStatus === 'available' && (
                <svg
                  className="size-4 text-emerald-400"
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
                  className="size-4 text-red-400"
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
            </div>
          </div>
          <p
            className={cn(
              'text-[11px]',
              usernameStatus === 'taken'
                ? 'text-red-400'
                : usernameStatus === 'available'
                  ? 'text-emerald-400'
                  : 'text-white/30'
            )}
          >
            {usernameStatus === 'taken' && 'This username is already taken.'}
            {usernameStatus === 'available' && 'Username is available!'}
            {usernameStatus === 'checking' && 'Checking availability…'}
            {usernameStatus === 'idle' &&
              (username.length > 0 && username.length < 3
                ? 'Username must be at least 3 characters.'
                : 'Lowercase letters, numbers, hyphens, and underscores only.')}
          </p>
        </div>
      </div>

      <StepActions
        onBack={onBack}
        onNext={onNext}
        showBack={false}
        disableNext={!firstName.trim() || !isUsernameValid}
      />
    </m.div>
  );
}

// ─── Profile Picture Step ────────────────────────────────────────────────────

function ProfilePictureStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  return (
    <>
      <div className="mx-auto flex max-w-sm flex-col items-center gap-6">
        {!uploaded ? (
          <button
            onClick={() => setDialogOpen(true)}
            className="group flex size-32 flex-col items-center justify-center gap-2 rounded-full border-2 border-dashed border-white/[0.1] transition-all hover:border-white/[0.2] hover:bg-white/[0.02]"
          >
            <Camera01Icon className="size-8 text-white/40 transition-colors group-hover:text-white/60" />
            <span className="text-[11px] font-medium text-white/40 group-hover:text-white/60">
              Upload photo
            </span>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex size-20 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <m.svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4 }}
              >
                <m.path
                  d="M20 6 9 17l-5-5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4 }}
                />
              </m.svg>
            </div>
            <p className="text-[13px] font-medium text-emerald-400">Profile picture set!</p>
            <button
              onClick={() => setDialogOpen(true)}
              className="text-[12px] text-white/40 transition-colors hover:text-white/60"
            >
              Change photo
            </button>
          </div>
        )}
      </div>

      <StepActions
        onBack={onBack}
        onNext={onNext}
        nextLabel={uploaded ? 'Continue' : 'Skip for now'}
        showSkip={false}
      />

      <ProfilePictureUpload
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => setUploaded(true)}
      />
    </>
  );
}

// ─── Notification Toggle ─────────────────────────────────────────────────────

function NotificationToggle({
  emoji,
  title,
  description,
  checked,
  onToggle,
}: {
  emoji: string;
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all',
        checked
          ? 'border-white/[0.1] bg-white/[0.03]'
          : 'border-white/[0.04] bg-transparent hover:border-white/[0.08]'
      )}
    >
      <span className="text-[20px]">{emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-white">{title}</div>
        <div className="mt-0.5 text-[11px] text-white/40">{description}</div>
      </div>
      <div
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-red-500' : 'bg-white/[0.1]'
        )}
      >
        <span
          className={cn(
            'inline-block size-3.5 rounded-full transition-transform',
            checked ? 'translate-x-[18px] bg-white' : 'translate-x-[3px] bg-white/50'
          )}
        />
      </div>
    </button>
  );
}
