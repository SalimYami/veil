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
  Tag, ChevronRight, Menu, Home, ShieldAlert
} from 'lucide-react';

type Section = 'vault' | 'upload' | 'activity' | 'tags';

const NAV: { id: Section; icon: React.ReactNode; label: string }[] = [
  { id: 'vault',    icon: <FolderLock size={18} />, label: 'Encrypted Vault' },
  { id: 'upload',   icon: <Upload size={18} />,     label: 'Secure Upload' },
  { id: 'activity', icon: <Activity size={18} />,   label: 'Audit Log' },
  { id: 'tags',     icon: <Tag size={18} />,        label: 'Classification' },
];

export function Dashboard() {
  const { email, role, logout, promote, isLoading, error, clearError } = useAuthStore();
  const { toasts, removeToast, files, uploadQueue } = useFileStore();
  const [view, setView] = useState<'user' | 'admin'>('user');
  const [showPromote, setShowPromote] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [section, setSection] = useState<Section>('vault');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await promote(adminKey);
      setShowPromote(false);
      setAdminKey('');
    } catch {
      /* store handles error */
    }
  };

  if (view === 'admin') return <AdminDashboard onBack={() => setView('user')} />;

  const toastStyle = (t: string) => {
    if (t === 'success') return { icon: <CheckCircle2 size={16} />, color: 'text-primary' };
    if (t === 'error') return { icon: <ShieldAlert size={16} />, color: 'text-destructive' };
    return { icon: <Info size={16} />, color: 'text-accent' };
  };

  const sectionMeta: Record<Section, { title: string; desc: string }> = {
    vault: { title: 'Vault', desc: 'Secure local decryption environment.' },
    upload: { title: 'Upload', desc: 'Client-side encryption pipeline.' },
    activity: { title: 'Audit Log', desc: 'Immutable operational history.' },
    tags: { title: 'Classification', desc: 'Semantic organization of encrypted data.' },
  };

  const meta = sectionMeta[section];

  return (
    <div className="fixed inset-0 bg-background flex flex-col antialiased selection:bg-primary/20">
      
      {/* Halo Background Light */}
      <div className="halo-glow top-0 right-[20%]" />

      {/* Header */}
      <header className="h-20 flex items-center px-8 gap-6 border-b border-white/[0.04] bg-background/80 backdrop-blur-2xl z-40 relative">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2.5 hover:bg-secondary/80 rounded-xl transition-colors text-muted-foreground"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-[38px] h-[38px] rounded-xl bg-gradient-to-tr from-secondary to-card border border-white/5 flex items-center justify-center text-primary shadow-premium">
            <Logo size={20} />
          </div>
          <span className="text-[15px] font-semibold tracking-widest text-foreground uppercase hidden sm:block">VEIL</span>
        </div>

        <div className="hidden sm:flex items-center gap-2.5 text-[13px] text-muted-foreground ml-4">
          <Home size={15} />
          <ChevronRight size={14} className="opacity-40" />
          <span className="text-foreground tracking-wide font-medium">{meta.title}</span>
        </div>

        <div className="flex-1" />

        {/* Top Right Actions */}
        <div className="flex items-center gap-4">
          <div className="w-[280px] hidden md:block">
             <SearchBar />
          </div>

          {role === 'user' && (
            <button
              onClick={() => setShowPromote(true)}
              className="hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide text-muted-foreground uppercase hover:bg-secondary hover:text-foreground transition-all duration-300 border border-transparent hover:border-border/50"
            >
              <KeyRound size={15} />
              <span>Admin</span>
            </button>
          )}

          <div className="w-px h-6 bg-border/50 hidden sm:block mx-2" />

          <button
            onClick={logout}
            className="p-2.5 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors text-muted-foreground"
            title="Terminate Session"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Split */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {/* Executive Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-[280px]' : 'w-0'
          } border-r border-white/[0.04] bg-card/20 backdrop-blur-md transition-all duration-300 overflow-hidden flex flex-col lg:flex lg:w-[280px] z-30`}
        >
          <nav className="flex-1 px-5 py-8 space-y-1.5">
            <div className="px-3 pb-4">
               <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Operations</p>
            </div>
            
            {NAV.map((item) => {
              const isActive = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[14px] font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-transparent'
                  }`}
                >
                  <div className={isActive ? 'text-primary' : 'text-muted-foreground/70'}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-white/[0.04] space-y-4">
            <div className="px-5 py-4 rounded-xl bg-card border border-white/[0.03] shadow-inner">
              <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-1">Active Session</p>
              <p className="text-[14px] text-foreground truncate font-medium">{email}</p>
            </div>

            {role === 'admin' && (
              <button
                onClick={() => setView('admin')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-[13px] font-bold tracking-wide uppercase text-accent hover:bg-accent hover:text-white transition-all duration-300 border border-accent/30 hover:border-transparent"
              >
                <ShieldCheck size={16} />
                <span>Admin Console</span>
              </button>
            )}
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 overflow-auto flex flex-col">
          {/* Workspace Header */}
          <div className="px-10 py-12 lg:px-16 lg:py-14 max-w-7xl mx-auto w-full">
            <div className="max-w-3xl">
              <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-3">
                {meta.title}
              </h1>
              <p className="text-[16px] text-muted-foreground font-medium">
                {meta.desc}
              </p>
            </div>
            
            {/* Contextual Divider */}
            <div className="h-px w-full bg-gradient-to-r from-border/80 to-transparent mt-10" />

            {/* Error Injection */}
            {error && (
              <div className="mt-8 p-5 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-4 animate-slideUp max-w-3xl">
                <ShieldAlert size={22} className="text-destructive flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-destructive">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  className="p-2 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* View Port */}
            <div className="mt-10 pb-20">
              {section === 'vault' && <FileList files={files} />}
              {section === 'upload' && <FileUploader />}
              {section === 'activity' && <ActivityFeed />}
              {section === 'tags' && <TagFilter />}
            </div>
          </div>
        </main>
      </div>

      {/* Privilege Escalation Modal */}
      {showPromote && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-[440px] shadow-premium-lg animate-slideUp">
            <div className="px-8 py-6 border-b border-white/[0.04] flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground tracking-tight">Privilege Escalation</h3>
              <button
                onClick={() => setShowPromote(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePromote} className="px-8 py-8 space-y-6">
              <div className="space-y-2.5">
                <label className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">Admin Token</label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="input-base"
                  placeholder="Enter cryptographic key"
                  required
                />
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full shadow-none font-semibold">
                {isLoading ? 'Verifying...' : 'Authorize Escalation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Notifications */}
      <div className="fixed bottom-8 right-8 space-y-4 z-50 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-card/95 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 flex items-center gap-4 shadow-premium-lg pointer-events-auto animate-slideUp min-w-[300px]"
          >
            <div className={`${toastStyle(toast.type).color} bg-background p-2 rounded-xl border border-white/[0.03]`}>
              {toastStyle(toast.type).icon}
            </div>
            <p className="text-[14px] font-medium text-foreground flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1.5 text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Secure Upload Queue Manager */}
      {uploadQueue.length > 0 && (
        <div className="fixed bottom-8 left-8 bg-card/95 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 shadow-premium-lg z-40 w-80">
          <div className="flex items-center justify-between mb-5">
             <p className="text-[13px] font-bold tracking-wide text-foreground uppercase">Encryption Queue</p>
             <span className="text-[12px] font-medium text-muted-foreground px-2 py-0.5 rounded-md bg-secondary">{uploadQueue.length} files</span>
          </div>
          
          <div className="space-y-4">
            {uploadQueue.map((file) => (
              <div key={file.id} className="space-y-2.5">
                <p className="text-[13px] text-muted-foreground truncate font-medium">{file.name}</p>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
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
