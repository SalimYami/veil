interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 24, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield outline */}
      <path
        d="M14 2L3.5 6.5V14c0 6.35 4.6 12.3 10.5 13.5C20.4 26.3 25 20.35 25 14V6.5L14 2Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Lock body */}
      <rect x="10" y="14" width="8" height="6" rx="1.5" fill="currentColor" fillOpacity="0.7" />
      {/* Lock shackle */}
      <path
        d="M11.5 14v-2.5a2.5 2.5 0 1 1 5 0V14"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Keyhole */}
      <circle cx="14" cy="17" r="1" fill="var(--color-v-bg, #09090b)" />
    </svg>
  );
}
