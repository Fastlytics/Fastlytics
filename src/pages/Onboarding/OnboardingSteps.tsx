import { AnimatePresence, m } from 'motion/react';
import { Button } from '@/components/ui/button';
import { CheckmarkCircle01Icon, ArrowRight01Icon, ArrowLeft01Icon } from 'hugeicons-react';
import type { DriverStanding, TeamStanding } from '@/lib/api';
import { getTeamLogo } from '@/lib/teamUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';

export function OnboardingProgress({ step }: { step: number }) {
  return (
    <div className="mb-12 mx-auto max-w-md">
      <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
        <span className={step >= 1 ? 'text-white' : ''}>Welcome</span>
        <span className={step >= 2 ? 'text-white' : ''}>Driver</span>
        <span className={step >= 3 ? 'text-white' : ''}>Team</span>
        <span className={step >= 4 ? 'text-white' : ''}>Socials</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-zinc-900">
        <m.div
          className="h-full bg-red-600"
          initial={{ width: '0%' }}
          animate={{ width: `${(step / 4) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

function StepActions({
  onBack,
  onNext,
  nextLabel,
  disableNext,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  disableNext?: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl justify-between pt-4">
      <Button variant="ghost" onClick={onBack} className="text-zinc-400 hover:text-white">
        <ArrowLeft01Icon className="mr-2 size-4" /> Back
      </Button>
      <Button
        onClick={onNext}
        disabled={disableNext}
        className="rounded-none bg-white font-bold uppercase tracking-wider text-black hover:bg-zinc-200 disabled:opacity-50"
      >
        {nextLabel} <ArrowRight01Icon className="ml-2 size-4" />
      </Button>
    </div>
  );
}

export function OnboardingStepContent({
  step,
  isLoading,
  drivers,
  teams,
  selectedDriver,
  selectedTeam,
  getDriverImageForYear,
  onNext,
  onBack,
  onSelectDriver,
  onSelectTeam,
  onComplete,
  trackDriverSelection,
  trackTeamSelection,
}: {
  step: number;
  isLoading: boolean;
  drivers: DriverStanding[];
  teams: TeamStanding[];
  selectedDriver: string | null;
  selectedTeam: string | null;
  getDriverImageForYear: (driverCode: string) => string;
  onNext: () => void;
  onBack: () => void;
  onSelectDriver: (driverCode: string) => void;
  onSelectTeam: (teamName: string) => void;
  onComplete: () => void;
  trackDriverSelection: (driverCode: string) => void;
  trackTeamSelection: (teamName: string) => void;
}) {
  return (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <m.div
          key="step1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-8 text-center"
        >
          <div className="space-y-4">
            <h1 className="text-5xl font-semibold uppercase italic tracking-tighter md:text-7xl">
              Welcome to <span className="text-red-600">Fastlytics</span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-zinc-400">
              Let's personalize your experience. Tell us who you support, and we'll tailor your
              dashboard to follow them closely.
            </p>
          </div>
          <Button
            onClick={onNext}
            className="h-14 rounded-none bg-white px-8 text-lg font-bold uppercase tracking-wider text-black hover:bg-zinc-200"
          >
            Get Started <ArrowRight01Icon className="ml-2 size-5" />
          </Button>
        </m.div>
      )}

      {step === 2 && (
        <m.div
          key="step2"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="space-y-8"
        >
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold uppercase italic tracking-tighter">
              Select Favorite Driver
            </h2>
            <p className="text-zinc-400">Who are you rooting for this season?</p>
          </div>

          <div className="custom-scrollbar grid max-h-[60vh] grid-cols-2 gap-4 overflow-y-auto pr-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {drivers.map((driver) => (
              <button
                key={driver.code}
                onClick={() => {
                  onSelectDriver(driver.code);
                  trackDriverSelection(driver.code);
                }}
                className={[
                  'group relative flex flex-col items-center border-2 p-4 text-left text-center transition-all duration-200',
                  selectedDriver === driver.code
                    ? 'border-red-600 bg-red-600/10'
                    : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-600 hover:bg-zinc-900',
                ].join(' ')}
              >
                <Avatar className="mb-4 size-24 border-2 border-zinc-800">
                  <AvatarImage
                    src={getDriverImageForYear(driver.code)}
                    className="bg-zinc-800 object-cover object-top"
                  />
                  <AvatarFallback>{driver.name}</AvatarFallback>
                </Avatar>

                <div className="mb-1 text-center text-xs font-mono uppercase text-zinc-500">
                  {driver.team}
                </div>
                <div className="mb-1 w-full truncate text-center text-sm font-black uppercase italic leading-none">
                  {driver.name}
                </div>

                {selectedDriver === driver.code && (
                  <div className="absolute right-2 top-2 text-red-600">
                    <CheckmarkCircle01Icon className="size-5" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <StepActions
            onBack={onBack}
            onNext={onNext}
            nextLabel="Next Step"
            disableNext={!selectedDriver}
          />
        </m.div>
      )}

      {step === 3 && (
        <m.div
          key="step3"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="space-y-8"
        >
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold uppercase italic tracking-tighter">
              Select Favorite Team
            </h2>
            <p className="text-zinc-400">Which constructor has your allegiance?</p>
          </div>

          <div className="custom-scrollbar grid max-h-[60vh] grid-cols-1 gap-4 overflow-y-auto pr-2 sm:grid-cols-2 md:grid-cols-3">
            {teams.map((team) => (
              <button
                key={team.team}
                onClick={() => {
                  onSelectTeam(team.team);
                  trackTeamSelection(team.team);
                }}
                className={[
                  'group relative flex items-center gap-6 border-2 p-6 text-left transition-all duration-200',
                  selectedTeam === team.team
                    ? 'border-red-600 bg-red-600/10'
                    : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-600 hover:bg-zinc-900',
                ].join(' ')}
              >
                <div className="flex size-16 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 p-2">
                  <img
                    src={getTeamLogo(team.team) || ''}
                    alt={team.team}
                    className="size-full object-contain"
                  />
                </div>
                <div>
                  <div className="mb-2 text-xl font-black uppercase italic leading-none">
                    {team.team}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-mono text-zinc-500">
                    <span>{team.points} PTS</span>
                    <span>•</span>
                    <span>{team.wins} WINS</span>
                  </div>
                </div>

                {selectedTeam === team.team && (
                  <div className="absolute right-4 top-4 text-red-600">
                    <CheckmarkCircle01Icon className="size-6" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <StepActions
            onBack={onBack}
            onNext={onNext}
            nextLabel="Next Step"
            disableNext={!selectedTeam}
          />
        </m.div>
      )}

      {step === 4 && (
        <m.div
          key="step4"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="space-y-8"
        >
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold uppercase italic tracking-tighter">
              Stay Updated
            </h2>
            <p className="text-zinc-400">Follow us on social media for the latest updates.</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-6 py-12">
            {[
              {
                href: 'https://twitter.com/fastlytics',
                icon: faXTwitter,
                title: 'X (Twitter)',
                handle: '@fastlytics',
              },
              {
                href: 'https://instagram.com/fastlytics',
                icon: faInstagram,
                title: 'Instagram',
                handle: '@fastlytics',
              },
            ].map((social) => (
              <a
                key={social.title}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-full max-w-md items-center gap-4 border-2 border-zinc-800 bg-zinc-900/30 p-6 transition-all hover:border-white hover:bg-zinc-900"
              >
                <div className="flex size-12 items-center justify-center rounded-lg bg-zinc-950 transition-colors group-hover:bg-white group-hover:text-black">
                  <FontAwesomeIcon icon={social.icon} className="size-6" />
                </div>
                <div className="flex-1">
                  <div className="text-xl font-black uppercase italic">{social.title}</div>
                  <div className="text-sm text-zinc-500">{social.handle}</div>
                </div>
                <ArrowRight01Icon className="size-6 text-zinc-500 group-hover:text-white" />
              </a>
            ))}
          </div>

          <div className="mx-auto flex w-full max-w-4xl justify-between pt-4">
            <Button variant="ghost" onClick={onBack} className="text-zinc-400 hover:text-white">
              <ArrowLeft01Icon className="mr-2 size-4" /> Back
            </Button>
            <Button
              onClick={onComplete}
              disabled={isLoading}
              className="min-w-[140px] rounded-none bg-red-600 font-bold uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Finish Setup'}
            </Button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
