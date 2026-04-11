import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Loader2, ArrowRight, Eye, EyeOff, Lock, Fingerprint, ShieldAlert } from 'lucide-react';

/* ─── Premium Input Component ─── */
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
    <div className={`flex items-center gap-4 h-[52px] px-5 rounded-xl border transition-all duration-200
      ${focused
        ? 'border-v-accent bg-v-accent/[0.04] shadow-[0_0_0_4px_rgba(37,99,235,0.08)]'
        : 'border-v-border bg-v-elevated/50 hover:border-v-border-l hover:bg-v-elevated/70'}`}
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
        className="flex-1 min-w-0 bg-transparent border-none outline-none text-[14px] text-v-t1 placeholder-v-t3"
      />
      {toggle && (
        <button type="button" onClick={() => setShow(!show)}
          className="flex-shrink-0 text-v-t3 hover:text-v-t2 transition-colors cursor-pointer p-1">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
}

/* ─── Password Strength Meter ─── */
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
    <div className="flex items-center gap-4 anim-in">
      <div className="flex-1 flex gap-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? color : 'bg-v-border'}`} />
        ))}
      </div>
      <span className={`text-[11px] font-medium ${score >= 3 ? 'text-v-success' : score >= 2 ? 'text-v-warn' : 'text-v-danger'}`}>
        {label}
      </span>
    </div>
  );
}

/* ─── Main Auth Form ─── */
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
    if (password.length < 8)  { setLocalError('8 caracteres minimum.'); return; }
    if (!isLogin && password !== confirm) { setLocalError('Les mots de passe ne correspondent pas.'); return; }
    try { isLogin ? await login(email, password) : await register(email, password); }
    catch { /* store handles error */ }
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m); clearError(); setLocalError(null); setConfirm('');
  };

  const err = localError || error;

  return (
    <div className="w-full card-premium overflow-hidden anim-up">
      
      {/* ── Main Content Area ── */}
      <div className="p-8 lg:p-10">
        
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-[26px] font-bold text-v-t1 tracking-tight mb-3">
            {isLogin ? 'Acceder au coffre' : 'Creer un coffre'}
          </h2>
          <p className="text-[14px] text-v-t3 leading-relaxed max-w-[340px]">
            {isLogin
              ? 'Votre cle de dechiffrement sera derivee localement. Aucune donnee sensible ne transite.'
              : 'Vos cles maitres restent sur votre appareil. Aucune recuperation possible cote serveur.'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex rounded-xl border border-v-border bg-v-elevated p-1.5 mb-8">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 flex justify-center items-center py-2.5 text-[13px] font-semibold rounded-lg transition-all duration-200 cursor-pointer
                ${mode === m
                  ? 'bg-v-surface text-v-t1 shadow-sm border border-v-border/50'
                  : 'text-v-t3 hover:text-v-t2 border border-transparent'}`}
            >
              {m === 'login' ? 'Connexion' : 'Creation'}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {err && (
          <div className="flex items-start gap-4 p-5 mb-8 rounded-xl border border-v-danger/20 bg-v-danger/[0.04] anim-in">
            <ShieldAlert size={18} className="text-v-danger flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-v-danger leading-relaxed">{err}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} className="space-y-5">
          <Input
            label="Adresse email"
            type="email"
            value={email}
            onChange={setEmail}
            icon={<Fingerprint size={17} />}
            autoFocus
            autoComplete="email"
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={setPassword}
            icon={<Lock size={17} />}
            toggle
            minLength={8}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />

          {!isLogin && (
            <div className="space-y-5 pt-2 anim-in">
              <PasswordMeter password={password} />
              <Input
                label="Confirmez le mot de passe"
                type="password"
                value={confirm}
                onChange={setConfirm}
                icon={<Lock size={17} />}
                toggle
                autoComplete="new-password"
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-[52px] rounded-xl text-[15px] font-semibold transition-all duration-200
                flex items-center justify-center gap-2.5 cursor-pointer
                ${isLoading
                  ? 'bg-v-accent/40 text-white/50 cursor-wait'
                  : 'bg-v-accent hover:bg-v-accent-h text-white shadow-[0_2px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.35)] hover:-translate-y-0.5'
                }`}
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Derivation en cours...</>
              ) : (
                <>{isLogin ? 'Deverrouiller' : 'Creer le coffre'} <ArrowRight size={17} /></>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Footer Notice ── */}
      <div className="bg-v-elevated/30 border-t border-v-border/40 px-8 lg:px-10 py-5">
        <p className="text-[12px] text-v-t3 leading-relaxed text-center">
          Architecture Zero-Knowledge. <span className="text-v-t2">Aucune recuperation de mot de passe possible.</span>
        </p>
      </div>
    </div>
  );
}
