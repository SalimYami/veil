import { useAuthStore } from './store/authStore';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { Logo } from './components/Logo';
import { Lock, ShieldCheck, Cpu, ArrowUpRight } from 'lucide-react';
import './App.css';

function App() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Dashboard />;

  return (
    <div className="min-h-screen bg-v-bg flex">

      {/* ── LEFT — Brand panel ── */}
      <aside className="hidden lg:flex lg:w-[55%] flex-col justify-between px-16 py-12 border-r border-v-border relative overflow-hidden">

        {/* Subtle gradient bg */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-v-accent opacity-[0.03] blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-v-accent opacity-[0.02] blur-[100px] rounded-full" />
        </div>

        {/* Top — Brand identity */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-v-accent/10 border border-v-accent/20 flex items-center justify-center text-v-accent">
            <Logo size={18} />
          </div>
          <span className="text-[15px] font-semibold tracking-[0.08em] text-v-t1">VEIL</span>
          <span className="text-[10px] font-medium text-v-accent bg-v-accent/10 px-2 py-0.5 rounded-full tracking-wide">v3.0</span>
        </div>

        {/* Center — Hero copy */}
        <div className="relative z-10 max-w-md -mt-8">

          <div className="flex items-center gap-2 mb-8">
            <div className="dot-live" />
            <span className="text-[11px] text-v-t2 font-medium">Infrastructure active</span>
          </div>

          <h1 className="text-[44px] font-bold leading-[1.1] tracking-[-0.02em] text-v-t1 mb-5">
            Stockage chiffré,
            <br />
            <span className="text-v-accent">zero-knowledge.</span>
          </h1>

          <p className="text-[15px] text-v-t2 leading-relaxed mb-12 max-w-sm">
            Vos fichiers sont chiffrés dans le navigateur avant tout envoi.
            Même nous ne pouvons pas les lire.
          </p>

          {/* Feature list — clean corporate */}
          <div className="space-y-4">
            {[
              { icon: <Lock size={14} />,        title: 'Chiffrement AES-256-GCM',  desc: 'Exécuté côté client. Le serveur stocke des blobs opaques.' },
              { icon: <Cpu size={14} />,          title: 'Dérivation Argon2id',      desc: 'Vos clés dérivent localement. Aucun secret ne transite.' },
              { icon: <ShieldCheck size={14} />,  title: 'Architecture trustless',    desc: 'L\'admin ne peut pas lire vos données. Garanti.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-3.5 group">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg border border-v-border bg-v-surface flex items-center justify-center text-v-t3 group-hover:text-v-accent group-hover:border-v-accent/30 transition-colors">
                  {f.icon}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-v-t1 mb-0.5">{f.title}</p>
                  <p className="text-[12px] text-v-t3 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — footer */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-v-t3">
          <span>© 2025 Veil Technologies</span>
          <a href="#" className="flex items-center gap-1 text-v-t3 hover:text-v-t2 transition-colors">
            Documentation <ArrowUpRight size={10} />
          </a>
        </div>
      </aside>

      {/* ── RIGHT — Auth form ── */}
      <main className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-[380px]">
          <AuthForm />
        </div>
      </main>
    </div>
  );
}

export default App;
