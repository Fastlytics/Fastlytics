import { InformationCircleIcon } from 'hugeicons-react';

interface SectionUnavailableProps {
  /** Human-readable message explaining why the section is unavailable */
  message: string;
  /** Session code to suggest switching to, e.g. 'R' or 'Sprint' */
  suggestedSession: string;
  /** Called when the user clicks the switch button */
  onSwitchSession: () => void;
}

function friendlyLabel(code: string): string {
  switch (code) {
    case 'R':
      return 'Race';
    case 'Sprint':
      return 'Sprint';
    case 'Q':
      return 'Qualifying';
    case 'SQ':
      return 'Sprint Qualifying';
    case 'FP1':
      return 'Practice 1';
    case 'FP2':
      return 'Practice 2';
    case 'FP3':
      return 'Practice 3';
    default:
      return code;
  }
}

export default function SectionUnavailable({
  message,
  suggestedSession,
  onSwitchSession,
}: SectionUnavailableProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
      <div className="flex flex-col items-start gap-3">
        <InformationCircleIcon className="size-5 text-white/35" aria-hidden="true" />
        <h3 className="text-[15px] font-semibold text-white">Not available for this session</h3>
        <p className="text-[13px] text-white/60">{message}</p>
        <button
          type="button"
          onClick={onSwitchSession}
          className="mt-2 rounded-lg bg-white/[0.06] px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
        >
          Switch to {friendlyLabel(suggestedSession)}
        </button>
      </div>
    </div>
  );
}
