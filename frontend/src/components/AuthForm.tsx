import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Loader2, ArrowRight, AlertCircle, Eye, EyeOff, Mail, KeyRound, ShieldCheck, Lock, Cpu, Fingerprint } from 'lucide-react';
import { Logo } from './Logo';

interface InputProps {
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
}

function SecureInput({ label, type, value, onChange, required, minLength, icon, showToggle, autoFocus, autoComplete }: InputProps) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const inputType = showToggle ? (show ? 'text' : 'password') : type;
  const active = focused || value.length > 0;

  return (
    <div className="relative group">
      <div className={`relative flex items-center rounded-xl border transition-all duration-200 overflow-hidden
        ${focused
          ? 'border-v-accent bg-[rgba(99,102,241,0.06)] ring-accent'
          : 'border-[rgba(255,255,255,0.07)] bg-[rgba(8,8,20,0.7)] hover:border-[rgba(255,255,255,0.12)]'
        }`}
      >
        {/* Left Icon */}
        {icon && (
          <div className={`flex-shrink-0 pl-4 transition-colors duration-200 ${focused ? 'text-v-accent' : 'text-v-t3'}`}>
            {icon}
          </div>
        )}

        {/* Input Content */}
        <div className="relative flex-1 px-4 py-4">
          <label className={`absolute left-0 pointer-events-none transition-all duration-200 font-medium
            ${active
              ? 'text-[10px] top-1 text-v-accent tracking-widest uppercase'
              : 'text-sm top-1/2 -translate-y-1/2 text-v-t3'
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
            className="w-full bg-transparent border-none outline-none text-v-t1 text-sm pt-3 font-['Inter']"
          />
        </div>

        {/* Password Toggle */}
        {showToggle && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="flex-shrink-0 pr-4 text-v-t3 hover:text-v-t2 transition-colors cursor-pointer"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
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

    if (!email || !password) {
      setFormError('Veuillez remplir tous les champs.');
      return;
    }
    if (password.length < 8) {
      setFormError('Le mot de passe doit faire au moins 8 caractères.');
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      setFormError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch {
      // handled by store
    }
  };

  const handleTabSwitch = (loginMode: boolean) => {
    setIsLogin(loginMode);
    clearError();
    setFormError(null);
    setConfirmPassword('');
  };

  const displayError = formError || error;

  return (
    <div className="w-full animate-fade-up">
      {/* Mobile logo */}
      <div className="lg:hidden flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-4 animate-pulse-glow">
          <Logo size={30} />
        </div>
        <h1 className="text-2xl font-bold text-gradient tracking-tight">VEIL</h1>
        <p className="text-v-t3 text-xs mt-1 font-mono tracking-widest uppercase">Zero-Knowledge Vault</p>
      </div>

      {/* Title */}
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-v-t1 tracking-tight mb-1">
          {isLogin ? 'Accès sécurisé' : 'Création du coffre'}
        </h2>
        <p className="text-v-t3 text-sm">
          {isLogin
            ? 'Votre clé de chiffrement est générée localement.'
            : 'Votre mot de passe ne quitte jamais cet appareil.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-[rgba(8,8,20,0.8)] rounded-xl border border-[rgba(255,255,255,0.06)] mb-6">
        {['Connexion', 'Inscription'].map((label, i) => {
          const active = i === 0 ? isLogin : !isLogin;
          return (
            <button
              key={label}
              type="button"
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer
                ${active
                  ? 'bg-v-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                  : 'text-v-t3 hover:text-v-t2 hover:bg-white/5'
                }`}
              onClick={() => handleTabSwitch(i === 0)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {displayError && (
        <div className="flex items-start gap-3 p-3 mb-5 bg-[rgba(244,63,94,0.08)] border border-[rgba(244,63,94,0.2)] rounded-xl animate-fade-in">
          <AlertCircle size={15} className="text-v-danger flex-shrink-0 mt-0.5" />
          <span className="text-v-danger text-sm leading-relaxed">{displayError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <SecureInput
          label="Email professionnel"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={16} />}
          required
          autoFocus
          autoComplete="email"
        />
        <SecureInput
          label="Mot de passe principal"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<KeyRound size={16} />}
          showToggle
          required
          minLength={8}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
        />
        {!isLogin && (
          <div className="animate-fade-in">
            <SecureInput
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock size={16} />}
              showToggle
              required
              autoComplete="new-password"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full mt-2 py-3.5 px-5 rounded-xl font-semibold text-sm transition-all duration-200 
            flex items-center justify-center gap-2 cursor-pointer select-none
            ${isLoading
              ? 'bg-v-accent/50 text-white/60 cursor-wait'
              : 'bg-v-accent hover:bg-v-accent-2 text-white shadow-[0_4px_24px_rgba(99,102,241,0.35)] hover:shadow-[0_4px_32px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 active:translate-y-0'
            }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {isLogin ? 'Dérivation des clés...' : 'Génération ZK...'}
            </>
          ) : (
            <>
              {isLogin ? 'Accéder au coffre' : 'Créer le coffre'}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* ZK Notice */}
      <div className="mt-6 p-4 rounded-xl border border-[rgba(99,102,241,0.15)] bg-[rgba(99,102,241,0.05)] flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.2)] flex items-center justify-center">
          <Fingerprint size={15} className="text-v-accent-2" />
        </div>
        <div>
          <p className="text-v-t1 text-xs font-semibold mb-0.5">Architecture Zero-Knowledge</p>
          <p className="text-v-t3 text-xs leading-relaxed">
            Votre mot de passe dérive localement les clés AES-256-GCM. Seules des preuves
            cryptographiques transitent sur le réseau.{' '}
            <span className="text-v-danger font-medium">Récupération de compte impossible.</span>
          </p>
        </div>
      </div>

      {/* Trust indicators */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          { icon: <ShieldCheck size={12} />, label: 'AES-256-GCM' },
          { icon: <Cpu size={12} />, label: 'Argon2id' },
          { icon: <Lock size={12} />, label: 'E2E Chiffré' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 p-2 rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)]">
            <span className="text-v-t3">{item.icon}</span>
            <span className="text-[10px] font-mono text-v-t3 uppercase tracking-wider">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
