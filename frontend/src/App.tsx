import { useAuthStore } from './store/authStore';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { Logo } from './components/Logo';
import { Lock, Server, Shield } from 'lucide-react';

function App() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Dashboard />;

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row relative overflow-hidden text-foreground selection:bg-primary/20">
      
      {/* Halo Background Light */}
      <div className="halo-glow top-[-200px] left-[-200px]" />
      
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-40 z-0" />

      {/* Left Column - Hero */}
      <aside className="relative z-10 w-full lg:w-[55%] xl:w-[58%] flex flex-col justify-between px-8 py-10 sm:px-12 sm:py-16 xl:px-24 xl:py-24 max-w-5xl mx-auto">
        
        {/* Top: Logo */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-secondary to-card shadow-premium border border-white/5 flex items-center justify-center text-primary">
            <Logo size={24} />
          </div>
          <span className="text-xl font-medium tracking-widest text-foreground uppercase">VEIL</span>
        </div>

        {/* Center: Hero content */}
        <div className="flex-1 flex flex-col justify-center gap-10 mt-12 mb-12">
          
          {/* Badge */}
          <div className="flex items-center gap-2 w-fit">
            <span className="flex items-center gap-2.5 px-4 py-2 rounded-full glass text-[13px] font-semibold tracking-wide text-muted-foreground uppercase border-border/40">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-pulse" />
              Cryptographic Core Active
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-6 max-w-2xl">
            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-[1.05]">
              Privé par architecture.<br />
              Inaccessible par conception.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground font-medium max-w-xl leading-relaxed">
              Vos données. Vos clés. Notre aveuglement absolu. Aucun serveur ne peut décrypter votre coffre.
            </p>
          </div>

          {/* Trust Signals (Compact Stack) */}
          <div className="space-y-4 max-w-md pt-8">
            <div className="flex items-center gap-5 p-5 rounded-2xl glass hover:bg-card/60 transition-colors group">
              <Lock className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              <div>
                <p className="text-[15px] font-semibold text-foreground tracking-wide">Client-side AES-256-GCM</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">Données chiffrées avant réseau</p>
              </div>
            </div>

            <div className="flex items-center gap-5 p-5 rounded-2xl glass hover:bg-card/60 transition-colors group">
              <Shield className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              <div>
                <p className="text-[15px] font-semibold text-foreground tracking-wide">Local Argon2id Derivation</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">Vos secrets ne quittent jamais l'appareil</p>
              </div>
            </div>

            <div className="flex items-center gap-5 p-5 rounded-2xl glass hover:bg-card/60 transition-colors group">
              <Server className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              <div>
                <p className="text-[15px] font-semibold text-foreground tracking-wide">Zero-Knowledge Trust</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">Absence totale de contrôle serveur</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Footer */}
        <div className="flex items-center justify-between text-[13px] text-muted-foreground pt-10 border-t border-border/30">
          <span>© 2026 VEIL Security Systems.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
            <a href="#" className="hover:text-foreground transition-colors">Architecture</a>
          </div>
        </div>
      </aside>

      {/* Right Column - Auth */}
      <main className="relative z-10 w-full lg:w-[45%] xl:w-[42%] flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16 border-t lg:border-t-0 lg:border-l border-white/5 min-h-screen lg:min-h-screen bg-black/40 backdrop-blur-3xl">
        <div className="w-full max-w-[440px]">
          <AuthForm />
        </div>
      </main>
    </div>
  );
}

export default App;
