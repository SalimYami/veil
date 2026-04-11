interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 24, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Face supérieure */}
      <path
        d="M12 2L20.5 7L12 12L3.5 7L12 2Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Face droite */}
      <path
        d="M20.5 7V17L12 22V12L20.5 7Z"
        fill="currentColor"
        fillOpacity="0.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Face gauche */}
      <path
        d="M12 22L3.5 17V7L12 12V22Z"
        fill="currentColor"
        fillOpacity="0.03"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Point central ZK */}
      <circle cx="12" cy="12" r="1.5" fill="var(--color-v-bg, #09090b)" />
    </svg>
  );
}
