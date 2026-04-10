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
import { Logo } from './components/Logo';
import './App.css';

function App() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-vault-bg-primary text-vault-text-primary flex overflow-hidden selection:bg-white selection:text-black pb-30 lg:pb-0">
      
      {/* Left Panel - Visuals & Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-mesh border-r border-white/5">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border border-white/20 bg-black/50 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-md flex items-center justify-center">
            <Logo size={20} className="text-white" />
          </div>
          <span className="font-sans font-bold text-xl tracking-tight text-white">VEIL</span>
        </div>

        <div className="relative z-10 max-w-lg mt-20 animate-float">
          <h1 className="text-6xl font-bold tracking-tighter mb-6 text-white leading-[1.1]">
            The Ultra-Secure <br /> 
            <span className="text-vault-text-secondary">Zero-Knowledge</span> <br />
            Vault.
          </h1>
          <p className="text-vault-text-secondary text-lg mb-12 leading-relaxed font-light max-w-md">
            Une architecture de pointe où le chiffrement se fait dans votre navigateur. 
            Aucun compromis sur la vie privée.
          </p>

          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-start gap-5 transition-all group">
              <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-vault-text-secondary group-hover:text-white group-hover:border-white/30 transition-colors">
                <LockKeyhole size={20} />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Architecture Trustless</h3>
                <p className="text-sm text-vault-text-muted leading-relaxed">Mathématiquement impossible pour Veil de lire vos fichiers, même en cas de brèche critique.</p>
              </div>
            </div>
            <div className="flex items-start gap-5 transition-all group">
              <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-vault-text-secondary group-hover:text-white group-hover:border-white/30 transition-colors">
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Stockage Décentralisé</h3>
                <p className="text-sm text-vault-text-muted leading-relaxed">Vos paquets chiffrés sont stockés en sécurité via des protocoles hautement cryptographiques.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-vault-text-muted font-mono tracking-wider uppercase w-full max-w-lg">
          <span>Enterprise Grade</span>
          <span>v2.0.0</span>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-vault-bg-primary relative">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-zinc-950"></div>
        <div className="w-full max-w-md relative z-10">
          <AuthForm />
        </div>
      </div>

    </div>
  );
}

export default App;
