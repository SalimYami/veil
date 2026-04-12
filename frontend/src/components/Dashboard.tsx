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
  LogOut, Settings,
  CheckCircle2, Info, X,
  Upload, ShieldCheck, FolderLock, Activity,
  Tag, ChevronRight, Menu, Home, ShieldAlert
} from 'lucide-react';

type Section = 'vault' | 'upload' | 'activity' | 'tags';

const NAV: { id: Section; icon: React.ReactNode; label: string }[] = [
  { id: 'vault',    icon: <FolderLock size={18} />, label: 'Coffre' },
  { id: 'upload',   icon: <Upload size={18} />,     label: 'Upload' },
  { id: 'activity', icon: <Activity size={18} />,   label: 'Audit' },
  { id: 'tags',     icon: <Tag size={18} />,        label: 'Tags' },
];

export function Dashboard() {
  const { email, role, logout, promote, isLoading, error, clearError } = useAuthStore();
  const { toasts, removeToast, uploadQueue } = useFileStore();
  const [view, setView] = useState<'user' | 'admin'>('user');
  const [showPromote, setShowPromote] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [section, setSection] = useState<Section>('vault');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (view === 'admin') return <AdminDashboard onBack={() => setView('user')} />;

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await promote(adminKey);
      setAdminKey('');
      setShowPromote(false);
    } catch { /* Handled by store */ }
  };

  const toastStyle = (t: string) => {
    if (t === 'success') return { icon: <CheckCircle2 size={14} />, color: 'text-primary' };
    if (t === 'error') return { icon: <ShieldAlert size={14} />, color: 'text-destructive' };
    return { icon: <Info size={14} />, color: 'text-accent' };
  };

  const sectionMeta: Record<Section, { title: string; desc: string }> = {
    vault: { title: 'Coffre', desc: 'Accès sécurisé à vos données chiffrées.' },
    upload: { title: 'Upload', desc: 'Chiffrement et transfert sécurisé.' },
    activity: { title: 'Audit', desc: 'Journal des opérations cryptographiques.' },
    tags: { title: 'Tags', desc: 'Organisation sémantique.' },
  };

  const meta = sectionMeta[section];

  return (
    <div className="h-screen bg-background flex flex-col antialiased selection:bg-primary/20 overflow-hidden cursor-default">
      
      {/* Background Decor */}
      <div className="grid-dots fixed inset-0 opacity-20" />
      <div className="halo top-[-10%] right-[-5%] w-[40%] h-[40%]" />

      {/* Primary Header */}
      <header className="h-14 flex items-center px-4 md:px-6 gap-4 border-b border-white/[0.03] bg-background/40 backdrop-blur-xl z-40 relative">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-1.5 animate-in">
          <Logo size={20} className="translate-y-[-0.5px]" />
          <span className="text-[14px] font-black italic tracking-[0.1em] text-white/90 hidden sm:block leading-none">VEIL</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] text-muted-foreground/60 ml-4 font-medium uppercase tracking-widest">
          <Home size={12} />
          <ChevronRight size={10} className="mt-0.5" />
          <span className="text-white/60">{meta.title}</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <div className="w-[240px] hidden lg:block">
             <SearchBar />
          </div>

          <div className="h-4 w-px bg-white/5 mx-1 hidden sm:block" />

          <button
            onClick={logout}
            className="p-2 hover:bg-destructive/10 hover:text-white rounded-lg transition-all text-muted-foreground/60 group"
            title="Terminate"
          >
            <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {/* Pro Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-[240px]' : 'w-0'
          } border-r border-white/[0.03] bg-black/10 transition-all duration-300 overflow-hidden flex flex-col lg:flex lg:w-[240px] z-30`}
        >
          <nav className="flex-1 px-3 py-6 space-y-1">
            <div className="px-3 pb-3">
               <p className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground/50 uppercase">Infra/Ops</p>
            </div>
            
            {NAV.map((item) => {
              const isActive = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSection(item.id);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all duration-200 border ${
                    isActive
                      ? 'bg-primary/5 text-primary border-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]'
                      : 'text-muted-foreground/70 hover:bg-white/[0.02] hover:text-white border-transparent'
                  }`}
                >
                  <div className={isActive ? 'text-primary' : 'text-muted-foreground/40'}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/[0.03] space-y-3">
            <div className="px-3 py-2 rounded-lg bg-white/[0.01] border border-white/[0.02]">
              <p className="text-[9px] font-bold tracking-[0.1em] text-muted-foreground/40 uppercase mb-0.5">Session Identity</p>
              <p className="text-[11px] text-white/70 truncate font-mono">{email}</p>
            </div>

            {role === 'admin' ? (
              <button
                onClick={() => setView('admin')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold tracking-[0.1em] uppercase text-accent bg-accent/5 hover:bg-accent hover:text-white transition-all border border-accent/20"
              >
                <ShieldCheck size={14} />
                <span>Admin Terminal</span>
              </button>
            ) : (
              <button
                onClick={() => setShowPromote(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground/60 border border-white/5 hover:bg-white/5 transition-all"
              >
                <Settings size={14} />
                <span>Elevate Access</span>
              </button>
            )}
          </div>
        </aside>

        {/* Workspace */}
        <main className="flex-1 flex flex-col bg-white/[0.01] overflow-hidden">
          
          {/* Header Row */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/[0.02] animate-in">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none mb-1">
                {meta.title}
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
                {meta.desc}
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="badge bg-green-500/10 text-green-500 border-green-500/20">Operational</span>
            </div>
          </div>

          {/* View Scroll Container */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none px-6 py-6 custom-scrollbar animate-in" style={{ animationDelay: '0.1s' }}>
            <div className="max-w-6xl mx-auto space-y-6">
              
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3 max-w-2xl animate-in">
                  <ShieldAlert size={16} className="text-destructive flex-shrink-0" />
                  <p className="text-[12px] font-semibold text-destructive flex-1">{error}</p>
                  <button onClick={clearError} className="p-1 hover:bg-destructive/10 rounded">
                    <X size={14} className="text-destructive/60" />
                  </button>
                </div>
              )}

              {section === 'vault' && <FileList />}
              {section === 'upload' && <div className="max-w-2xl"><FileUploader /></div>}
              {section === 'activity' && <ActivityFeed />}
              {section === 'tags' && <TagFilter />}
              
              <div className="h-10" />
            </div>
          </div>
        </main>
      </div>

      {/* Escalate Privileges Modal */}
      {showPromote && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-[360px] shadow-pro animate-in">
            <div className="px-5 py-4 border-b border-white/[0.03] flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-white uppercase tracking-widest">Escalate Privileges</h3>
              <button onClick={() => setShowPromote(false)} className="text-muted-foreground hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handlePromote} className="px-5 py-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest ml-1">Admin Passkey</label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="input-base"
                  placeholder="Master authorization token"
                  required
                />
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full h-9">
                {isLoading ? 'Verifying...' : 'Authorize Terminal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Notifications (Toasts) */}
      <div className="fixed bottom-6 right-6 space-y-3 z-50 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-card/80 backdrop-blur-xl border border-white/[0.06] rounded-xl p-3 flex items-center gap-3 shadow-pro pointer-events-auto animate-in min-w-[280px]"
          >
            <div className={`${toastStyle(toast.type).color} bg-white/[0.02] p-1.5 rounded-lg border border-white/[0.03]`}>
              {toastStyle(toast.type).icon}
            </div>
            <p className="text-[12px] font-semibold text-white/90 flex-1">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="text-muted-foreground/40 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Task Queue Overlay */}
      {uploadQueue.length > 0 && (
        <div className="fixed bottom-6 left-6 bg-card/90 backdrop-blur-2xl border border-white/[0.06] rounded-xl p-4 shadow-pro z-40 w-72 animate-in">
          <div className="flex items-center justify-between mb-3">
             <p className="text-[10px] font-black tracking-widest text-white uppercase">Encryption Queue</p>
             <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">{uploadQueue.length} items</span>
          </div>
          <div className="space-y-3">
            {uploadQueue.map((file) => (
              <div key={file.id} className="space-y-1.5">
                <p className="text-[11px] text-muted-foreground truncate font-medium">{file.name}</p>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
