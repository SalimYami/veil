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
        <div className={`modern-input-group ${className}`}>
            <div
                className={`modern-input-wrapper ${isFocused ? 'focused' : ''} ${error ? 'error' : ''}`}
            >
                {Icon && (
                    <div className="input-icon">
                        <Icon size={18} strokeWidth={2} />
                    </div>
                )}

                <div className="input-content">
                    <label className={`floating-label ${isActive ? 'active' : ''} ${Icon ? 'with-icon' : ''}`}>
                        {label}
                    </label>
                    <input
                        type={inputType}
                        value={value}
                        onChange={onChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className={`modern-input ${Icon ? 'with-icon' : ''}`}
                        placeholder={isFocused ? placeholder : ''}
                        {...props}
                    />
                </div>

                {showPasswordToggle && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="password-toggle"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>

            {error && (
                <div className="input-error-msg">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
