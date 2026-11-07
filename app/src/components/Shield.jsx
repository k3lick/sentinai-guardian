/**
 * Shield — original SentinAI emblem: a shield outline with circuit traces
 * and a centred eye whose pupil is a check mark.
 * Uses currentColor so the parent controls the colour via text-* classes.
 */
export default function Shield({ className = '' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ filter: 'drop-shadow(0 0 5px currentColor)' }}
    >
      {/* Shield outline */}
      <path
        d="M32 3 L55 11 V31 C55 46 45 57 32 61 C19 57 9 46 9 31 V11 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.06"
      />
      {/* Inner shield echo */}
      <path
        d="M32 8.5 L50 14.8 V31 C50 42.5 42 51.5 32 55 C22 51.5 14 42.5 14 31 V14.8 Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.35"
        strokeLinejoin="round"
      />
      {/* Circuit traces */}
      <path d="M14 22 H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="22.5" cy="22" r="1.8" fill="currentColor" />
      <path d="M50 24 H44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="41.5" cy="24" r="1.8" fill="currentColor" />
      <path d="M20 44 L24 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="25.5" cy="38.5" r="1.8" fill="currentColor" />
      <path d="M44 44 L40 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="38.5" cy="38.5" r="1.8" fill="currentColor" />
      <path d="M32 8.5 V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="32" cy="15.5" r="1.8" fill="currentColor" />
      {/* Eye */}
      <path
        d="M16 32 Q32 21 48 32 Q32 43 16 32 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Check pupil */}
      <path
        d="M26.5 32 L30 35.5 L38 27.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
