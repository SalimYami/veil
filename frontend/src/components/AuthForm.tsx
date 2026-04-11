import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Loader2, ArrowRight, Eye, EyeOff, Lock, Fingerprint, ShieldAlert } from 'lucide-react';

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
    <div className={`flex items-center gap-3 h-12 px-4 rounded-lg border transition-colors duration-150
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
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
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
    <div className="flex items-center gap-3 anim-in px-1">
      <div className="flex-1 flex gap-1.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-[3px] flex-1 rounded-full transition-colors ${i < score ? color : 'bg-v-border'}`} />
        ))}
      </div>
      <span className={`text-[11px] font-medium ${score >= 3 ? 'text-v-success' : score >= 2 ? 'text-v-warn' : 'text-v-danger'}`}>
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
    <div className="w-full bg-v-surface premium-shadow border border-v-border rounded-2xl overflow-hidden anim-up">
      <div className="p-8">
        
        {/* Header content / Title */}
        <div className="mb-8">
          <h2 className="text-[22px] font-bold text-v-t1 tracking-tight mb-2">
            {isLogin ? 'Accéder au coffre' : 'Créer un coffre'}
          </h2>
          <p className="text-[13px] text-v-t3 leading-relaxed">
            {isLogin
              ? 'Saisissez vos identifiants. Votre clé de déchiffrement sera dérivée en toute sécurité.'
              : 'Générez un nouveau coffre-fort. Vos clés d\'accès master ne quittent jamais votre navigateur.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg border border-v-border bg-v-elevated p-1 mb-6">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 flex justify-center items-center py-2 text-[13px] font-medium rounded-md transition-all duration-150 cursor-pointer
                ${mode === m
                  ? 'bg-v-surface text-v-t1 shadow-sm border border-v-border-l/50'
                  : 'text-v-t3 hover:text-v-t2 border border-transparent'}`}
            >
              {m === 'login' ? 'Connexion' : 'Création'}
            </button>
          ))}
        </div>

        {/* Error */}
        {err && (
          <div className="flex items-start gap-3 p-4 mb-6 rounded-lg border border-v-danger/20 bg-v-danger/[0.04] anim-in">
            <ShieldAlert size={16} className="text-v-danger flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-v-danger leading-relaxed">{err}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Adresse email"
            type="email"
            value={email}
            onChange={setEmail}
            icon={<Fingerprint size={15} />}
            autoFocus
            autoComplete="email"
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={setPassword}
            icon={<Lock size={15} />}
            toggle
            minLength={8}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />

          {!isLogin && (
            <div className="space-y-4 pt-1 anim-in">
              <PasswordMeter password={password} />
              <Input
                label="Confirmez le mot de passe"
                type="password"
                value={confirm}
                onChange={setConfirm}
                icon={<Lock size={15} />}
                toggle
                autoComplete="new-password"
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-12 rounded-lg text-[14px] font-semibold transition-all duration-150
                flex items-center justify-center gap-2 cursor-pointer
                ${isLoading
                  ? 'bg-v-accent/60 text-white/70 cursor-wait'
                  : 'bg-v-accent hover:bg-v-accent-h text-white shadow-[0_2px_4px_rgba(37,99,235,0.2),inset_0_1px_rgba(255,255,255,0.2)] hover:shadow-[0_4px_8px_rgba(37,99,235,0.3),inset_0_1px_rgba(255,255,255,0.2)]'
                }`}
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Dérivation...</>
              ) : (
                <>{isLogin ? 'Déverrouiller le coffre' : 'Générer mes clés'} <ArrowRight size={15} /></>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Footer warning */}
      <div className="bg-v-elevated border-t border-v-border p-4 px-8">
        <p className="text-[12px] text-v-t3 leading-relaxed text-center">
          En continuant, vous acceptez l'architecture Zero-Knowledge. <strong className="text-v-t2 font-medium">Nous ne pourrons pas réinitialiser votre mot de passe si vous le perdez.</strong>
        </p>
      </div>
    </div>
  );
}
