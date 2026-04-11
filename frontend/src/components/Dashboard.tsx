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
  { id: 'vault',    icon: <FolderLock size={17} />, label: 'Coffre-fort' },
  { id: 'upload',   icon: <Upload size={17} />,     label: 'Upload' },
  { id: 'activity', icon: <Activity size={17} />,   label: 'Activite' },
  { id: 'tags',     icon: <Tag size={17} />,        label: 'Tags' },
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
    catch { /* store handles error */ }
  };

  if (view === 'admin') return <AdminDashboard onBack={() => setView('user')} />;

  const toastStyle = (t: string) => {
    if (t === 'success') return { icon: <CheckCircle2 size={15} />, color: 'text-v-success' };
    if (t === 'error')   return { icon: <AlertCircle size={15} />,  color: 'text-v-danger' };
    return { icon: <Info size={15} />, color: 'text-v-info' };
  };

  const sectionMeta: Record<Section, { title: string; desc: string }> = {
    vault:    { title: 'Coffre-fort',     desc: 'Vos fichiers chiffres' },
    upload:   { title: 'Upload securise', desc: 'Chiffrement local avant envoi' },
    activity: { title: 'Journal',         desc: 'Historique des operations' },
    tags:     { title: 'Tags',            desc: 'Filtrage et organisation' },
  };

  const meta = sectionMeta[section];

  return (
    <div className="fixed inset-0 bg-v-bg text-v-t1 flex flex-col font-['Inter']">

      {/* ══════════════════════════════════════════════════════════════════
          HEADER — Premium top bar with generous spacing
          ══════════════════════════════════════════════════════════════════ */}
      <header className="flex-shrink-0 h-16 flex items-center px-6 gap-4 border-b border-v-border bg-v-bg z-50">

        {/* Brand Mark */}
        <div className="flex items-center gap-3 pr-5 border-r border-v-border mr-2">
          <div className="w-9 h-9 rounded-lg bg-v-accent/10 border border-v-accent/20 flex items-center justify-center text-v-accent">
            <Logo size={18} />
          </div>
          <span className="text-[14px] font-semibold tracking-wide text-v-t1 hidden sm:block">VEIL</span>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="hidden sm:flex items-center gap-2 text-[13px] text-v-t3">
          <span className="hover:text-v-t2 cursor-pointer transition-colors" onClick={() => setSection('vault')}>Espace</span>
          <ChevronRight size={13} className="opacity-40" />
          <span className="text-v-t1 font-medium">{meta.title}</span>
        </div>

        {/* Center — Search */}
        <div className="flex-1 max-w-sm mx-auto px-4">
          <SearchBar />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">

          {/* ZK Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 h-9 px-4 rounded-lg border border-v-success/20 bg-v-success/[0.06]">
            <div className="dot-live" />
            <span className="text-[11px] font-medium text-v-success">Chiffre</span>
          </div>

          {/* Admin Access */}
          {role === 'admin' ? (
            <button onClick={() => setView('admin')}
              className="h-9 px-4 rounded-lg text-[12px] font-medium text-v-warn bg-v-warn/10 border border-v-warn/20 hover:bg-v-warn/15 transition-colors cursor-pointer flex items-center gap-2">
              <Settings size={14} /> Admin
            </button>
          ) : (
            <button onClick={() => setShowPromote(true)}
              className="w-9 h-9 rounded-lg border border-v-border bg-v-surface text-v-t3 hover:text-v-t2 hover:border-v-border-l flex items-center justify-center transition-colors cursor-pointer"
              title="Mode admin">
              <Lock size={14} />
            </button>
          )}

          {/* User Identity */}
          <div className="hidden md:flex items-center gap-2 h-9 px-4 rounded-lg border border-v-border bg-v-surface">
            <KeyRound size={12} className="text-v-t3" />
            <span className="text-[12px] font-mono text-v-t2 max-w-[120px] truncate">{email}</span>
          </div>

          {/* Logout */}
          <button onClick={logout} title="Deconnexion"
            className="w-9 h-9 rounded-lg border border-v-border bg-v-surface text-v-t3 hover:text-v-danger hover:border-v-danger/30 flex items-center justify-center transition-colors cursor-pointer">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          BODY — Sidebar + Main content with proper proportions
          ══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0">

        {/* ── SIDEBAR ── */}
        <aside className="flex-shrink-0 w-[220px] border-r border-v-border bg-v-bg flex flex-col">

          {/* Navigation */}
          <nav className="flex flex-col gap-1 p-4 pt-6">
            {NAV.map((n) => {
              const active = section === n.id;
              const badge = n.id === 'upload' && uploadQueue.length > 0 ? uploadQueue.length : null;
              return (
                <button
                  key={n.id}
                  onClick={() => setSection(n.id)}
                  className={`flex items-center gap-3 h-11 px-4 rounded-xl text-[14px] font-medium transition-all duration-150 cursor-pointer
                    ${active
                      ? 'bg-v-accent/10 text-v-accent border border-v-accent/20'
                      : 'text-v-t3 hover:text-v-t2 hover:bg-v-surface border border-transparent'}`}
                >
                  <span className={active ? 'text-v-accent' : ''}>{n.icon}</span>
                  <span className="flex-1 text-left">{n.label}</span>
                  {badge && (
                    <span className="text-[10px] font-mono bg-v-accent text-white w-5 h-5 rounded-md flex items-center justify-center">{badge}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mx-4 h-px bg-v-border my-4" />

          {/* Stats Card */}
          <div className="px-4">
            <div className="p-5 rounded-xl border border-v-border bg-v-surface">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={14} className="text-v-success" />
                <span className="text-[11px] font-medium text-v-success uppercase tracking-wider">Coffre actif</span>
              </div>
              <p className="text-[32px] font-bold text-v-t1 leading-none tracking-tight">{files?.length ?? 0}</p>
              <p className="text-[12px] text-v-t3 mt-2">fichiers chiffres</p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Bottom Info */}
          <div className="p-5 border-t border-v-border">
            <p className="text-[11px] text-v-t3 leading-relaxed">
              AES-256-GCM · Argon2id<br/>Zero-Knowledge Architecture
            </p>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 flex flex-col bg-v-bg">

          {/* Section Header */}
          <div className="flex-shrink-0 flex items-center justify-between h-16 px-8 border-b border-v-border">
            <div className="flex items-center gap-3">
              <h1 className="text-[16px] font-semibold text-v-t1">{meta.title}</h1>
              <span className="text-[13px] text-v-t3">— {meta.desc}</span>
            </div>
            {section === 'vault' && (
              <button onClick={() => setSection('upload')}
                className="flex items-center gap-2 h-10 px-5 rounded-lg text-[13px] font-medium bg-v-accent hover:bg-v-accent-h text-white transition-all duration-150 cursor-pointer hover:shadow-[0_4px_12px_rgba(37,99,235,0.25)]">
                <Plus size={15} /> Upload
              </button>
            )}
          </div>

          {/* Scroll Container */}
          <div className="flex-1 overflow-y-auto scroll-thin">
            <div className="p-8">
              {section === 'vault'    && <FileList />}
              {section === 'upload'   && <div className="max-w-2xl"><FileUploader /></div>}
              {section === 'activity' && <div className="max-w-2xl"><ActivityFeed /></div>}
              {section === 'tags'     && <div className="max-w-md"><TagFilter /></div>}
            </div>
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TOASTS — Notification stack
          ══════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none w-[340px]">
        {toasts.map((t) => {
          const s = toastStyle(t.type);
          return (
            <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-5 py-4 surface-overlay rounded-xl shadow-xl anim-slide-r">
              <span className={s.color}>{s.icon}</span>
              <span className="flex-1 text-[13px] text-v-t1">{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="text-v-t3 hover:text-v-t1 cursor-pointer transition-colors"><X size={14} /></button>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          PROMOTE MODAL — Admin elevation dialog
          ══════════════════════════════════════════════════════════════════ */}
      {showPromote && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6 anim-in">
          <div className="surface-overlay rounded-2xl w-full max-w-[400px] shadow-2xl anim-scale">
            <div className="px-6 py-5 border-b border-v-border flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-v-t1 flex items-center gap-2.5">
                <Settings size={17} className="text-v-warn" /> Elevation admin
              </h3>
              <button onClick={() => { setShowPromote(false); clearError(); }}
                className="text-v-t3 hover:text-v-t1 cursor-pointer transition-colors"><X size={17} /></button>
            </div>
            <form onSubmit={handlePromote} className="p-6 space-y-5">
              <p className="text-[13px] text-v-t2 leading-relaxed">Entrez la cle administration pour activer le mode admin.</p>
              <div className="flex items-center gap-3 h-12 px-4 rounded-xl border border-v-border bg-v-surface focus-within:border-v-warn/50 transition-colors">
                <KeyRound size={15} className="text-v-t3" />
                <input type="password" placeholder="Cle admin" value={adminKey} onChange={e => setAdminKey(e.target.value)}
                  autoFocus required className="flex-1 bg-transparent border-none outline-none text-[14px] text-v-t1 placeholder-v-t3" />
              </div>
              {error && <p className="text-[12px] text-v-danger flex items-center gap-2"><AlertCircle size={13}/>{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowPromote(false); clearError(); }}
                  className="h-10 px-5 text-[13px] text-v-t2 hover:text-v-t1 hover:bg-v-surface rounded-lg transition-colors cursor-pointer">Annuler</button>
                <button type="submit" disabled={isLoading}
                  className="h-10 px-5 text-[13px] font-medium bg-v-warn/10 text-v-warn border border-v-warn/20 hover:bg-v-warn/20 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
                  {isLoading ? 'Verification...' : 'Activer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
