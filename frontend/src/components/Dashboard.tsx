import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useFileStore } from '../store/fileStore';
import { FileUploader } from './FileUploader';
import { FileList } from './FileList';
import { AdminDashboard } from './AdminDashboard';
import { SearchBar } from './SearchBar';
import { ActivityFeed } from './ActivityFeed';
import { TagFilter } from './TagFilter';
import {
    Shield, LogOut, KeyRound, Lock, Settings,
    PanelLeftClose, PanelLeftOpen, CheckCircle, AlertCircle, Info, X, Zap
} from 'lucide-react';

export function Dashboard() {
    const { email, role, logout, promote, isLoading, error, clearError } = useAuthStore();
    const { toasts, removeToast } = useFileStore();
    const [view, setView] = useState<'user' | 'admin'>('user');
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [adminKey, setAdminKey] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);

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

    const toastIcon = (type: string) => {
        if (type === 'success') return <CheckCircle size={18} className="text-vault-success" />;
        if (type === 'error') return <AlertCircle size={18} className="text-vault-error" />;
        return <Info size={18} className="text-vault-secondary" />;
    };

    return (
        <div className="min-h-screen bg-vault-bg-primary text-vault-text-primary flex flex-col font-sans selection:bg-vault-primary selection:text-white relative">
            {/* Background Mesh */}
            <div className="absolute inset-0 bg-mesh opacity-60 pointer-events-none z-0"></div>

            {/* Header */}
            <header className="sticky top-0 z-50 h-20 px-8 flex items-center justify-between gap-6 bg-vault-bg-secondary/70 backdrop-blur-2xl border-b border-white/5 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        className="p-2 text-vault-text-secondary hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl transition-all"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        title={sidebarOpen ? 'Fermer le panneau' : 'Ouvrir le panneau'}
                    >
                        {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                    </button>
                    
                    <div className="flex items-center gap-2.5">
                         <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-vault-primary to-vault-secondary p-[1px] shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                            <div className="w-full h-full bg-vault-bg-primary rounded-lg flex items-center justify-center">
                                <Shield size={16} className="text-white" />
                            </div>
                        </div>
                        <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">VEIL</h1>
                    </div>

                    {role === 'admin' ? (
                        <button
                            className="ml-4 px-3 py-1.5 flex items-center gap-2 bg-vault-warning/10 text-vault-warning border border-vault-warning/20 rounded-lg text-sm font-medium hover:bg-vault-warning/20 transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                            onClick={() => setView('admin')}
                            title="Administration Système"
                        >
                            <Settings size={16} />
                            <span>Admin</span>
                        </button>
                    ) : (
                        <button
                            className="ml-4 p-1.5 text-vault-text-muted hover:text-vault-text-primary hover:bg-white/5 rounded-lg transition-all"
                            onClick={() => setShowPromoteModal(true)}
                            title="Activer le mode Admin"
                        >
                            <Lock size={16} />
                        </button>
                    )}
                </div>

                <div className="flex-1 max-w-lg mx-auto">
                    <SearchBar />
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-vault-bg-tertiary border border-white/5 rounded-full shadow-inner">
                        <KeyRound size={14} className="text-vault-primary" />
                        <span className="font-mono text-sm tracking-wide text-white/90">{email}</span>
                    </div>
                    <button 
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-vault-error/10 text-vault-text-secondary hover:text-vault-error border border-transparent hover:border-vault-error/20 rounded-full text-sm font-medium transition-all group"
                        onClick={logout} 
                        title="Fermer le coffre"
                    >
                        <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span>Verrouiller</span>
                    </button>
                </div>
            </header>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden relative z-10 p-6 gap-6">
                
                {/* Sidebar (Bento Box) */}
                <aside className={`transition-all duration-300 ease-in-out flex flex-col gap-6 ${sidebarOpen ? 'w-72 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-10 overflow-hidden'}`}>
                    <div className="bg-glass-heavy flex-1 rounded-3xl p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                        
                        {/* ZK Status */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-vault-success/10 border border-vault-success/20 rounded-2xl">
                            <div className="p-1.5 bg-vault-success/20 rounded-lg text-vault-success shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                <Zap size={16} className="fill-current" />
                            </div>
                            <span className="font-mono text-[0.8rem] uppercase tracking-wider text-vault-success font-semibold">Zero-Knowledge</span>
                        </div>

                        <TagFilter />
                        
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-2"></div>
                        
                        <ActivityFeed />
                    </div>
                </aside>

                {/* Main Content (Bento Layout) */}
                <main className="flex-1 flex flex-col gap-6 overflow-y-auto min-w-0 pr-2 custom-scrollbar">
                    {/* Upload Section Bento */}
                    <section className="bg-glass rounded-3xl p-6 border border-white/5 flex flex-col shadow-xl">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                             <span className="w-1.5 h-6 rounded-full bg-vault-primary shadow-[0_0_10px_rgba(37,99,235,0.6)]"></span>
                             Upload Sécurisé
                             <span className="ml-2 px-2 py-0.5 bg-vault-primary/10 text-vault-primary text-xs font-mono rounded-md border border-vault-primary/20">AES-256-GCM</span>
                        </h2>
                        <div className="flex-1 min-h-[160px]">
                            <FileUploader />
                        </div>
                    </section>

                    {/* Files Section Bento */}
                    <section className="bg-glass rounded-3xl p-6 border border-white/5 flex flex-col flex-1 shadow-xl">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                             <span className="w-1.5 h-6 rounded-full bg-vault-secondary shadow-[0_0_10px_rgba(59,130,246,0.6)]"></span>
                             Mon Coffre-fort
                        </h2>
                        <div className="flex-1 min-h-0">
                            <FileList />
                        </div>
                    </section>
                </main>
            </div>

            {/* Toasts */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto flex items-center gap-3 min-w-[300px] px-4 py-3 bg-vault-bg-tertiary/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-[fadeInUp_0.4s_ease-out]">
                        {toastIcon(toast.type)}
                        <span className="flex-1 text-sm font-medium text-white/90">{toast.message}</span>
                        <button className="p-1 hover:bg-white/10 rounded-lg text-vault-text-muted hover:text-white transition-colors" onClick={() => removeToast(toast.id)}>
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Promote Modal */}
            {showPromoteModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-vault-bg-primary/80 backdrop-blur-md p-4 animate-[fadeIn_0.3s_ease-out]">
                    <div className="bg-vault-bg-secondary border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-[scaleIn_0.3s_ease-out]">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Settings size={18} className="text-vault-warning" />
                                Élévation de privilèges
                            </h3>
                            <button className="p-1.5 text-vault-text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors" onClick={() => { setShowPromoteModal(false); clearError(); }}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handlePromote} className="p-6">
                            <p className="text-vault-text-secondary text-sm mb-5">Veuillez entrer la clé de sécurité pour activer les fonctions d'administration système.</p>
                            
                            <div className="relative flex items-center bg-vault-bg-tertiary border border-white/10 rounded-xl px-4 focus-within:border-vault-warning focus-within:shadow-[0_0_0_2px_rgba(245,158,11,0.2)] transition-all">
                                <KeyRound className="text-vault-text-muted flex-shrink-0 mr-3" size={18} />
                                <input
                                    type="password"
                                    placeholder="Clé de sécurité admin"
                                    value={adminKey}
                                    onChange={(e) => setAdminKey(e.target.value)}
                                    autoFocus
                                    required
                                    className="w-full bg-transparent border-none text-white text-sm py-3 outline-none placeholder-vault-text-muted/50"
                                />
                            </div>
                            
                            {error && <div className="mt-3 text-vault-error text-sm flex items-center gap-1.5"><AlertCircle size={14}/>{error}</div>}
                            
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" className="px-4 py-2 bg-transparent text-vault-text-secondary hover:text-white rounded-lg text-sm font-medium transition-colors" onClick={() => { setShowPromoteModal(false); clearError(); }}>
                                    Annuler
                                </button>
                                <button type="submit" className="px-4 py-2 bg-vault-warning/20 text-vault-warning border border-vault-warning/30 hover:bg-vault-warning/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50" disabled={isLoading}>
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
