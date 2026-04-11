import { useAuthStore } from './store/authStore';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { Logo } from './components/Logo';
import { Lock, Server, Key } from 'lucide-react';

function App() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Dashboard />;

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-30 z-0" />

      {/* Left column - Hero */}
      <aside className="relative z-10 w-full lg:w-1/2 flex flex-col justify-between px-6 py-8 sm:px-10 sm:py-12 lg:px-16 lg:py-20">
        
        {/* Top: Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary border border-border/50 flex items-center justify-center text-primary">
            <Logo size={22} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">VEIL</span>
        </div>

        {/* Center: Hero content */}
        <div className="flex-1 flex flex-col justify-center gap-8">
          
          {/* Badge */}
          <div className="flex items-center gap-2 w-fit">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/40 border border-border/30 text-xs font-medium text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
              Secure by Design
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-4 max-w-lg">
            <h1 className="text-5xl sm:text-6xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
              Confidentialité par architecture.
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Les clés restent privées. Aucun serveur ne peut accéder à vos données.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 max-w-xl pt-4">
            <div className="flex gap-4 p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors">
              <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">AES-256-GCM</p>
                <p className="text-xs text-muted-foreground">Military-grade encryption on client-side</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors">
              <Key className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Argon2id</p>
                <p className="text-xs text-muted-foreground">Key derivation happens locally, never transmitted</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors">
              <Server className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Zero-Knowledge</p>
                <p className="text-xs text-muted-foreground">No backdoors. Lost password = lost data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Footer */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-8 border-t border-border/30">
          <span>© 2026 VEIL</span>
          <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
          <a href="#" className="hover:text-foreground transition-colors">Security Audit</a>
        </div>
      </aside>

      {/* Right column - Auth */}
      <main className="relative z-10 w-full lg:w-1/2 flex items-center justify-center px-6 py-8 sm:px-10 sm:py-12 lg:px-16 lg:py-20 border-t lg:border-t-0 lg:border-l border-border/30 min-h-screen lg:min-h-screen bg-card/30">
        <div className="w-full max-w-sm">
          <AuthForm />
        </div>
      </main>
    </div>
  );
}

export default App;
