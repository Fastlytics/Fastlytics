/**
 * FastlyticsLogo — speed chevron with telemetry pulse.
 * A bold forward-pointing chevron evokes raw speed and direction,
 * crossed by a red telemetry pulse wave that represents live racing
 * data and analytics. Subtle left-side speed lines add motion.
 */
const FastlyticsLogo = ({ size = 28 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="28" height="28" rx="7" fill="#0A0A0C" />
    <rect x="0.5" y="0.5" width="27" height="27" rx="6.5" stroke="white" strokeOpacity="0.08" />

    {/* Speed lines — motion wake */}
    <line
      x1="3.5"
      y1="10.5"
      x2="5.5"
      y2="10.5"
      stroke="white"
      strokeOpacity="0.18"
      strokeWidth="1"
      strokeLinecap="round"
    />
    <line
      x1="3"
      y1="14"
      x2="6"
      y2="14"
      stroke="white"
      strokeOpacity="0.28"
      strokeWidth="1"
      strokeLinecap="round"
    />
    <line
      x1="3.5"
      y1="17.5"
      x2="5.5"
      y2="17.5"
      stroke="white"
      strokeOpacity="0.18"
      strokeWidth="1"
      strokeLinecap="round"
    />

    {/* Racing chevron — forward speed */}
    <path
      d="M7 6 L19 14 L7 22"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Telemetry pulse — live racing data */}
    <polyline
      points="12.5,14 14.5,9.5 16.5,18.5 18.5,13 23,13"
      stroke="#EF4444"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export { FastlyticsLogo };
export default FastlyticsLogo;
