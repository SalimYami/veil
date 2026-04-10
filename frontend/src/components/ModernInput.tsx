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
                className={`relative flex items-center bg-vault-bg-secondary/70 border rounded-xl px-4 transition-all duration-300 shadow-inner group
                    ${isFocused 
                        ? 'border-vault-primary bg-vault-bg-tertiary/90 shadow-[0_0_0_3px_rgba(37,99,235,0.12),inset_0_2px_4px_rgba(0,0,0,0.15),0_0_24px_rgba(37,99,235,0.06)]' 
                        : error 
                            ? 'border-vault-error shadow-[0_0_0_3px_rgba(244,63,94,0.1)]' 
                            : 'border-white/10 hover:border-white/20 hover:bg-vault-bg-secondary'
                    }`}
            >
                {Icon && (
                    <div className={`flex-shrink-0 mr-2 transition-colors duration-300 ${isFocused ? 'text-vault-primary drop-shadow-[0_0_4px_var(--color-vault-primary-glow)]' : 'text-vault-text-muted'}`}>
                        <Icon size={18} strokeWidth={2} />
                    </div>
                )}

                <div className="flex-1 relative min-w-0 py-1.5 pt-4">
                    <label 
                        className={`absolute left-0 top-1/2 -translate-y-1/2 text-vault-text-muted/60 font-sans text-[0.92rem] font-medium pointer-events-none transition-all duration-200 origin-left
                            ${isActive ? 'top-2 !translate-y-0 scale-75 text-vault-primary tracking-wide' : ''}
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
                        className={`w-full bg-transparent border-none text-white text-[0.92rem] outline-none font-sans tracking-wide font-normal pt-2 pb-0.5
                            placeholder-vault-text-muted/40 font-light`}
                        placeholder={isFocused ? placeholder : ''}
                        {...props}
                    />
                </div>

                {showPasswordToggle && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex-shrink-0 ml-1 p-2 bg-transparent border-none text-vault-text-muted hover:text-vault-text-secondary hover:bg-white/5 rounded-full cursor-pointer flex items-center justify-center transition-all duration-200"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-1.5 text-vault-error text-xs mt-1.5 pl-1 animate-[fadeIn_0.3s_ease-out]">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
