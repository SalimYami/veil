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
    <div className="space-y-1.5 animate-in">
      <label className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground/80 uppercase ml-0.5">{label}</label>
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

function PasswordMeter({ password }: { password: string }) {
  if (password.length === 0) return null;
  const score = [
    password.length >= 10,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  
  const colors = ['bg-destructive', 'bg-destructive', 'bg-amber-500', 'bg-primary'];

  return (
    <div className="flex gap-1 mt-1.5 px-0.5">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-700 ${
            i < score ? colors[score - 1] : 'bg-white/5'
          }`}
        />
      ))}
    </div>
  );
}

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
      setLocalError('Champs requis manquants');
      return;
    }
    if (password.length < 8) {
      setLocalError('Minimum 8 caractères');
      return;
    }
    if (!isLogin && password !== confirm) {
      setLocalError('Mots de passe différents');
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch { /* Handled by store */ }
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    clearError();
    setLocalError(null);
    setConfirm('');
  };

  const err = localError || error;

  return (
    <div className="space-y-6 animate-in">
      <div className="card shadow-pro bg-black/40 border-white/[0.04]">
        {/* Header Tabs */}
        <div className="px-6 py-6 pb-4">
          <div className="flex bg-white/[0.03] p-1 rounded-lg mb-6 w-full border border-white/[0.02]">
            <button 
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all uppercase tracking-wider ${isLogin ? 'bg-white/5 text-white shadow-sm' : 'text-muted-foreground/60 hover:text-white/80'}`}
            >
              Connexion
            </button>
            <button 
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all uppercase tracking-wider ${!isLogin ? 'bg-white/5 text-white shadow-sm' : 'text-muted-foreground/60 hover:text-white/80'}`}
            >
              Inscription
            </button>
          </div>

          <h2 className="text-xl font-bold text-white mb-1 tracking-tight">
            {isLogin ? "S'identifier" : 'Créer un compte'}
          </h2>
          <p className="text-[12px] text-muted-foreground font-medium">
            {isLogin ? 'Identité sécurisée requise.' : 'Architecture Zero-Knowledge.'}
          </p>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

        <form onSubmit={submit} className="px-6 py-6 space-y-4">
          {err && (
            <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2.5 animate-in">
              <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
              <p className="text-[11px] text-destructive font-semibold">{err}</p>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoFocus
              autoComplete="email"
            />

            <div className="space-y-1.5">
              <Input
                label="Mot de passe"
                type="password"
                value={password}
                onChange={setPassword}
                toggle
                minLength={8}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              {!isLogin && password && <PasswordMeter password={password} />}
            </div>

            {!isLogin && (
              <Input
                label="Confirmation"
                type="password"
                value={confirm}
                onChange={setConfirm}
                toggle
                autoComplete="new-password"
              />
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full h-9 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin opacity-60" />
                  <span className="opacity-80">Encryption...</span>
                </>
              ) : (
                <span>{isLogin ? 'Se connecter' : 'Créer'}</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.02]">
        <ShieldAlert size={14} className="text-amber-500/60 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-muted-foreground/70 leading-relaxed font-medium">
          Zero-Knowledge Policy: <span className="text-white/60">VEIL ne stocke jamais votre mot de passe.</span> En cas de perte, vos données seront définitivement verrouillées.
        </p>
      </div>
    </div>
  );
}
