/**
 * =============================================================================
 * VEIL - Dashboard Principal
 * =============================================================================
 * 
 * Page principale après connexion.
 * Affiche l'uploader et la liste des fichiers.
 * 
 * =============================================================================
 */

import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { FileUploader } from './FileUploader';
import { FileList } from './FileList';
import { AdminDashboard } from './AdminDashboard';
import { Shield, LogOut, KeyRound, Lock, Settings } from 'lucide-react';

export function Dashboard() {
    const { email, role, logout, promote, isLoading, error, clearError } = useAuthStore();
    const [view, setView] = useState<'user' | 'admin'>('user');
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [adminKey, setAdminKey] = useState('');

    const handlePromote = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await promote(adminKey);
            setShowPromoteModal(false);
            setAdminKey('');
        } catch (err) {
            // L'erreur est gérée par le store
        }
    };

    if (view === 'admin') {
        return <AdminDashboard onBack={() => setView('user')} />;
    }

    return (
        <div className="dashboard">
            {/* Header Glassmorphism */}
            <header className="dashboard-header">
                <div className="logo-section" style={{ display: 'flex', alignItems: 'center' }}>
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

            {/* Zone principale */}
            <main className="dashboard-main">
                {/* Section indicateur Zero-Knowledge */}
                <div className="zk-status">
                    <div className="status-icon-wrapper">
                        <Lock size={24} color="var(--primary)" />
                    </div>
                    <div className="status-text">
                        <strong>Mode Zero-Knowledge Actif</strong>
                        <p>Toutes les opérations de chiffrement sont effectuées localement. Le serveur ne reçoit que des données illisibles.</p>
                    </div>
                </div>

                {/* Uploader */}
                <section className="upload-section">
                    <h2>Upload Sécurisé (AES-256-GCM)</h2>
                    <FileUploader />
                </section>

                {/* Liste des fichiers */}
                <section className="files-section">
                    <h2>Mon Coffre-fort</h2>
                    <FileList />
                </section>
            </main>

            {/* Modal de Promotion Élégante */}
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
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => { setShowPromoteModal(false); clearError(); }}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="submit-btn-minimal"
                                    disabled={isLoading}
                                >
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
