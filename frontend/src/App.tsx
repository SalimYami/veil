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
import { LockKeyhole, Cpu } from 'lucide-react';
import { Logo } from './components/Logo';
import './App.css';

function App() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-[#000] text-zinc-300 flex overflow-hidden selection:bg-white selection:text-black pb-30 lg:pb-0">
      
      {/* Left Panel - Visuals & Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-14 bg-[#050505] border-r border-white/5">
        <div className="relative z-10 flex items-center gap-3">
          <div className="text-white">
            <Logo size={28} />
          </div>
          <span className="font-sans font-semibold text-xl tracking-tight text-white">VEIL</span>
        </div>

        <div className="relative z-10 max-w-md mt-16">
          <h1 className="text-5xl font-semibold tracking-tight mb-6 text-white leading-[1.15]">
            Enterprise-grade <br /> 
            <span className="text-zinc-500">Zero-Knowledge</span> <br />
            Infrastructure.
          </h1>
          <p className="text-zinc-400 text-base mb-12 leading-relaxed font-normal">
            Le chiffrement de bout en bout exécuté intégralement dans votre navigateur. Conçu pour les professionnels exigeant une confidentialité absolue.
          </p>

          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-start gap-4">
              <div className="pt-0.5 text-zinc-500">
                <LockKeyhole size={18} />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm mb-1">Cryptographie Trustless</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">Mathématiquement impossible pour Veil de déchiffrer ou d'accéder à vos documents internes.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="pt-0.5 text-zinc-500">
                <Cpu size={18} />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm mb-1">Architecture Distribuée</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">Vos paquets chiffrés sont stockés en haute disponibilité via des data centers sécurisés.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[11px] text-zinc-600 font-mono tracking-widest uppercase w-full">
          <span>Enterprise Edition</span>
          <span>Build 2.1.0</span>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 lg:p-12 bg-[#000] relative">
        <div className="absolute inset-0 bg-mesh opacity-30"></div>
        <div className="w-full max-w-[400px] relative z-10">
          <AuthForm />
        </div>
      </div>

    </div>
  );
}

export default App;
