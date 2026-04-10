import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ModernInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: LucideIcon;
    error?: string | null;
    showPasswordToggle?: boolean;
}

export function ModernInput({
    label,
    type = 'text',
    value,
    onChange,
    icon: Icon,
    error,
    showPasswordToggle = false,
    className = '',
    placeholder,
    ...props
}: ModernInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;
    const hasValue = value && value.toString().length > 0;
    const isActive = isFocused || hasValue;

    return (
        <div className={`relative ${className}`}>
            <div
                className={`relative flex items-center bg-[#080808] border rounded-lg px-3.5 transition-all duration-200 group
                    ${isFocused 
                        ? 'border-[#444] bg-[#111] ring-1 ring-white/5' 
                        : error 
                            ? 'border-red-500/50 bg-red-500/5' 
                            : 'border-white/10 hover:border-white/20 hover:bg-[#0a0a0a]'
                    }`}
            >
                {Icon && (
                    <div className={`flex-shrink-0 mr-2 transition-colors duration-200 ${isFocused ? 'text-white' : 'text-zinc-600'}`}>
                        <Icon size={16} strokeWidth={2} />
                    </div>
                )}

                <div className="flex-1 relative min-w-0 py-1 pt-4 pb-1.5">
                    <label 
                        className={`absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500 font-sans text-sm font-medium pointer-events-none transition-all duration-200 origin-left
                            ${isActive ? 'top-2 !translate-y-0 scale-[0.75] text-zinc-400' : ''}
                        `}
                    >
                        {label}
                    </label>
                    <input
                        type={inputType}
                        value={value}
                        onChange={onChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className={`w-full bg-transparent border-none text-white text-sm outline-none font-sans font-normal pt-2 pb-0
                            placeholder-zinc-700 font-light`}
                        placeholder={isFocused ? placeholder : ''}
                        {...props}
                    />
                </div>

                {showPasswordToggle && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex-shrink-0 ml-2 p-1.5 bg-transparent border-none text-zinc-500 hover:text-white hover:bg-white/5 rounded-md cursor-pointer flex items-center justify-center transition-colors duration-200"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5 pl-1">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
