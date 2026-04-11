import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Loader2, ArrowRight, AlertCircle, Eye, EyeOff, Lock, Fingerprint } from 'lucide-react';
import { Logo } from './Logo';

/* ─── Input ─── */
function Input({
  label, type, value, onChange, icon, toggle, autoFocus, autoComplete, minLength,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; icon?: React.ReactNode;
  toggle?: boolean; autoFocus?: boolean; autoComplete?: string; minLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const inputType = toggle ? (show ? 'text' : 'password') : type;

  return (
    <div className={`flex items-center gap-3 h-11 px-3.5 rounded-lg border transition-colors duration-150
      ${focused
        ? 'border-v-accent bg-v-accent/[0.04]'
        : 'border-v-border bg-v-surface hover:border-v-border-l'}`}
    >
      {icon && <span className={`flex-shrink-0 transition-colors ${focused ? 'text-v-accent' : 'text-v-t3'}`}>{icon}</span>}
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={label}
        required
        minLength={minLength}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13px] text-v-t1 placeholder-v-t3"
      />
      {toggle && (
        <button type="button" onClick={() => setShow(!show)}
          className="flex-shrink-0 text-v-t3 hover:text-v-t2 transition-colors cursor-pointer p-0.5">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
    </div>
  );
}

/* ─── Password Meter ─── */
function PasswordMeter({ password }: { password: string }) {
  if (password.length === 0) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const label = ['Faible', 'Faible', 'Correct', 'Fort'][score - 1] || 'Trop court';
  const color = score >= 3 ? 'bg-v-success' : score >= 2 ? 'bg-v-warn' : 'bg-v-danger';

  return (
    <div className="flex items-center gap-2 anim-in">
      <div className="flex-1 flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-[3px] flex-1 rounded-full transition-colors ${i < score ? color : 'bg-v-border'}`} />
        ))}
      </div>
      <span className={`text-[10px] font-medium ${score >= 3 ? 'text-v-success' : score >= 2 ? 'text-v-warn' : 'text-v-danger'}`}>
        {label}
      </span>
    </div>
  );
}

/* ─── AuthForm ─── */
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
    clearError(); setLocalError(null);
    if (!email || !password) { setLocalError('Tous les champs sont requis.'); return; }
    if (password.length < 8)  { setLocalError('8 caractères minimum.'); return; }
    if (!isLogin && password !== confirm) { setLocalError('Les mots de passe ne correspondent pas.'); return; }
    try { isLogin ? await login(email, password) : await register(email, password); }
    catch { /* store */ }
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m); clearError(); setLocalError(null); setConfirm('');
  };

  const err = localError || error;

  return (
    <div className="w-full anim-up">

      {/* Mobile brand */}
      <div className="lg:hidden flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 rounded-lg bg-v-accent/10 border border-v-accent/20 flex items-center justify-center text-v-accent">
          <Logo size={18} />
        </div>
        <span className="text-[15px] font-semibold tracking-[0.08em]">VEIL</span>
      </div>

      {/* Title */}
      <h2 className="text-[20px] font-semibold text-v-t1 mb-1">
        {isLogin ? 'Connexion' : 'Créer un compte'}
      </h2>
      <p className="text-[13px] text-v-t3 mb-6">
        {isLogin
          ? 'Vos clés de chiffrement sont dérivées localement.'
          : 'Votre mot de passe ne quitte jamais cet appareil.'}
      </p>

      {/* Tabs */}
      <div className="flex rounded-lg border border-v-border bg-v-surface p-0.5 mb-6">
        {(['login', 'register'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all duration-150 cursor-pointer
              ${mode === m
                ? 'bg-v-elevated text-v-t1 shadow-sm'
                : 'text-v-t3 hover:text-v-t2'}`}
          >
            {m === 'login' ? 'Connexion' : 'Inscription'}
          </button>
        ))}
      </div>

      {/* Error */}
      {err && (
        <div className="flex items-center gap-2.5 p-3 mb-4 rounded-lg border border-v-danger/20 bg-v-danger/[0.06] anim-in">
          <AlertCircle size={14} className="text-v-danger flex-shrink-0" />
          <span className="text-[13px] text-v-danger">{err}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={submit} className="space-y-3">
        <Input
          label="Adresse email"
          type="email"
          value={email}
          onChange={setEmail}
          icon={<Fingerprint size={14} />}
          autoFocus
          autoComplete="email"
        />
        <Input
          label="Mot de passe"
          type="password"
          value={password}
          onChange={setPassword}
          icon={<Lock size={14} />}
          toggle
          minLength={8}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
        />

        {!isLogin && (
          <div className="space-y-3 anim-in">
            <PasswordMeter password={password} />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={confirm}
              onChange={setConfirm}
              icon={<Lock size={14} />}
              toggle
              autoComplete="new-password"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full h-11 rounded-lg text-[13px] font-medium transition-all duration-150
            flex items-center justify-center gap-2 cursor-pointer select-none
            ${isLoading
              ? 'bg-v-accent/60 text-white/70 cursor-wait'
              : 'bg-v-accent hover:bg-v-accent-h active:bg-v-accent-l text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_0_0_1px_rgba(99,102,241,0.4)]'
            }`}
        >
          {isLoading ? (
            <><Loader2 size={15} className="animate-spin" /> Dérivation des clés...</>
          ) : (
            <>{isLogin ? 'Se connecter' : 'Créer le compte'} <ArrowRight size={14} /></>
          )}
        </button>
      </form>

      {/* ZK notice */}
      <div className="mt-6 pt-6 border-t border-v-border">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg border border-v-border bg-v-surface flex items-center justify-center text-v-t3">
            <Lock size={13} />
          </div>
          <div>
            <p className="text-[12px] font-medium text-v-t2 mb-0.5">Architecture Zero-Knowledge</p>
            <p className="text-[11px] text-v-t3 leading-relaxed">
              Le chiffrement AES-256-GCM s'exécute dans votre navigateur via Argon2id.
              Le serveur ne reçoit que des données chiffrées.{' '}
              <span className="text-v-danger">Récupération impossible.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
