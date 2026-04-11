import { useAuthStore } from './store/authStore';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { Logo } from './components/Logo';
import { Lock, ArrowUpRight } from 'lucide-react';
import './App.css';

function App() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Dashboard />;

  return (
    <div className="min-h-screen bg-v-bg flex flex-col lg:flex-row relative overflow-hidden">

      {/* ── BACKGROUND EFFECTS ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Subtle grid */}
        <div className="absolute inset-0 auth-grid opacity-20" />
        
        {/* Soft radial halo — very subtle */}
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 bg-v-accent opacity-[0.02] blur-[140px] rounded-full mix-blend-screen" />
      </div>

      {/* ── LEFT — Premium branding & message (56%) ── */}
      <aside className="relative z-10 w-full lg:w-[56%] flex flex-col justify-center px-6 py-12 lg:px-28 lg:py-20">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 mb-20 lg:mb-32">
          <div className="w-10 h-10 rounded-xl bg-v-elevated border border-v-border/40 flex items-center justify-center text-v-accent">
            <Logo size={22} />
          </div>
          <span className="text-[18px] font-semibold tracking-[0.02em] text-v-t1">VEIL</span>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-10 w-fit">
          <div className="flex items-center gap-2 h-7 px-3 rounded-full border border-v-success/20 bg-v-success/8">
            <div className="w-1.5 h-1.5 rounded-full bg-v-success" />
            <span className="text-[10px] font-medium text-v-success uppercase tracking-widest">Secure by design</span>
          </div>
        </div>

        {/* Hero Headline — VERY MINIMAL */}
        <h1 className="text-[48px] lg:text-[56px] font-bold leading-[1.08] tracking-[-0.02em] text-v-t1 mb-6 max-w-[540px]">
          Chiffré avant transit.
        </h1>

        {/* Subheading — Single line, minimal */}
        <p className="text-[15px] lg:text-[16px] text-v-t2 leading-relaxed max-w-[480px] mb-16">
          Clés dérivées localement. Zero-knowledge par architecture.
        </p>

        {/* Trust Indicators — Compact, elegant */}
        <div className="flex flex-col gap-3 mb-20 max-w-[520px]">
          <div className="flex items-start gap-3 p-4 rounded-lg border border-v-border/30 bg-v-surface/20 backdrop-blur-sm">
            <Lock size={16} className="text-v-accent mt-0.5 flex-shrink-0" />
            <div className="text-[13px] text-v-t2">
              <span className="font-medium text-v-t1">AES-256-GCM</span> — Chiffrement côté client
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg border border-v-border/30 bg-v-surface/20 backdrop-blur-sm">
            <Lock size={16} className="text-v-accent mt-0.5 flex-shrink-0" />
            <div className="text-[13px] text-v-t2">
              <span className="font-medium text-v-t1">Argon2id</span> — Dérivation de clé locale
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg border border-v-border/30 bg-v-surface/20 backdrop-blur-sm">
            <Lock size={16} className="text-v-accent mt-0.5 flex-shrink-0" />
            <div className="text-[13px] text-v-t2">
              <span className="font-medium text-v-t1">Irrécupérable</span> — Pas de backdoor, pas de clé maître serveur
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex items-center gap-4 text-[11px] font-medium text-v-t3 mt-auto">
          <span>© 2026 VEIL</span>
          <a href="#" className="hover:text-v-accent transition-colors flex items-center gap-1">
            Docs <ArrowUpRight size={11} />
          </a>
          <a href="#" className="hover:text-v-accent transition-colors flex items-center gap-1">
            Audit <ArrowUpRight size={11} />
          </a>
        </div>
      </aside>

      {/* ── RIGHT — Auth card (44%) ── */}
      <main className="relative z-10 w-full lg:w-[44%] flex items-center justify-center p-6 lg:p-12 border-t lg:border-t-0 lg:border-l border-v-border/40 min-h-[500px] lg:min-h-screen">
        <div className="w-full max-w-[420px]">
          <AuthForm />
        </div>
      </main>

    </div>
  );
}

export default App;
