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
  Tag, ChevronRight, Plus
} from 'lucide-react';

type Section = 'vault' | 'upload' | 'activity' | 'tags';

const NAV: { id: Section; icon: React.ReactNode; label: string }[] = [
  { id: 'vault',    icon: <FolderLock size={16} />, label: 'Coffre-fort' },
  { id: 'upload',   icon: <Upload size={16} />,     label: 'Upload' },
  { id: 'activity', icon: <Activity size={16} />,   label: 'Activité' },
  { id: 'tags',     icon: <Tag size={16} />,         label: 'Tags' },
];

export function Dashboard() {
  const { email, role, logout, promote, isLoading, error, clearError } = useAuthStore();
  const { toasts, removeToast, files, uploadQueue } = useFileStore();
  const [view, setView] = useState<'user' | 'admin'>('user');
  const [showPromote, setShowPromote] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [section, setSection] = useState<Section>('vault');

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await promote(adminKey); setShowPromote(false); setAdminKey(''); }
    catch { /* store */ }
  };

  if (view === 'admin') return <AdminDashboard onBack={() => setView('user')} />;

  const toastStyle = (t: string) => {
    if (t === 'success') return { icon: <CheckCircle2 size={14} />, color: 'text-v-success' };
    if (t === 'error')   return { icon: <AlertCircle size={14} />,  color: 'text-v-danger' };
    return { icon: <Info size={14} />, color: 'text-v-info' };
  };

  const sectionMeta: Record<Section, { title: string; desc: string }> = {
    vault:    { title: 'Coffre-fort',     desc: 'Vos fichiers chiffrés' },
    upload:   { title: 'Upload sécurisé', desc: 'Chiffrement local avant envoi' },
    activity: { title: 'Journal',         desc: 'Historique des opérations' },
    tags:     { title: 'Tags',            desc: 'Filtrage et organisation' },
  };

  const meta = sectionMeta[section];

  return (
    <div className="fixed inset-0 bg-v-bg text-v-t1 flex flex-col font-['Inter']">

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 h-[52px] flex items-center px-4 gap-3 border-b border-v-border bg-v-bg z-50">

        {/* Brand */}
        <div className="flex items-center gap-2.5 pr-3 border-r border-v-border mr-1">
          <div className="w-7 h-7 rounded-md bg-v-accent/10 border border-v-accent/20 flex items-center justify-center text-v-accent">
            <Logo size={15} />
          </div>
          <span className="text-[13px] font-semibold tracking-[0.06em] text-v-t1 hidden sm:block">VEIL</span>
        </div>

        {/* Breadcrumb */}
        <div className="hidden sm:flex items-center gap-1 text-[12px] text-v-t3">
          <span className="hover:text-v-t2 cursor-pointer transition-colors" onClick={() => setSection('vault')}>Espace</span>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-v-t2 font-medium">{meta.title}</span>
        </div>

        {/* Center — Search */}
        <div className="flex-1 max-w-xs mx-auto px-2">
          <SearchBar />
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">

          {/* ZK status */}
          <div className="hidden lg:flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-v-success/20 bg-v-success/[0.06]">
            <div className="dot-live" />
            <span className="text-[10px] font-medium text-v-success">Chiffré</span>
          </div>

          {/* Admin */}
          {role === 'admin' ? (
            <button onClick={() => setView('admin')}
              className="h-7 px-2.5 rounded-md text-[11px] font-medium text-v-warn bg-v-warn/10 border border-v-warn/20 hover:bg-v-warn/15 transition-colors cursor-pointer flex items-center gap-1.5">
              <Settings size={12} /> Admin
            </button>
          ) : (
            <button onClick={() => setShowPromote(true)}
              className="w-7 h-7 rounded-md border border-v-border bg-v-surface text-v-t3 hover:text-v-t2 hover:border-v-border-l flex items-center justify-center transition-colors cursor-pointer"
              title="Mode admin">
              <Lock size={12} />
            </button>
          )}

          {/* User pill */}
          <div className="hidden md:flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-v-border bg-v-surface">
            <KeyRound size={11} className="text-v-t3" />
            <span className="text-[11px] font-mono text-v-t2 max-w-[100px] truncate">{email}</span>
          </div>

          {/* Logout */}
          <button onClick={logout} title="Déconnexion"
            className="w-7 h-7 rounded-md border border-v-border bg-v-surface text-v-t3 hover:text-v-danger hover:border-v-danger/30 flex items-center justify-center transition-colors cursor-pointer">
            <LogOut size={12} />
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── SIDEBAR ── */}
        <aside className="flex-shrink-0 w-[200px] border-r border-v-border bg-v-bg flex flex-col">

          {/* Nav */}
          <nav className="flex flex-col gap-0.5 p-2 pt-3">
            {NAV.map((n) => {
              const active = section === n.id;
              const badge = n.id === 'upload' && uploadQueue.length > 0 ? uploadQueue.length : null;
              return (
                <button
                  key={n.id}
                  onClick={() => setSection(n.id)}
                  className={`flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer
                    ${active
                      ? 'bg-v-accent/10 text-v-accent'
                      : 'text-v-t3 hover:text-v-t2 hover:bg-v-surface'}`}
                >
                  <span className={active ? 'text-v-accent' : ''}>{n.icon}</span>
                  <span className="flex-1 text-left">{n.label}</span>
                  {badge && (
                    <span className="text-[9px] font-mono bg-v-accent text-white w-4 h-4 rounded flex items-center justify-center">{badge}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mx-3 h-px bg-v-border my-2" />

          {/* Stats */}
          <div className="px-3">
            <div className="p-3 rounded-lg border border-v-border bg-v-surface">
              <div className="flex items-center gap-1.5 mb-2">
                <ShieldCheck size={12} className="text-v-success" />
                <span className="text-[10px] font-medium text-v-success">Coffre actif</span>
              </div>
              <p className="text-[20px] font-semibold text-v-t1 leading-none">{files?.length ?? 0}</p>
              <p className="text-[10px] text-v-t3 mt-0.5">fichiers chiffrés</p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Bottom */}
          <div className="p-3 border-t border-v-border">
            <p className="text-[10px] text-v-t3 leading-relaxed">
              AES-256-GCM · Argon2id<br/>Zero-Knowledge Architecture
            </p>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 flex flex-col bg-v-bg">

          {/* Section header */}
          <div className="flex-shrink-0 flex items-center justify-between h-12 px-6 border-b border-v-border">
            <div className="flex items-center gap-2">
              <h1 className="text-[14px] font-semibold text-v-t1">{meta.title}</h1>
              <span className="text-[11px] text-v-t3">— {meta.desc}</span>
            </div>
            {section === 'vault' && (
              <button onClick={() => setSection('upload')}
                className="flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-medium bg-v-accent hover:bg-v-accent-h text-white transition-colors cursor-pointer">
                <Plus size={13} /> Upload
              </button>
            )}
          </div>

          {/* Scroll container */}
          <div className="flex-1 overflow-y-auto scroll-thin">
            <div className="p-6">
              {section === 'vault'    && <FileList />}
              {section === 'upload'   && <div className="max-w-xl"><FileUploader /></div>}
              {section === 'activity' && <div className="max-w-xl"><ActivityFeed /></div>}
              {section === 'tags'     && <div className="max-w-sm"><TagFilter /></div>}
            </div>
          </div>
        </main>
      </div>

      {/* ── TOASTS ── */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none w-80">
        {toasts.map((t) => {
          const s = toastStyle(t.type);
          return (
            <div key={t.id} className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 surface-overlay rounded-lg shadow-xl anim-slide-r">
              <span className={s.color}>{s.icon}</span>
              <span className="flex-1 text-[13px] text-v-t1">{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="text-v-t3 hover:text-v-t1 cursor-pointer transition-colors"><X size={13} /></button>
            </div>
          );
        })}
      </div>

      {/* ── PROMOTE MODAL ── */}
      {showPromote && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 anim-in">
          <div className="surface-overlay rounded-xl w-full max-w-sm shadow-2xl anim-scale">
            <div className="px-5 py-4 border-b border-v-border flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-v-t1 flex items-center gap-2">
                <Settings size={15} className="text-v-warn" /> Élévation admin
              </h3>
              <button onClick={() => { setShowPromote(false); clearError(); }}
                className="text-v-t3 hover:text-v-t1 cursor-pointer transition-colors"><X size={15} /></button>
            </div>
            <form onSubmit={handlePromote} className="p-5 space-y-4">
              <p className="text-[13px] text-v-t2">Entrez la clé d'administration pour activer le mode admin.</p>
              <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-v-border bg-v-surface focus-within:border-v-warn/50 transition-colors">
                <KeyRound size={13} className="text-v-t3" />
                <input type="password" placeholder="Clé admin" value={adminKey} onChange={e => setAdminKey(e.target.value)}
                  autoFocus required className="flex-1 bg-transparent border-none outline-none text-[13px] text-v-t1 placeholder-v-t3" />
              </div>
              {error && <p className="text-[12px] text-v-danger flex items-center gap-1.5"><AlertCircle size={12}/>{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => { setShowPromote(false); clearError(); }}
                  className="h-8 px-3 text-[12px] text-v-t2 hover:text-v-t1 hover:bg-v-surface rounded-md transition-colors cursor-pointer">Annuler</button>
                <button type="submit" disabled={isLoading}
                  className="h-8 px-3 text-[12px] font-medium bg-v-warn/10 text-v-warn border border-v-warn/20 hover:bg-v-warn/20 rounded-md transition-colors disabled:opacity-50 cursor-pointer">
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
