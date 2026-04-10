/**
 * =============================================================================
 * VEIL - Application Principale
 * =============================================================================
 * 
 * Point d'entrée de l'application React.
 * Gère le routage entre AuthForm (non connecté) et Dashboard (connecté).
 * 
 * =============================================================================
 */

import { useAuthStore } from './store/authStore';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { Shield, LockKeyhole, Cpu } from 'lucide-react';
import './App.css';

function App() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-vault-bg-primary text-vault-text-primary flex overflow-hidden selection:bg-vault-primary selection:text-white pb-30 lg:pb-0">
      
      {/* Left Panel - Visuals & Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-mesh border-r border-white/5">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-vault-primary to-vault-secondary p-[1px] shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <div className="w-full h-full bg-vault-bg-secondary rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
          <span className="font-sans font-bold text-xl tracking-tight text-white">VEIL</span>
        </div>

        <div className="relative z-10 max-w-lg mt-20 animate-float">
          <h1 className="text-5xl font-bold tracking-tighter mb-6 bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent leading-tight">
            Le coffre-fort <br /> 
            <span className="text-glow text-vault-primary">Zero-Knowledge</span>.
          </h1>
          <p className="text-vault-text-secondary text-lg mb-10 leading-relaxed font-light">
            Une architecture de pointe où le chiffrement se fait dans votre navigateur. 
            Le serveur ne reçoit jamais vos clés ni vos données en clair.
          </p>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-glass-heavy p-4 rounded-2xl flex items-start gap-4 transition-all hover:bg-white/5 cursor-default">
              <div className="bg-vault-primary/10 p-3 rounded-lg text-vault-primary mt-1 border border-vault-primary/20">
                <LockKeyhole size={20} />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Architecture Trustless</h3>
                <p className="text-sm text-vault-text-muted">Mathématiquement impossible pour Veil de lire vos fichiers, même en cas de brèche.</p>
              </div>
            </div>
            <div className="bg-glass-heavy p-4 rounded-2xl flex items-start gap-4 transition-all hover:bg-white/5 cursor-default">
              <div className="bg-vault-primary/10 p-3 rounded-lg text-vault-primary mt-1 border border-vault-primary/20">
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Stockage Décentralisé S3</h3>
                <p className="text-sm text-vault-text-muted">Vos paquets chiffrés sont stockés en sécurité via des protocoles hautement disponibles.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-vault-text-muted font-mono tracking-wider uppercase">
          Système Sécurisé • v1.0.0
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-vault-bg-primary relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-vault-primary/5 via-vault-bg-primary to-vault-bg-primary"></div>
        <div className="w-full max-w-md relative z-10">
          <AuthForm />
        </div>
      </div>

    </div>
  );
}

export default App;
