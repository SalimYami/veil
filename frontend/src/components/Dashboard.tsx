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
  CheckCircle2, AlertCircle, Info, X,
  Upload, ShieldCheck, FolderLock, Activity,
  Tag, LayoutGrid, ChevronRight
} from 'lucide-react';

const NAV = [
  { id: 'vault',    icon: <FolderLock size={18} />, label: 'Mon Coffre',    shortLabel: 'Coffre' },
  { id: 'upload',   icon: <Upload size={18} />,     label: 'Upload',        shortLabel: 'Upload' },
  { id: 'activity', icon: <Activity size={18} />,   label: 'Activité',      shortLabel: 'Log' },
  { id: 'tags',     icon: <Tag size={18} />,         label: 'Tags & Filtres',shortLabel: 'Tags' },
];

export function Dashboard() {
  const { email, role, logout, promote, isLoading, error, clearError } = useAuthStore();
  const { toasts, removeToast, files, uploadQueue } = useFileStore();
  const [view, setView] = useState<'user' | 'admin'>('user');
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [activeSection, setActiveSection] = useState<string>('vault');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await promote(adminKey); setShowPromoteModal(false); setAdminKey(''); }
    catch { /* handled */ }
  };

  if (view === 'admin') return <AdminDashboard onBack={() => setView('user')} />;

  const toastCfg = (type: string) => {
    if (type === 'success') return { icon: <CheckCircle2 size={14} />, cls: 'text-v-success', br: 'from-v-success/30' };
    if (type === 'error')   return { icon: <AlertCircle size={14} />,  cls: 'text-v-danger',  br: 'from-v-danger/30' };
    return { icon: <Info size={14} />, cls: 'text-v-accent-3', br: 'from-v-accent/30' };
  };

  const activeNav = NAV.find(n => n.id === activeSection);

  return (
    <div className="fixed inset-0 bg-v-bg text-v-t1 flex flex-col font-['Inter']">
      {/* Global bg */}
      <div className="absolute inset-0 grid-lines opacity-100 pointer-events-none z-0" />
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[250px] bg-v-accent opacity-[0.035] blur-[100px] rounded-full" />
      </div>

      {/* ── TOPBAR ── */}
      <header className="relative z-50 flex-shrink-0 h-[56px] flex items-center px-4 gap-3 glass-heavy border-b border-[rgba(255,255,255,0.05)]">

        {/* Brand pill */}
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="flex items-center gap-2.5 px-3 h-9 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group flex-shrink-0"
        >
          <div className="w-6 h-6 rounded-lg glass flex items-center justify-center flex-shrink-0">
            <Logo size={14} />
          </div>
          <span className="font-bold text-[13px] tracking-[0.12em] text-white hidden sm:block">VEIL</span>
          <span className="text-[8px] font-mono text-v-accent bg-v-accent/10 border border-v-accent/20 px-1.5 py-0.5 rounded tracking-widest hidden sm:block">OS</span>
          <LayoutGrid size={13} className="text-v-t3 group-hover:text-v-t2 transition-colors ml-1" />
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-[rgba(255,255,255,0.06)] flex-shrink-0" />

        {/* Breadcrumb */}
        <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-v-t3 flex-shrink-0">
          <span>Coffre-fort</span>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-v-t2 font-medium">{activeNav?.label || 'Mon Coffre'}</span>
        </div>

        {/* Search — center */}
        <div className="flex-1 max-w-sm mx-auto">
          <SearchBar />
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* ZK pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-v-success/20 bg-v-success/5">
            <div className="status-online" />
            <span className="text-[9px] font-mono text-v-success tracking-widest uppercase">ZK Actif</span>
          </div>

          {/* Admin / promote */}
          {role === 'admin' ? (
            <button
              onClick={() => setView('admin')}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-semibold text-v-warn bg-v-warn/10 border border-v-warn/20 rounded-xl hover:bg-v-warn/20 transition-all cursor-pointer"
            >
              <Settings size={13} />
              Admin
            </button>
          ) : (
            <button
              onClick={() => setShowPromoteModal(true)}
              className="w-8 h-8 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] hover:bg-white/8 text-v-t3 hover:text-v-t2 flex items-center justify-center transition-all cursor-pointer"
              title="Activer le mode Admin"
            >
              <Lock size={13} />
            </button>
          )}

          {/* Email */}
          <div className="hidden md:flex items-center gap-2 h-8 px-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)]">
            <KeyRound size={11} className="text-v-t3" />
            <span className="text-[11px] font-mono text-v-t2 max-w-[120px] truncate">{email}</span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Verrouiller la session"
            className="w-8 h-8 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] hover:border-v-danger/30 hover:bg-v-danger/8 hover:text-v-danger text-v-t3 flex items-center justify-center transition-all cursor-pointer group"
          >
            <LogOut size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 min-h-0 relative z-10">

        {/* ── LEFT SIDEBAR ── */}
        <aside className={`flex-shrink-0 flex flex-col border-r border-[rgba(255,255,255,0.05)] bg-[rgba(3,3,10,0.5)] transition-all duration-300 ease-in-out
          ${sidebarExpanded ? 'w-56' : 'w-14'} overflow-hidden`}
        >
          {/* Navigation */}
          <nav className="flex flex-col gap-1 p-2 pt-3">
            {NAV.map((item) => {
              const active = activeSection === item.id;
              const hasCount = item.id === 'upload' && uploadQueue.length > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`relative flex items-center gap-3 h-10 rounded-xl transition-all duration-150 cursor-pointer overflow-hidden
                    ${sidebarExpanded ? 'px-3' : 'justify-center px-0'}
                    ${active
                      ? 'bg-v-accent/15 text-v-accent-3 border border-v-accent/20'
                      : 'text-v-t3 hover:bg-white/5 hover:text-v-t2 border border-transparent'
                    }`}
                >
                  {/* Active indicator */}
                  {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-v-accent rounded-r-full" />}

                  <span className={`flex-shrink-0 ${active ? 'text-v-accent' : ''}`}>{item.icon}</span>

                  {sidebarExpanded && (
                    <span className="text-[13px] font-medium flex-1 text-left truncate">{item.label}</span>
                  )}

                  {sidebarExpanded && hasCount && uploadQueue.length > 0 && (
                    <span className="text-[9px] font-mono bg-v-accent text-white px-1.5 py-0.5 rounded-md">{uploadQueue.length}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="mx-3 h-px bg-[rgba(255,255,255,0.04)] my-2" />

          {/* Vault stats + ZK status */}
          {sidebarExpanded && (
            <div className="px-3 pb-3 animate-fade-in">
              <div className="p-3 rounded-xl border border-v-success/15 bg-v-success/5">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={13} className="text-v-success" />
                  <span className="text-[10px] font-mono text-v-success uppercase tracking-widest">Coffre actif</span>
                </div>
                <p className="text-[11px] text-v-t3 leading-snug">
                  <span className="text-white font-semibold">{files?.length ?? 0}</span> fichier{(files?.length ?? 0) > 1 ? 's' : ''} chiffré{(files?.length ?? 0) > 1 ? 's' : ''}
                </p>
                <p className="text-[9px] text-v-t3 font-mono mt-0.5">AES-256-GCM · ZK</p>
              </div>
            </div>
          )}

          {/* Bottom spacer to push footer down */}
          <div className="flex-1" />

          {/* Collapse toggle at bottom */}
          <div className="p-2 border-t border-[rgba(255,255,255,0.04)]">
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className={`w-full h-8 rounded-xl text-v-t3 hover:text-v-t2 hover:bg-white/5 transition-all cursor-pointer flex items-center gap-2
                ${sidebarExpanded ? 'px-3' : 'justify-center'}`}
            >
              <LayoutGrid size={13} />
              {sidebarExpanded && <span className="text-[11px]">Réduire</span>}
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Content header bar */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                ${activeSection === 'vault'    ? 'bg-v-accent/10 text-v-accent border border-v-accent/20' :
                  activeSection === 'upload'   ? 'bg-v-success/10 text-v-success border border-v-success/20' :
                  activeSection === 'activity' ? 'bg-v-info/10 text-v-info border border-v-info/20' :
                                                 'bg-v-warn/10 text-v-warn border border-v-warn/20'}`}
              >
                {activeNav?.icon}
              </div>
              <div>
                <h1 className="text-[15px] font-bold text-white leading-none">{activeNav?.label}</h1>
                <p className="text-[11px] text-v-t3 mt-0.5">
                  {activeSection === 'vault'    && 'Fichiers chiffrés dans votre coffre-fort'}
                  {activeSection === 'upload'   && 'Chiffrement local avant transmission réseau'}
                  {activeSection === 'activity' && 'Historique des opérations cryptographiques'}
                  {activeSection === 'tags'     && 'Organisation et filtrage des fichiers'}
                </p>
              </div>
            </div>

            {/* Contextual actions */}
            {activeSection === 'vault' && (
              <button
                onClick={() => setActiveSection('upload')}
                className="flex items-center gap-2 h-9 px-4 text-[13px] font-semibold bg-v-accent hover:bg-[#5557d9] text-white rounded-xl transition-all cursor-pointer"
                style={{ boxShadow: '0 2px 16px rgba(99,102,241,0.35)' }}
              >
                <Upload size={14} />
                Upload
              </button>
            )}
            {activeSection === 'upload' && (
              <button
                onClick={() => setActiveSection('vault')}
                className="flex items-center gap-2 h-9 px-4 text-[13px] text-v-t2 hover:text-v-t1 hover:bg-white/5 rounded-xl transition-all cursor-pointer border border-[rgba(255,255,255,0.07)]"
              >
                ← Retour au coffre
              </button>
            )}
          </div>

          {/* Scrollable content zone */}
          <div className="flex-1 overflow-y-auto custom-scroll">
            {activeSection === 'vault' && (
              <div className="p-6 animate-fade-up">
                <FileList />
              </div>
            )}
            {activeSection === 'upload' && (
              <div className="p-6 animate-fade-up">
                <div className="max-w-2xl glass rounded-2xl p-6">
                  <FileUploader />
                </div>
              </div>
            )}
            {activeSection === 'activity' && (
              <div className="p-6 animate-fade-up">
                <div className="max-w-2xl glass rounded-2xl p-5">
                  <ActivityFeed />
                </div>
              </div>
            )}
            {activeSection === 'tags' && (
              <div className="p-6 animate-fade-up">
                <div className="max-w-lg glass rounded-2xl p-5">
                  <p className="text-[11px] font-mono text-v-t3 uppercase tracking-widest mb-4">Tags disponibles</p>
                  <TagFilter />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── TOASTS ── */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => {
          const cfg = toastCfg(t.type);
          return (
            <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-4 py-3 glass-heavy rounded-2xl shadow-2xl animate-slide-right relative overflow-hidden">
              {/* Glow left border */}
              <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-gradient-to-b ${cfg.br} to-transparent`} />
              <span className={`flex-shrink-0 ${cfg.cls}`}>{cfg.icon}</span>
              <span className="flex-1 text-[13px] font-medium text-v-t1 leading-snug">{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="flex-shrink-0 p-1 rounded-lg text-v-t3 hover:text-v-t1 hover:bg-white/10 cursor-pointer transition-colors">
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── PROMOTE MODAL ── */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-xl p-4 animate-fade-in">
          <div className="glass-heavy rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h3 className="font-bold text-[15px] text-white flex items-center gap-2">
                <Settings size={16} className="text-v-warn" />
                Élévation de privilèges
              </h3>
            </div>
            <form onSubmit={handlePromote} className="p-6 flex flex-col gap-4">
              <p className="text-v-t2 text-[13px] leading-relaxed">
                Entrez la clé de sécurité pour activer les fonctions d'administration.
              </p>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(8,8,20,0.9)] focus-within:border-v-warn/40 transition-all">
                <KeyRound size={14} className="text-v-t3" />
                <input
                  type="password"
                  placeholder="Clé d'administration"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  autoFocus required
                  className="flex-1 bg-transparent border-none outline-none text-v-t1 text-[13px] placeholder-v-t3"
                />
              </div>
              {error && <p className="text-v-danger text-[12px] flex items-center gap-2"><AlertCircle size={13}/>{error}</p>}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => { setShowPromoteModal(false); clearError(); }}
                  className="px-4 py-2 text-[13px] text-v-t2 hover:text-v-t1 hover:bg-white/5 rounded-xl transition-colors cursor-pointer">
                  Annuler
                </button>
                <button type="submit" disabled={isLoading}
                  className="px-4 py-2 text-[13px] font-semibold bg-v-warn/15 text-v-warn border border-v-warn/25 hover:bg-v-warn/25 rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
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
