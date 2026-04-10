import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useFileStore } from '../store/fileStore';
import { FileUploader } from './FileUploader';
import { FileList } from './FileList';
import { AdminDashboard } from './AdminDashboard';
import { SearchBar } from './SearchBar';
import { ActivityFeed } from './ActivityFeed';
import { TagFilter } from './TagFilter';
import { Logo } from './Logo';
import {
  LogOut, KeyRound, Lock, Settings,
  PanelLeftClose, PanelLeftOpen, CheckCircle2,
  AlertCircle, Info, X, Upload, ShieldCheck
} from 'lucide-react';

export function Dashboard() {
  const { email, role, logout, promote, isLoading, error, clearError } = useAuthStore();
  const { toasts, removeToast, files, uploadQueue } = useFileStore();
  const [view, setView] = useState<'user' | 'admin'>('user');
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<'vault' | 'upload'>('vault');

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await promote(adminKey);
      setShowPromoteModal(false);
      setAdminKey('');
    } catch {
      // Error handled by store
    }
  };

  if (view === 'admin') {
    return <AdminDashboard onBack={() => setView('user')} />;
  }

  const toastConfig = (type: string) => {
    if (type === 'success') return { icon: <CheckCircle2 size={15} />, cls: 'text-v-success', bar: 'bg-v-success' };
    if (type === 'error') return { icon: <AlertCircle size={15} />, cls: 'text-v-danger', bar: 'bg-v-danger' };
    return { icon: <Info size={15} />, cls: 'text-v-accent-2', bar: 'bg-v-accent' };
  };

  return (
    <div className="min-h-screen bg-v-bg text-v-t1 flex flex-col font-['Inter'] selection:bg-[rgba(99,102,241,0.3)] selection:text-white">
      {/* Ambient bg */}
      <div className="fixed inset-0 dot-grid opacity-100 pointer-events-none z-0" />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-v-accent opacity-[0.025] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-[#c084fc] opacity-[0.025] blur-[100px] rounded-full" />
      </div>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 h-[60px] flex items-center px-4 lg:px-6 gap-4 glass-heavy border-b border-[rgba(255,255,255,0.06)]">
        {/* Left: Sidebar toggle + Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 rounded-lg border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.14)] text-v-t3 hover:text-v-t2 flex items-center justify-center transition-all duration-200 cursor-pointer"
            title={sidebarOpen ? 'Réduire le panneau' : 'Ouvrir le panneau'}
          >
            {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg glass flex items-center justify-center">
              <Logo size={16} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-widest text-white">VEIL</span>
              <span className="text-[9px] font-mono text-v-accent bg-v-accent/10 border border-v-accent/25 px-1.5 py-0.5 rounded-md tracking-widest uppercase">OS</span>
            </div>
          </div>

          {/* Admin badge */}
          {role === 'admin' ? (
            <button
              onClick={() => setView('admin')}
              className="ml-1 flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-v-warn bg-v-warn/10 border border-v-warn/25 rounded-lg hover:bg-v-warn/20 transition-all cursor-pointer"
            >
              <Settings size={12} />
              Admin
            </button>
          ) : (
            <button
              onClick={() => setShowPromoteModal(true)}
              className="ml-1 w-7 h-7 rounded-lg text-v-t3 hover:text-v-t2 hover:bg-white/5 flex items-center justify-center transition-all cursor-pointer"
              title="Activer le mode Admin"
            >
              <Lock size={13} />
            </button>
          )}
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-auto">
          <SearchBar />
        </div>

        {/* Right: User + Logout */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* ZK status pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-v-success/20 bg-v-success/5">
            <div className="status-online" />
            <span className="text-[10px] font-mono text-v-success uppercase tracking-widest">ZK Active</span>
          </div>

          {/* User email */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)]">
            <KeyRound size={12} className="text-v-t3 flex-shrink-0" />
            <span className="font-mono text-xs text-v-t1 max-w-[140px] truncate">{email}</span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] hover:border-v-danger/30 hover:bg-v-danger/5 hover:text-v-danger text-v-t3 text-xs font-medium transition-all duration-200 cursor-pointer group"
          >
            <LogOut size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Verrouiller</span>
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden relative z-10">

        {/* Sidebar */}
        <aside className={`flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden
          ${sidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'}`}
        >
          <div className={`h-full flex flex-col gap-0 border-r border-[rgba(255,255,255,0.06)] bg-[rgba(4,4,16,0.5)] transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-4'}`}>

            {/* Sidebar: Storage stats */}
            <div className="p-4 border-b border-[rgba(255,255,255,0.05)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-v-t3 uppercase tracking-widest">Coffre-fort</span>
                <span className="text-[10px] font-mono text-v-accent">{files?.length ?? 0} fichiers</span>
              </div>
              {/* Encryption status */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-v-success/15 bg-v-success/5">
                <ShieldCheck size={13} className="text-v-success flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-v-success uppercase tracking-wider leading-none">Chiffrement Actif</p>
                  <p className="text-[9px] text-v-t3 font-mono mt-0.5">AES-256-GCM · ZK</p>
                </div>
              </div>
            </div>

            {/* Sidebar: Navigation */}
            <div className="p-3 border-b border-[rgba(255,255,255,0.05)]">
              <p className="text-[9px] font-mono text-v-t3 uppercase tracking-widest px-2 mb-2">Navigation</p>
              {[
                { id: 'vault', label: 'Mon Coffre', icon: <Lock size={14} />, count: files?.length },
                { id: 'upload', label: 'Upload Sécurisé', icon: <Upload size={14} />, count: uploadQueue.length > 0 ? uploadQueue.length : undefined },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as 'vault' | 'upload')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer mb-1
                    ${activeSection === item.id
                      ? 'bg-v-accent/15 text-v-accent-2 border border-v-accent/20'
                      : 'text-v-t2 hover:bg-white/5 border border-transparent'
                    }`}
                >
                  <span className={activeSection === item.id ? 'text-v-accent' : 'text-v-t3'}>{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${activeSection === item.id ? 'bg-v-accent/20 text-v-accent' : 'bg-white/8 text-v-t3'}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Sidebar: Tags */}
            <div className="p-3 border-b border-[rgba(255,255,255,0.05)]">
              <p className="text-[9px] font-mono text-v-t3 uppercase tracking-widest px-2 mb-3">Filtres</p>
              <TagFilter />
            </div>

            {/* Sidebar: Activity */}
            <div className="flex-1 overflow-hidden flex flex-col p-3 min-h-0">
              <p className="text-[9px] font-mono text-v-t3 uppercase tracking-widest px-2 mb-3">Activité</p>
              <div className="flex-1 overflow-y-auto custom-scroll min-h-0">
                <ActivityFeed />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto custom-scroll p-5 lg:p-6 flex flex-col gap-5">

          {/* Section: Upload */}
          {activeSection === 'upload' && (
            <section className="animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-v-accent inline-block" />
                    Upload Sécurisé
                    <span className="ml-1 text-[10px] font-mono text-v-accent bg-v-accent/10 border border-v-accent/20 px-2 py-0.5 rounded-md">AES-256-GCM</span>
                  </h2>
                  <p className="text-v-t3 text-xs mt-0.5 ml-3">Chiffrement local avant transmission réseau</p>
                </div>
                <button
                  onClick={() => setActiveSection('vault')}
                  className="text-xs text-v-t3 hover:text-v-t2 transition-colors cursor-pointer"
                >
                  ← Retour au coffre
                </button>
              </div>
              <div className="glass rounded-2xl p-5">
                <FileUploader />
              </div>
            </section>
          )}

          {/* Section: Vault */}
          {activeSection === 'vault' && (
            <section className="flex-1 flex flex-col min-h-0 animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-v-t3 inline-block" />
                    Mon Coffre-fort
                  </h2>
                  <p className="text-v-t3 text-xs mt-0.5 ml-3">Documents chiffrés et distribués</p>
                </div>
                <button
                  onClick={() => setActiveSection('upload')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-v-accent text-white rounded-lg hover:bg-v-accent-2 shadow-[0_2px_12px_rgba(99,102,241,0.3)] transition-all cursor-pointer"
                >
                  <Upload size={12} />
                  Upload
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <FileList />
              </div>
            </section>
          )}
        </main>
      </div>

      {/* ── TOASTS ── */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const cfg = toastConfig(toast.type);
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center gap-3 min-w-[300px] max-w-sm px-4 py-3 glass-heavy rounded-2xl shadow-2xl animate-slide-right"
            >
              <span className={`flex-shrink-0 ${cfg.cls}`}>{cfg.icon}</span>
              <span className="flex-1 text-sm font-medium text-v-t1 leading-snug">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-1 rounded-lg text-v-t3 hover:text-v-t1 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
              {/* Color bar */}
              <div className={`absolute bottom-0 left-0 h-0.5 w-full rounded-b-2xl ${cfg.bar} opacity-40`} />
            </div>
          );
        })}
      </div>

      {/* ── PROMOTE MODAL ── */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-heavy rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <h3 className="font-semibold text-base flex items-center gap-2 text-white">
                <Settings size={16} className="text-v-warn" />
                Élévation de privilèges
              </h3>
              <button
                onClick={() => { setShowPromoteModal(false); clearError(); }}
                className="p-1.5 rounded-lg text-v-t3 hover:text-v-t1 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handlePromote} className="p-6 flex flex-col gap-4">
              <p className="text-v-t2 text-sm">
                Entrez la clé de sécurité pour activer les fonctions d'administration système.
              </p>
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all bg-[rgba(8,8,20,0.8)]
                focus-within:border-v-warn/50 focus-within:shadow-[0_0_0_2px_rgba(245,158,11,0.15)] border-[rgba(255,255,255,0.07)]`}
              >
                <KeyRound size={15} className="text-v-t3 flex-shrink-0" />
                <input
                  type="password"
                  placeholder="Clé de sécurité admin"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  autoFocus
                  required
                  className="flex-1 bg-transparent border-none outline-none text-v-t1 text-sm placeholder-v-t3"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-v-danger text-sm">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowPromoteModal(false); clearError(); }}
                  className="px-4 py-2 text-sm text-v-t2 hover:text-v-t1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-semibold bg-v-warn/15 text-v-warn border border-v-warn/30 hover:bg-v-warn/25 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? 'Vérification...' : 'Activer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
