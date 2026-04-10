import { useAuthStore } from './store/authStore';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { Logo } from './components/Logo';
import { ShieldCheck, Cpu, Server, ArrowRight, Star } from 'lucide-react';
import './App.css';

const FEATURES = [
  {
    icon: <ShieldCheck size={15} />,
    color: 'text-v-success bg-v-success/10 border-v-success/20',
    title: 'Chiffrement AES-256-GCM',
    desc: 'Exécuté dans votre navigateur. Le serveur ne reçoit que des blobs opaques.',
  },
  {
    icon: <Cpu size={15} />,
    color: 'text-v-accent-3 bg-v-accent/10 border-v-accent/20',
    title: 'Dérivation Argon2id',
    desc: 'Votre mot de passe dérive localement les clés. Aucun secret ne quitte cet appareil.',
  },
  {
    icon: <Server size={15} />,
    color: 'text-v-purple bg-[rgba(192,132,252,0.1)] border-[rgba(192,132,252,0.2)]',
    title: 'Architecture Trustless',
    desc: 'Même l\'administrateur ne peut pas lire vos données. Mathématiquement garanti.',
  },
];

function App() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Dashboard />;

  return (
    <div className="min-h-screen bg-v-bg text-v-t1 flex overflow-hidden relative">

      {/* ─── Global Atmosphere ─── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Grid */}
        <div className="absolute inset-0 grid-lines opacity-100" />
        {/* Top center glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-v-accent opacity-[0.06] blur-[120px] rounded-full" />
        {/* Bottom left purple */}
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-v-purple opacity-[0.04] blur-[100px] rounded-full" />
        {/* Right accent */}
        <div className="absolute top-1/2 right-0 w-[400px] h-[500px] bg-v-accent opacity-[0.03] blur-[80px] rounded-full" />
      </div>

      {/* ─── LEFT PANEL ─── */}
      <aside className="hidden lg:flex lg:w-[54%] relative flex-col justify-between py-12 px-14 border-r border-[rgba(255,255,255,0.04)]">

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl glass flex items-center justify-center" style={{ animation: 'pulse-ring 3s ease-in-out infinite' }}>
            <Logo size={19} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[15px] tracking-[0.15em] text-white">VEIL</span>
            <span className="text-[9px] font-mono text-v-accent tracking-[0.2em] uppercase bg-v-accent/10 border border-v-accent/20 px-1.5 py-0.5 rounded-md">OS</span>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-[500px]">

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-accent mb-8 animate-fade-in">
            <div className="status-online" />
            <span className="text-[10px] font-mono text-v-accent-3 tracking-[0.15em] uppercase">Infrastructure ZK Active</span>
          </div>

          {/* Headline */}
          <h1 className="font-black text-[52px] leading-[1.05] tracking-tight mb-6 animate-fade-up">
            <span className="text-white">Enterprise</span>
            <br />
            <span className="text-gradient-accent">Zero‑Knowledge</span>
            <br />
            <span className="text-white">Infrastructure.</span>
          </h1>

          <p className="text-v-t2 text-[15px] leading-[1.7] mb-10 max-w-[420px] animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Le chiffrement de bout en bout s'exécute intégralement dans votre navigateur.
            Conçu pour les équipes exigeant une <span className="text-v-t1 font-medium">confidentialité mathématique absolue</span>.
          </p>

          {/* Features */}
          <div className="flex flex-col gap-3 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="flex items-center gap-4 p-4 rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.08)] transition-all duration-200 group cursor-default"
                style={{ animationDelay: `${0.25 + i * 0.08}s` }}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110 duration-200 ${f.color}`}>
                  {f.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-[13px] font-semibold leading-none mb-1">{f.title}</p>
                  <p className="text-v-t3 text-[12px] leading-relaxed">{f.desc}</p>
                </div>
                <ArrowRight size={14} className="text-v-t4 group-hover:text-v-t3 group-hover:translate-x-0.5 transition-all ml-auto flex-shrink-0" />
              </div>
            ))}
          </div>

          {/* Metrics */}
          <div className="mt-10 pt-8 border-t border-[rgba(255,255,255,0.04)] grid grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '0.5s' }}>
            {[
              { value: '256', unit: '-bit', label: 'AES-GCM' },
              { value: '100%', unit: '', label: 'Chiffrement local' },
              { value: '0', unit: '', label: 'Knowledge serveur' },
            ].map((m) => (
              <div key={m.label} className="flex flex-col">
                <div className="flex items-baseline gap-0.5 mb-1">
                  <span className="text-[22px] font-black text-gradient-accent leading-none">{m.value}</span>
                  {m.unit && <span className="text-[10px] text-v-t3 font-mono">{m.unit}</span>}
                </div>
                <span className="text-[10px] text-v-t3 font-mono uppercase tracking-wider leading-tight">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-mono text-v-t3">
            <Star size={10} className="text-v-accent" />
            <span>VEIL Enterprise · Build 3.0.0</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-v-t3">
            <div className="w-1.5 h-1.5 rounded-full bg-v-success animate-pulse" />
            <span>All systems operational</span>
          </div>
        </div>

        {/* Side glow line */}
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-v-accent/15 to-transparent pointer-events-none" />
      </aside>

      {/* ─── RIGHT PANEL ─── */}
      <main className="w-full lg:w-[46%] relative flex items-center justify-center p-6 lg:p-10 xl:p-14">
        {/* Subtle form ambient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-v-accent opacity-[0.04] blur-[80px] rounded-full" />
        </div>
        <div className="w-full max-w-[400px] relative z-10">
          <AuthForm />
        </div>
      </main>
    </div>
  );
}

export default App;
