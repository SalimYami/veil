import { useAuthStore } from './store/authStore';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { Logo } from './components/Logo';
import { ShieldCheck, Cpu, Database, ArrowUpRight } from 'lucide-react';
import './App.css';

function App() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Dashboard />;

  return (
    <div className="min-h-screen bg-v-bg flex flex-col lg:flex-row relative overflow-hidden">

      {/* ── BACKGROUND EFFECTS ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 auth-grid opacity-15" />
        <div className="absolute top-1/2 left-1/3 w-[900px] h-[900px] -translate-x-1/2 -translate-y-1/2 bg-v-accent opacity-[0.015] blur-[160px] rounded-full" />
      </div>

      {/* ── LEFT COLUMN — Premium Branding (54%) ── */}
      <aside className="relative z-10 w-full lg:w-[54%] flex flex-col px-8 py-12 lg:px-20 lg:py-16 xl:px-28">
        
        {/* Logo & Brand Mark */}
        <div className="flex items-center gap-3.5 mb-auto">
          <div className="w-11 h-11 rounded-xl bg-v-elevated border border-v-border flex items-center justify-center text-v-accent">
            <Logo size={24} />
          </div>
          <span className="text-lg font-semibold tracking-wide text-v-t1">VEIL</span>
        </div>

        {/* Hero Content — Centered vertically */}
        <div className="flex-1 flex flex-col justify-center py-16 lg:py-24">
          
          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-2.5 h-8 px-4 rounded-full border border-v-success/20 bg-v-success/[0.06]">
              <div className="w-1.5 h-1.5 rounded-full bg-v-success animate-pulse" />
              <span className="text-[11px] font-medium text-v-success uppercase tracking-widest">Zero-Knowledge Active</span>
            </div>
          </div>

          {/* Premium Headline */}
          <h1 className="text-[44px] lg:text-[52px] xl:text-[58px] font-bold leading-[1.06] tracking-[-0.025em] text-v-t1 mb-5 max-w-[580px] text-balance">
            Confidentialité par architecture.
          </h1>

          {/* Subheading */}
          <p className="text-base lg:text-[17px] text-v-t2 leading-relaxed max-w-[520px] mb-12">
            Vos clés de chiffrement sont dérivées localement et ne quittent jamais votre appareil. Aucun serveur ne peut lire vos données.
          </p>

          {/* Trust Signals — Premium Cards */}
          <div className="flex flex-col gap-4 max-w-[540px]">
            
            <div className="flex items-start gap-4 p-5 rounded-xl border border-v-border/60 bg-v-surface/30 backdrop-blur-sm hover:bg-v-surface/50 transition-colors">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-v-elevated border border-v-border flex items-center justify-center text-v-accent">
                <ShieldCheck size={18} />
              </div>
              <div className="pt-0.5">
                <h3 className="text-[14px] font-semibold text-v-t1 mb-1.5">Chiffrement AES-256-GCM</h3>
                <p className="text-[13px] text-v-t3 leading-relaxed">Standard militaire. Le serveur ne voit que des données inintelligibles.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-xl border border-v-border/60 bg-v-surface/30 backdrop-blur-sm hover:bg-v-surface/50 transition-colors">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-v-elevated border border-v-border flex items-center justify-center text-v-accent">
                <Cpu size={18} />
              </div>
              <div className="pt-0.5">
                <h3 className="text-[14px] font-semibold text-v-t1 mb-1.5">Dérivation Argon2id</h3>
                <p className="text-[13px] text-v-t3 leading-relaxed">Clés maîtres générées sur votre appareil, sans transfert réseau.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-xl border border-v-border/60 bg-v-surface/30 backdrop-blur-sm hover:bg-v-surface/50 transition-colors">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-v-elevated border border-v-border flex items-center justify-center text-v-accent">
                <Database size={18} />
              </div>
              <div className="pt-0.5">
                <h3 className="text-[14px] font-semibold text-v-t1 mb-1.5">Architecture Zero-Knowledge</h3>
                <p className="text-[13px] text-v-t3 leading-relaxed">Aucune backdoor. Si vous perdez votre clé, vos données sont irrécupérables.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-5 text-[12px] font-medium text-v-t3 mt-auto pt-8">
          <span className="text-v-t3/60">2026 VEIL</span>
          <a href="#" className="hover:text-v-t1 transition-colors flex items-center gap-1.5">
            Documentation <ArrowUpRight size={12} />
          </a>
          <a href="#" className="hover:text-v-t1 transition-colors flex items-center gap-1.5">
            Audit de securite <ArrowUpRight size={12} />
          </a>
        </div>
      </aside>

      {/* ── RIGHT COLUMN — Auth Card (46%) ── */}
      <main className="relative z-10 w-full lg:w-[46%] flex items-center justify-center p-8 lg:p-16 xl:p-20 border-t lg:border-t-0 lg:border-l border-v-border/50 min-h-[560px] lg:min-h-screen bg-v-surface/20">
        <div className="w-full max-w-[440px]">
          <AuthForm />
        </div>
      </main>

    </div>
  );
}

export default App;
