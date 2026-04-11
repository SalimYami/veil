import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Loader2, Eye, EyeOff, ShieldAlert } from 'lucide-react';

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
    <div className="space-y-2.5">
      <label className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=""
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
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
    <div className="space-y-2.5 animate-slideUp mt-1">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
              i < score ? colors[score - 1] : 'bg-secondary'
            }`}
          />
        ))}
      </div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{labels[score - 1] || 'Too short'}</p>
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
    <div className="space-y-8 animate-fadeIn">
      {/* Visual Identity / Header outside the strict form box if we want it isolated, but inside is also good. Let's put it inside. */}
      
      <div className="card shadow-premium-lg">
        {/* Header Region */}
        <div className="px-10 py-12 pb-8">
          <div className="flex bg-secondary/50 p-1.5 rounded-[14px] mb-10 w-fit">
            <button 
              type="button"
              onClick={() => switchMode('login')}
              className={`px-5 py-2 text-[14px] font-semibold rounded-[10px] transition-all duration-300 ${isLogin ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => switchMode('register')}
              className={`px-5 py-2 text-[14px] font-semibold rounded-[10px] transition-all duration-300 ${!isLogin ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Initialize Vault
            </button>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
            {isLogin ? 'Accès au Coffre.' : 'Création du Coffre.'}
          </h2>
          <p className="text-[15px] text-muted-foreground font-medium">
            {isLogin
              ? 'L\'authentification déchiffre vos clés locales.'
              : 'Génération cryptographique côté client.'}
          </p>
        </div>

        {/* Dynamic Border Separator */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

        {/* Form Region */}
        <form onSubmit={submit} className="px-10 py-10 space-y-7">
          
          {/* Error */}
          {err && (
            <div className="px-5 py-4 rounded-xl bg-destructive/10 border border-destructive/20 animate-slideUp flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-[14px] text-destructive font-medium">{err}</p>
            </div>
          )}

          <div className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              autoFocus
              autoComplete="email"
            />

            <Input
              label="Master Password"
              type="password"
              value={password}
              onChange={setPassword}
              toggle
              minLength={8}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />

            {!isLogin && password && <PasswordMeter password={password} />}

            {!isLogin && (
              <Input
                label="Confirm Master Password"
                type="password"
                value={confirm}
                onChange={setConfirm}
                toggle
                autoComplete="new-password"
              />
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full h-14 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white/70" />
                  <span>Processing encryption...</span>
                </>
              ) : (
                <span>{isLogin ? 'Unlock Vault' : 'Generate Keys & Create Vault'}</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Disconnected Footer Warning */}
      <div className="flex items-start gap-4 px-4">
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500/80 flex-shrink-0">
          <ShieldAlert size={18} />
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed pt-0.5">
          VEIL employs strict zero-knowledge architecture. <span className="text-foreground font-medium">We cannot recover your password.</span> Loss of credentials results in permanent cryptographic lockout.
        </p>
      </div>
    </div>
  );
}

