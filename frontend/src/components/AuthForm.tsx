import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Loader2, Eye, EyeOff } from 'lucide-react';

/* Premium Input Component */
function Input({
  label, type, value, onChange, toggle, autoFocus, autoComplete, minLength,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void;
  toggle?: boolean; autoFocus?: boolean; autoComplete?: string; minLength?: number;
}) {
  const [show, setShow] = useState(false);
  const inputType = toggle ? (show ? 'text' : 'password') : type;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          required
          minLength={minLength}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          className="input-base"
        />
        {toggle && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

/* Password Strength Meter */
function PasswordMeter({ password }: { password: string }) {
  if (password.length === 0) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  
  const labels = ['Weak', 'Weak', 'Fair', 'Strong'];
  const colors = ['bg-destructive', 'bg-destructive', 'bg-accent', 'bg-primary'];

  return (
    <div className="space-y-2 animate-slideUp">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? colors[score - 1] : 'bg-border'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{labels[score - 1] || 'Too short'}</p>
    </div>
  );
}

/* Main Auth Form */
export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { login, register, isLoading, error, clearError } = useAuthStore();

  const isLogin = mode === 'login';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('All fields are required');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    if (!isLogin && password !== confirm) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      isLogin ? await login(email, password) : await register(email, password);
    } catch {
      /* store handles error */
    }
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    clearError();
    setLocalError(null);
    setConfirm('');
  };

  const err = localError || error;

  return (
    <div className="card shadow-premium-lg">
      {/* Header */}
      <div className="px-6 py-8 border-b border-border/30 bg-card/50">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isLogin ? 'Access your vault' : 'Create your vault'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isLogin
            ? 'Your encryption keys never leave your device'
            : 'Keys are generated locally, no servers involved'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={submit} className="px-6 py-8 space-y-6">
        
        {/* Error */}
        {err && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 animate-slideUp">
            <p className="text-sm text-destructive font-medium">{err}</p>
          </div>
        )}

        {/* Email */}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoFocus
          autoComplete="email"
        />

        {/* Password */}
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          toggle
          minLength={8}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
        />

        {/* Password Strength (Register) */}
        {!isLogin && password && <PasswordMeter password={password} />}

        {/* Confirm Password (Register) */}
        {!isLogin && (
          <Input
            label="Confirm Password"
            type="password"
            value={confirm}
            onChange={setConfirm}
            toggle
            autoComplete="new-password"
          />
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full h-11 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <span>{isLogin ? 'Access Vault' : 'Create Vault'}</span>
          )}
        </button>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border/30">
          <span>{isLogin ? 'New here?' : 'Have an account?'}</span>
          <button
            type="button"
            onClick={() => switchMode(isLogin ? 'register' : 'login')}
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </form>

      {/* Footer Warning */}
      <div className="px-6 py-5 bg-secondary/20 border-t border-border/30 rounded-b-lg">
        <p className="text-xs text-muted-foreground text-center">
          No password recovery possible. <span className="text-foreground font-medium">Keep your password safe.</span>
        </p>
      </div>
    </div>
  );
}
