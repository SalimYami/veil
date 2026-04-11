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
  Tag, ChevronRight, Menu, Home
} from 'lucide-react';

type Section = 'vault' | 'upload' | 'activity' | 'tags';

const NAV: { id: Section; icon: React.ReactNode; label: string }[] = [
  { id: 'vault',    icon: <FolderLock size={18} />, label: 'Vault' },
  { id: 'upload',   icon: <Upload size={18} />,     label: 'Upload' },
  { id: 'activity', icon: <Activity size={18} />,   label: 'Activity' },
  { id: 'tags',     icon: <Tag size={18} />,        label: 'Tags' },
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
    if (t === 'error') return { icon: <AlertCircle size={16} />, color: 'text-destructive' };
    return { icon: <Info size={16} />, color: 'text-accent' };
  };

  const sectionMeta: Record<Section, { title: string; desc: string }> = {
    vault: { title: 'Vault', desc: 'Your encrypted files' },
    upload: { title: 'Upload', desc: 'Secure file encryption' },
    activity: { title: 'Activity', desc: 'Operation history' },
    tags: { title: 'Tags', desc: 'Organization & filtering' },
  };

  const meta = sectionMeta[section];

  return (
    <div className="fixed inset-0 bg-background flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 flex items-center px-6 gap-4 border-b border-border bg-card/30 backdrop-blur-sm z-40">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <Menu size={20} className="text-foreground" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary">
            <Logo size={18} />
          </div>
          <span className="text-sm font-semibold text-foreground hidden sm:block">VEIL</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <Home size={16} />
          <ChevronRight size={14} className="opacity-50" />
          <span className="text-foreground font-medium">{meta.title}</span>
        </div>

        <div className="flex-1" />

        {/* Top Right Actions */}
        <div className="flex items-center gap-3">
          <SearchBar />

          {role === 'user' && (
            <button
              onClick={() => setShowPromote(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              <KeyRound size={16} />
              <span>Admin</span>
            </button>
          )}

          <button
            onClick={logout}
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-0'
          } border-r border-border bg-card/20 backdrop-blur-sm transition-all duration-300 overflow-hidden flex flex-col lg:flex lg:w-64 z-30`}
        >
          <nav className="flex-1 p-4 space-y-2">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  section === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border space-y-3">
            <div className="px-3 py-2 rounded-lg bg-secondary/50">
              <p className="text-xs font-medium text-muted-foreground">Logged in as</p>
              <p className="text-sm text-foreground truncate font-medium">{email}</p>
            </div>

            {role === 'admin' && (
              <button
                onClick={() => setView('admin')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-accent hover:bg-secondary transition-colors"
              >
                <ShieldCheck size={16} />
                <span>Admin Panel</span>
              </button>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto flex flex-col">
          {/* Section Header */}
          <div className="px-6 py-8 border-b border-border bg-card/30">
            <h1 className="text-3xl font-bold text-foreground mb-2">{meta.title}</h1>
            <p className="text-muted-foreground">{meta.desc}</p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-3">
                <AlertCircle size={18} className="text-destructive flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">{error}</p>
                  <button
                    onClick={clearError}
                    className="text-xs text-destructive/80 hover:text-destructive mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {section === 'vault' && <FileList files={files} />}
            {section === 'upload' && <FileUploader />}
            {section === 'activity' && <ActivityFeed />}
            {section === 'tags' && <TagFilter />}
          </div>
        </main>
      </div>

      {/* Admin Promotion Modal */}
      {showPromote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md shadow-premium-lg">
            <div className="px-6 py-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Admin Access</h3>
              <button
                onClick={() => setShowPromote(false)}
                className="p-1 hover:bg-secondary rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePromote} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Admin Key</label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="input-base"
                  placeholder="Enter admin key"
                  required
                />
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full h-10">
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 space-y-3 z-50 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 shadow-premium-lg pointer-events-auto animate-slideUp"
          >
            <div className={toastStyle(toast.type).color}>{toastStyle(toast.type).icon}</div>
            <p className="text-sm text-foreground">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="fixed bottom-6 left-6 bg-card border border-border rounded-lg p-4 shadow-premium-lg z-40 max-w-xs">
          <p className="text-sm font-medium text-foreground mb-3">Uploading {uploadQueue.length} file(s)</p>
          <div className="space-y-2">
            {uploadQueue.map((file) => (
              <div key={file.id} className="space-y-1">
                <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
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
