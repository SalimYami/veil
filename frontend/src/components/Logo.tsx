import React from 'react';

export function Logo({ className = "", size = 28 }: { className?: string; size?: number }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        >
            {/* Hexagon Outer */}
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" className="opacity-30" />
            {/* Inner lines forming the isometric cube */}
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" className="opacity-60" />
            <line x1="12" y1="22.08" x2="12" y2="12" className="opacity-60" />
            {/* Focus / Core dot representing the encrypted data */}
            <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" fill="currentColor" stroke="none" />
            {/* Subtly glowing top facet (Optional visual touch) */}
            <path d="M12 2L20.5 7L12 12L3.5 7L12 2Z" fill="currentColor" className="opacity-10" stroke="none"/>
        </svg>
    );
}
