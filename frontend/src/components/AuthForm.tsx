import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  Loader2, ArrowRight, AlertCircle, Eye, EyeOff,
  Mail, KeyRound, ShieldCheck, Lock, Cpu, Fingerprint, Check
} from 'lucide-react';
import { Logo } from './Logo';

type InputProps = {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
  icon?: React.ReactNode;
  showToggle?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  hint?: string;
};

function SecureInput({ label, type, value, onChange, required, minLength, icon, showToggle, autoFocus, autoComplete, hint }: InputProps) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const inputType = showToggle ? (show ? 'text' : 'password') : type;
  const raised = focused || value.length > 0;

  return (
    <div className="flex flex-col gap-1">
      <div className={`relative flex items-center rounded-2xl border transition-all duration-200 overflow-hidden
        ${focused
          ? 'border-v-accent/50 bg-[rgba(99,102,241,0.07)] shadow-[0_0_0_3px_rgba(99,102,241,0.1)]'
          : value.length > 0
            ? 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)]'
            : 'border-[rgba(255,255,255,0.06)] bg-[rgba(8,8,24,0.8)] hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.03)]'
        }`}
      >
        {/* Icon col */}
        {icon && (
          <div className={`flex-shrink-0 w-10 flex items-center justify-center self-stretch border-r transition-colors duration-200
            ${focused
              ? 'border-v-accent/25 text-v-accent'
              : 'border-[rgba(255,255,255,0.05)] text-v-t3'
            }`}
          >
            <div className="mt-3">{icon}</div>
          </div>
        )}

        {/* Content */}
        <div className="relative flex-1 px-4 py-2.5 min-w-0">
          <label className={`absolute left-0 right-0 pointer-events-none transition-all duration-200 font-medium
            ${raised
              ? 'text-[9px] top-2.5 text-v-accent tracking-[0.12em] uppercase'
              : 'text-[13px] top-1/2 -translate-y-1/2 text-v-t3'
            }`}
          >
            {label}
          </label>
          <input
            type={inputType}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            required={required}
            minLength={minLength}
            autoFocus={autoFocus}
            autoComplete={autoComplete}
            className="w-full bg-transparent border-none outline-none text-v-t1 text-[13px] pt-4 pb-0.5 font-['Inter']"
          />
        </div>

        {/* Checkmark when filled & not focused */}
        {!focused && value.length > 0 && !showToggle && (
          <div className="flex-shrink-0 pr-3">
            <Check size={14} className="text-v-success" />
          </div>
        )}

        {/* Toggle */}
        {showToggle && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="flex-shrink-0 px-3 text-v-t3 hover:text-v-t2 transition-colors cursor-pointer self-stretch flex items-center"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {hint && focused && (
        <p className="text-[10px] text-v-t3 px-1 animate-fade-in">{hint}</p>
      )}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['bg-v-danger', 'bg-v-warn', 'bg-v-warn', 'bg-v-success'];
  const labels = ['Très faible', 'Faible', 'Moyen', 'Fort'];

  return (
    <div className="flex flex-col gap-2 px-1 animate-fade-in">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : 'bg-[rgba(255,255,255,0.07)]'}`}
          />
        ))}
        <span className={`text-[10px] font-mono ml-1 ${score >= 3 ? 'text-v-success' : score >= 2 ? 'text-v-warn' : 'text-v-danger'}`}>
          {labels[score - 1] || 'Trop court'}
        </span>
      </div>
    </div>
  );
}

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const { login, register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError(null);
    if (!email || !password) { setFormError('Veuillez remplir tous les champs.'); return; }
    if (password.length < 8) { setFormError('Le mot de passe doit faire au moins 8 caractères.'); return; }
    if (!isLogin && password !== confirmPassword) { setFormError('Les mots de passe ne correspondent pas.'); return; }
    try {
      if (isLogin) await login(email, password);
      else await register(email, password);
    } catch { /* handled by store */ }
  };

  const switchTab = (login: boolean) => {
    setIsLogin(login);
    clearError();
    setFormError(null);
    setConfirmPassword('');
  };

  const displayError = formError || error;

  return (
    <div className="w-full animate-fade-up">

      {/* Mobile logo */}
      <div className="lg:hidden flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center mb-3">
          <Logo size={26} />
        </div>
        <span className="font-bold text-lg tracking-[0.15em] text-gradient">VEIL OS</span>
      </div>

      {/* Heading */}
      <div className="mb-6">
        <h2 className="font-bold text-[22px] text-white tracking-tight mb-1.5">
          {isLogin ? 'Accès au coffre-fort' : 'Créer votre coffre'}
        </h2>
        <p className="text-v-t3 text-[13px]">
          {isLogin
            ? 'Dérivation des clés effectuée localement — serveur zero-knowledge.'
            : 'Votre mot de passe ne quitte jamais cet appareil. Irrécupérable.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="relative flex p-1 rounded-xl bg-[rgba(8,8,24,0.9)] border border-[rgba(255,255,255,0.06)] mb-6 select-none">
        {/* Sliding indicator */}
        <div
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-[10px] bg-v-accent transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_4px_20px_rgba(99,102,241,0.4)]"
          style={{ left: isLogin ? '4px' : '50%' }}
        />
        {['Connexion', 'Inscription'].map((label, i) => (
          <button
            key={label}
            type="button"
            className={`relative flex-1 py-2.5 text-[13px] font-semibold transition-colors duration-200 rounded-[10px] cursor-pointer z-10
              ${(i === 0) === isLogin ? 'text-white' : 'text-v-t3 hover:text-v-t2'}`}
            onClick={() => switchTab(i === 0)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error */}
      {displayError && (
        <div className="flex items-start gap-3 p-3.5 mb-5 border border-v-danger/25 bg-v-danger/8 rounded-2xl animate-fade-in">
          <AlertCircle size={14} className="text-v-danger flex-shrink-0 mt-0.5" />
          <span className="text-v-danger text-[13px] leading-relaxed">{displayError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <SecureInput
          label="Email professionnel"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={15} />}
          required
          autoFocus
          autoComplete="email"
        />
        <SecureInput
          label="Mot de passe principal"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<KeyRound size={15} />}
          showToggle
          required
          minLength={8}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          hint="Minimum 8 caractères — ne sera jamais transmis au serveur"
        />

        {!isLogin && (
          <>
            <PasswordStrength password={password} />
            <div className="animate-fade-in">
              <SecureInput
                label="Confirmer le mot de passe"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock size={15} />}
                showToggle
                required
                autoComplete="new-password"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`relative w-full mt-2 py-3.5 px-5 rounded-2xl font-semibold text-[14px] transition-all duration-200
            flex items-center justify-center gap-2.5 cursor-pointer overflow-hidden group select-none outline-none
            ${isLoading
              ? 'bg-v-accent/50 text-white/60 cursor-wait'
              : 'bg-v-accent hover:bg-[#5557d9] text-white'
            }`}
          style={!isLoading ? { boxShadow: '0 4px 32px rgba(99,102,241,0.4), 0 1px 0 rgba(255,255,255,0.1) inset' } : {}}
        >
          {/* Hover shimmer overlay */}
          {!isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          )}
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {isLogin ? 'Dérivation des clés AES...' : 'Génération Zero-Knowledge...'}
            </>
          ) : (
            <>
              {isLogin ? 'Accéder au coffre' : 'Créer le coffre sécurisé'}
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </>
          )}
        </button>
      </form>

      {/* ZK Notice */}
      <div className="mt-5 p-4 rounded-2xl border border-[rgba(99,102,241,0.15)] bg-[rgba(99,102,241,0.05)] flex items-start gap-3.5">
        <div className="flex-shrink-0 w-8 h-8 rounded-xl glass-accent flex items-center justify-center">
          <Fingerprint size={15} className="text-v-accent-3" />
        </div>
        <div>
          <p className="text-white text-[12px] font-semibold mb-1">Architecture Zero-Knowledge</p>
          <p className="text-v-t3 text-[11px] leading-[1.65]">
            Votre mot de passe dérive localement les clés AES-256-GCM via Argon2id.
            Seules des preuves cryptographiques transitent sur le réseau.{' '}
            <span className="text-v-danger font-medium">Récupération de compte impossible.</span>
          </p>
        </div>
      </div>

      {/* Trust pills */}
      <div className="mt-4 flex items-center gap-2 justify-center flex-wrap">
        {[
          { icon: <ShieldCheck size={10} />, label: 'AES-256-GCM' },
          { icon: <Cpu size={10} />, label: 'Argon2id KDF' },
          { icon: <Lock size={10} />, label: 'Zero Knowledge' },
        ].map((pill) => (
          <div key={pill.label} className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)]">
            <span className="text-v-t3">{pill.icon}</span>
            <span className="text-[9px] font-mono text-v-t3 uppercase tracking-widest">{pill.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
