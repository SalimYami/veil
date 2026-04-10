import React from 'react';

export function Logo({ className = "", size = 24 }: { className?: string; size?: number }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path 
                d="M12 2L20 6V13C20 18.5228 12 22 12 22C12 22 4 18.5228 4 13V6L12 2Z" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            />
            <path 
                d="M12 22V2M12 2L4 6M12 2L20 6" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="opacity-40"
            />
            <circle 
                cx="12" 
                cy="12" 
                r="3" 
                fill="currentColor" 
                className="opacity-90"
            />
        </svg>
    );
}
