import { useAuthStore } from './store/authStore';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { Logo } from './components/Logo';
import { ShieldCheck, Cpu, Server, Zap } from 'lucide-react';
import './App.css';

const FEATURES = [
  {
    icon: <ShieldCheck size={16} />,
    title: 'Cryptographie Trustless',
    desc: 'AES-256-GCM exécuté dans votre navigateur. Mathématiquement impossible pour Veil de lire vos fichiers.',
  },
  {
    icon: <Cpu size={16} />,
    title: 'Dérivation Argon2id',
    desc: 'Votre mot de passe ne transite jamais. Seule une preuve cryptographique est envoyée au serveur.',
  },
  {
    icon: <Server size={16} />,
    title: 'Architecture Distribuée',
    desc: 'Blobs opaques stockés en haute disponibilité. Sans votre clé, les données restent indéchiffrables.',
  },
];

const STATS = [
  { value: '256', unit: 'bit', label: 'AES-GCM' },
  { value: '0', unit: '', label: 'Connaissance' },
  { value: '∞', unit: '', label: 'Résilience' },
];

function App() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-v-bg text-v-t1 flex overflow-hidden relative">
      {/* Global background */}
      <div className="absolute inset-0 dot-grid opacity-100 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-v-accent opacity-[0.04] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-[#c084fc] opacity-[0.04] blur-[100px]" />
      </div>

      {/* ── LEFT PANEL ── */}
      <aside className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-14 border-r border-[rgba(255,255,255,0.05)] bg-[rgba(4,4,16,0.6)]">
        {/* Top brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl glass flex items-center justify-center animate-pulse-glow">
            <Logo size={20} />
          </div>
          <div>
            <span className="font-bold text-base tracking-widest text-white font-['Inter']">VEIL</span>
            <span className="ml-2 text-[10px] text-v-accent font-mono tracking-widest uppercase border border-v-accent/30 px-1.5 py-0.5 rounded-md bg-v-accent/10">OS</span>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-v-accent/25 bg-v-accent/10 mb-8">
            <div className="status-online" />
            <span className="text-[11px] font-mono text-v-accent-2 tracking-widest uppercase">Zero-Knowledge Active</span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            <span className="text-white">Enterprise-grade</span>
            <br />
            <span className="text-gradient-accent">Zero-Knowledge</span>
            <br />
            <span className="text-white">Infrastructure.</span>
          </h1>

          <p className="text-v-t2 text-base leading-relaxed mb-10 max-w-md">
            Le chiffrement de bout en bout s'exécute intégralement dans
            votre navigateur. Conçu pour les professionnels exigeant
            une confidentialité mathématique absolue.
          </p>

          {/* Features */}
          <div className="flex flex-col gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg border border-v-accent/20 bg-v-accent/10 flex items-center justify-center text-v-accent-2 group-hover:border-v-accent/40 group-hover:bg-v-accent/15 transition-all duration-200">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-0.5">{f.title}</h3>
                  <p className="text-v-t3 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-10 pt-8 border-t border-[rgba(255,255,255,0.05)] grid grid-cols-3 gap-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gradient-accent">{s.value}</span>
                  {s.unit && <span className="text-xs text-v-t3 font-mono">{s.unit}</span>}
                </div>
                <p className="text-xs text-v-t3 font-mono uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom footer */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-v-accent" />
            <span className="text-[11px] font-mono text-v-t3 uppercase tracking-widest">Veil Enterprise</span>
          </div>
          <span className="text-[11px] font-mono text-v-t3">v3.0.0</span>
        </div>

        {/* Decorative glow lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 -right-px w-px h-40 bg-gradient-to-b from-transparent via-v-accent/30 to-transparent" />
          <div className="absolute top-2/3 -right-px w-px h-24 bg-gradient-to-b from-transparent via-v-accent/15 to-transparent" />
        </div>
      </aside>

      {/* ── RIGHT PANEL ── */}
      <main className="w-full lg:w-[48%] flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-v-accent opacity-[0.03] blur-[80px]" />
        </div>
        <div className="w-full max-w-[420px] relative z-10">
          <AuthForm />
        </div>
      </main>
    </div>
  );
}

export default App;
