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
    <div className="min-h-screen bg-v-bg flex flex-col lg:flex-row relative">

      {/* ── BACKGROUND EFFECTS ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 auth-grid opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-v-accent opacity-[0.03] blur-[100px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-v-info opacity-[0.02] blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* ── LEFT — Brand panel (55%) ── */}
      <aside className="relative z-10 w-full lg:w-[55%] flex flex-col justify-between px-8 py-10 lg:px-24 lg:py-16">
        
        {/* Top: Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-v-elevated border border-v-border flex items-center justify-center text-v-accent premium-shadow">
            <Logo size={20} />
          </div>
          <span className="text-[17px] font-semibold tracking-wide text-v-t1">VEIL</span>
        </div>

        {/* Center: Hero & Features */}
        <div className="mt-16 lg:mt-0 max-w-[480px]">
          
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-2 h-7 px-3 rounded-full border border-v-success/20 bg-v-success/10">
              <div className="w-1.5 h-1.5 rounded-full bg-v-success shadow-[0_0_8px_rgba(5,150,105,0.8)]" />
              <span className="text-[10px] font-medium text-v-success uppercase tracking-widest">Trustless Node Active</span>
            </div>
          </div>

          <h1 className="text-[40px] lg:text-[52px] font-bold leading-[1.05] tracking-[-0.03em] text-v-t1 mb-6">
            L'intégrité de vos données, <br className="hidden lg:block" />
            <span className="text-v-accent">cryptographiquement prouvée.</span>
          </h1>

          <p className="text-[15px] lg:text-[16px] text-v-t2 leading-relaxed mb-12">
            La première plateforme de stockage où même les administrateurs ne peuvent pas accéder à vos fichiers. Le déchiffrement n'a lieu que sur votre appareil.
          </p>

          <div className="space-y-3">
            {[
              { icon: <ShieldCheck size={16} />, title: "Chiffrement Client AES-256-GCM", desc: "Le protocole de chiffrement s'exécute localement. Le serveur ne voit que du bruit." },
              { icon: <Cpu size={16} />, title: "Dérivation locale Argon2id", desc: "Vos clés maîtres sont générées à la volée sur votre matériel sans transfert réseau." },
              { icon: <Database size={16} />, title: "Stockage Zero-Knowledge", desc: "Absence totale de backdoor. Si vous perdez vos clés, les données sont inaccessibles." },
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-xl border border-v-border bg-v-surface/40 hover:bg-v-surface transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-v-elevated border border-v-border flex items-center justify-center text-v-t2">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-v-t1 mb-1">{feature.title}</h3>
                  <p className="text-[13px] text-v-t3 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom: Footer Links */}
        <div className="mt-16 lg:mt-0 flex items-center gap-6 text-[12px] font-medium text-v-t3">
          <span>© 2026 Veil Core OS</span>
          <a href="#" className="hover:text-v-t1 transition-colors flex items-center gap-1">
            Architecture Docs <ArrowUpRight size={12} />
          </a>
          <a href="#" className="hover:text-v-t1 transition-colors flex items-center gap-1">
            Audit de sécurité <ArrowUpRight size={12} />
          </a>
        </div>
      </aside>

      {/* ── RIGHT — Auth form (45%) ── */}
      <main className="relative z-10 w-full lg:w-[45%] flex items-center justify-center p-6 lg:p-16 border-t lg:border-t-0 lg:border-l border-v-border bg-v-surface/30 backdrop-blur-3xl min-h-[500px]">
        <div className="w-full max-w-[440px]">
          <AuthForm />
        </div>
      </main>

    </div>
  );
}

export default App;
