interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 24, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="veil-g1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <filter id="veil-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Outer shield */}
      <path
        d="M16 2L4 7V16c0 7.18 5.23 13.9 12 15.5C23.77 29.9 29 23.18 29 16V7L16 2Z"
        fill="url(#veil-g1)"
        fillOpacity="0.12"
        stroke="url(#veil-g1)"
        strokeWidth="1.2"
        strokeLinejoin="round"
        filter="url(#veil-glow)"
      />
      {/* Inner lock */}
      <rect x="11.5" y="15" width="9" height="7" rx="1.5" fill="url(#veil-g1)" fillOpacity="0.9" />
      <path
        d="M13 15v-2.5a3 3 0 1 1 6 0V15"
        stroke="url(#veil-g1)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Keyhole */}
      <circle cx="16" cy="18.5" r="1.1" fill="#04040a" />
      <rect x="15.4" y="18.5" width="1.2" height="2" rx="0.5" fill="#04040a" />
    </svg>
  );
}
