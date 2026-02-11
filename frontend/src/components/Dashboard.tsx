/**
 * VEIL - Dashboard Principal
 * Layout: Header + Sidebar (activity/tags) + Main (upload/files)
 */

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
    PanelLeftClose, PanelLeftOpen, CheckCircle, AlertCircle, Info, X
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
        } catch (err) {
            // Error handled by store
        }
    };

    if (view === 'admin') {
        return <AdminDashboard onBack={() => setView('user')} />;
    }

    const toastIcon = (type: string) => {
        if (type === 'success') return <CheckCircle size={16} />;
        if (type === 'error') return <AlertCircle size={16} />;
        return <Info size={16} />;
    };

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="logo-section" style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        title={sidebarOpen ? 'Fermer le panneau' : 'Ouvrir le panneau'}
                    >
                        {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                    </button>
                    <Shield size={28} strokeWidth={2} />
                    <h1>VEIL</h1>

                    {role === 'admin' ? (
                        <button
                            className="action-btn admin-active"
                            style={{ marginLeft: '20px' }}
                            onClick={() => setView('admin')}
                            title="Administration Système"
                        >
                            <Settings size={18} />
                            <span className="btn-label">Admin</span>
                        </button>
                    ) : (
                        <button
                            className="action-btn-minimal"
                            style={{ marginLeft: '20px' }}
                            onClick={() => setShowPromoteModal(true)}
                            title="Activer le mode Admin"
                        >
                            <Lock size={14} />
                        </button>
                    )}
                </div>

                <div className="header-center">
                    <SearchBar />
                </div>

                <div className="user-section">
                    <div className="user-pill">
                        <KeyRound size={14} />
                        <span>{email}</span>
                    </div>
                    <button className="logout-btn" onClick={logout} title="Fermer le coffre">
                        <LogOut size={18} />
                        <span>Verrouiller</span>
                    </button>
                </div>
            </header>

            {/* Body: Sidebar + Main */}
            <div className="dashboard-body">
                {/* Sidebar */}
                <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                    <div className="sidebar-content">
                        {/* ZK Status mini */}
                        <div className="zk-status-mini">
                            <Lock size={16} color="var(--primary)" />
                            <span>Zero-Knowledge Actif</span>
                        </div>

                        <TagFilter />
                        <ActivityFeed />
                    </div>
                </aside>

                {/* Main Content */}
                <main className="dashboard-main">
                    {/* Upload Section */}
                    <section className="upload-section">
                        <h2>Upload Sécurisé (AES-256-GCM)</h2>
                        <FileUploader />
                    </section>

                    {/* Files Section */}
                    <section className="files-section">
                        <h2>Mon Coffre-fort</h2>
                        <FileList />
                    </section>
                </main>
            </div>

            {/* Toast Container */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        {toastIcon(toast.type)}
                        <span>{toast.message}</span>
                        <button className="toast-close" onClick={() => removeToast(toast.id)}>
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal de Promotion */}
            {showPromoteModal && (
                <div className="modal-overlay reveal-bg">
                    <div className="modal-content-minimal">
                        <div className="modal-header-minimal">
                            <h3>Élévation de privilèges</h3>
                            <button className="close-btn-minimal" onClick={() => { setShowPromoteModal(false); clearError(); }}>
                                <Settings size={18} />
                            </button>
                        </div>
                        <form onSubmit={handlePromote} className="modal-body-minimal">
                            <p>Veuillez entrer la clé de sécurité pour activer les fonctions d'administration système.</p>
                            <div className="input-group">
                                <KeyRound className="input-icon" size={18} />
                                <input
                                    type="password"
                                    placeholder="Clé de sécurité admin"
                                    value={adminKey}
                                    onChange={(e) => setAdminKey(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            {error && <div className="error-text-minimal">{error}</div>}
                            <div className="modal-footer-minimal">
                                <button type="button" className="cancel-btn" onClick={() => { setShowPromoteModal(false); clearError(); }}>
                                    Annuler
                                </button>
                                <button type="submit" className="submit-btn-minimal" disabled={isLoading}>
                                    {isLoading ? 'Vérification...' : 'Activer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="dashboard-footer">
                <p>
                    🔒 Sécurité garantie par <strong>Argon2id</strong> (dérivation) et <strong>AES-256-GCM</strong> (stockage).
                    <br />
                    Aucune clé ne transite jamais par le réseau.
                </p>
            </footer>
        </div>
    );
}
