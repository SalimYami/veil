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
import { Shield, LogOut, KeyRound, Lock } from 'lucide-react';

export function Dashboard() {
    const { email, logout } = useAuthStore();

    return (
        <div className="dashboard">
            {/* Header Glassmorphism */}
            <header className="dashboard-header">
                <div className="logo-section">
                    <Shield size={28} strokeWidth={2} />
                    <h1>VEIL</h1>
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
