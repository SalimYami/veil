interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 24, className = '' }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Face supérieure - Grey/Glass look */}
        <path
          d="M12 2L20.5 7L12 12L3.5 7L12 2Z"
          fill="white"
          fillOpacity="0.05"
          stroke="white"
          strokeOpacity="0.2"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Face droite - Subdued glow */}
        <path
          d="M20.5 7V17L12 22V12L20.5 7Z"
          fill="white"
          fillOpacity="0.1"
          stroke="white"
          strokeOpacity="0.3"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Face gauche - Darkest grey */}
        <path
          d="M12 22L3.5 17V7L12 12V22Z"
          fill="white"
          fillOpacity="0.02"
          stroke="white"
          strokeOpacity="0.1"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        
        {/* Central ZK Core - Remaining Blue Point for Focus */}
        <circle cx="12" cy="12" r="1.5" fill="#3b82f6" fillOpacity="1" />
        <circle cx="12" cy="12" r="3" fill="#3b82f6" fillOpacity="0.3" className="animate-pulse" />
      </svg>

      {/* Extreme Outer Glow Layer */}
      <div 
        className="absolute inset-0 bg-primary/20 blur-[15px] rounded-full scale-150 opacity-10" 
        style={{ width: size, height: size }}
      />
    </div>
  );
}
