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

import { useAuthStore } from '../store/authStore';
import { FileUploader } from './FileUploader';
import { FileList } from './FileList';
import { Shield, LogOut, KeyRound } from 'lucide-react';

export function Dashboard() {
    const { email, logout } = useAuthStore();

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="logo-section">
                    <Shield size={32} strokeWidth={1.5} />
                    <h1>VEIL</h1>
                </div>

                <div className="user-section">
                    <div className="user-info">
                        <KeyRound size={16} />
                        <span>{email}</span>
                    </div>
                    <button className="logout-btn" onClick={logout}>
                        <LogOut size={18} />
                        Déconnexion
                    </button>
                </div>
            </header>

            {/* Zone principale */}
            <main className="dashboard-main">
                {/* Section indicateur Zero-Knowledge */}
                <div className="zk-status">
                    <div className="status-icon">🔐</div>
                    <div className="status-text">
                        <strong>Chiffrement Zero-Knowledge actif</strong>
                        <p>Vos fichiers sont chiffrés côté client. Le serveur ne voit que des blobs illisibles.</p>
                    </div>
                </div>

                {/* Uploader */}
                <section className="upload-section">
                    <h2>Upload sécurisé</h2>
                    <FileUploader />
                </section>

                {/* Liste des fichiers */}
                <section className="files-section">
                    <h2>Mes fichiers chiffrés</h2>
                    <FileList />
                </section>
            </main>

            {/* Footer */}
            <footer className="dashboard-footer">
                <p>
                    🔒 Tous vos fichiers sont chiffrés avec <strong>AES-256-GCM</strong> côté client.
                    <br />
                    Le serveur stocke uniquement des données <strong>illisibles sans votre mot de passe</strong>.
                </p>
            </footer>
        </div>
    );
}
