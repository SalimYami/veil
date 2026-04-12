import { useAuthStore } from './store/authStore';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { Logo } from './components/Logo';
import { Lock, Server, Shield } from 'lucide-react';

function App() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Dashboard />;

  return (
    <div className="h-screen bg-background flex flex-col lg:flex-row relative overflow-hidden text-foreground selection:bg-primary/20 cursor-default">
      
      {/* Background Layer */}
      <div className="absolute inset-0 grid-dots opacity-40 z-0" />
      <div className="halo top-[-15%] left-[-10%] w-[50%] h-[50%]" />
      <div className="halo bottom-[-10%] right-[-5%] w-[40%] h-[40%] opacity-05" />

      {/* Absolute Branding Block - Extreme Top Left */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-1.5 animate-in">
        <Logo size={24} className="translate-y-[-0.5px]" />
        <span className="text-xl font-black italic tracking-[0.1em] text-white/90 select-none leading-none">VEIL</span>
      </div>

      {/* Hero Section */}
      <aside className="relative z-10 w-full lg:w-[50%] xl:w-[55%] flex flex-col justify-center px-8 py-8 sm:px-12 sm:py-12 xl:px-20 xl:py-16">
        
        {/* Spacer for Absolute Global Branding */}
        <div className="h-20 mb-8" />

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center gap-8 max-w-xl">
          <div className="space-y-6 animate-in" style={{ animationDelay: '0.1s' }}>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-white leading-none">
              Sécurité Absolue.<br />
              Zéro Compromis.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground/80 font-medium leading-relaxed max-w-md">
              L'architecture zero-knowledge garantit que <span className="text-white">seul vous</span> possédez les clés de vos données. Aucun serveur, aucun tiers.
            </p>
          </div>

          {/* Secure Features */}
          <div className="grid grid-cols-1 gap-3 animate-in" style={{ animationDelay: '0.2s' }}>
            {[
              { icon: Lock, label: 'Chiffrement AES-256-GCM Local', sub: 'Calculé sur votre processeur' },
              { icon: Shield, label: 'Dérivation Argon2id', sub: 'Clés maîtresse non-extractibles' },
              { icon: Server, label: 'Trustless Infrastructure', sub: 'Serveurs aveugles par conception' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl glass hover:bg-white/[0.03] transition-all group border-white/[0.02]">
                <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <div>
                  <p className="text-[13px] font-semibold text-white/90">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="flex items-center justify-between text-[11px] text-muted-foreground/60 font-medium pt-8 border-t border-white/5 animate-in" style={{ animationDelay: '0.3s' }}>
          <span>© 2026 VEIL Core</span>
        </footer>
      </aside>

      {/* Auth Panel */}
      <main className="relative z-10 w-full lg:w-[50%] xl:w-[45%] flex items-center justify-center p-6 lg:border-l border-white/[0.05] bg-black/20 backdrop-blur-2xl">
        <div className="w-full max-w-[400px]">
          <AuthForm />
        </div>
      </main>
    </div>
  );
}

export default App;
