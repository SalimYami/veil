/**
 * =============================================================================
 * VEIL - Dashboard Administration
 * =============================================================================
 * 
 * Interface pour le monitoring du système et la visualisation du stockage.
 * 
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import {
    getAdminDashboard,
    getAdminStorage,
    type AdminDashboard as AdminDashboardType,
    type AdminFile
} from '../lib/api';
import {
    Activity,
    Users,
    HardDrive,
    FileCode,
    ShieldCheck,
    RefreshCcw,
    Database,
    Clock,
    ArrowLeft
} from 'lucide-react';

export function AdminDashboard({ onBack }: { onBack: () => void }) {
    const { token } = useAuthStore();
    const [stats, setStats] = useState<AdminDashboardType | null>(null);
    const [storage, setStorage] = useState<AdminFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [statsData, storageData] = await Promise.all([
                getAdminDashboard(token),
                getAdminStorage(token)
            ]);
            setStats(statsData);
            setStorage(storageData.files);
            setError(null);
        } catch (err: any) {
            setError("Erreur lors de la récupération des données admin");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024);
        return mb.toFixed(2) + " MB";
    };

    if (isLoading) {
        return (
            <div className="admin-dashboard">
                <div className="loading-state">
                    <RefreshCcw className="spinner" size={48} />
                    <p>Initialisation du terminal admin...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <button onClick={onBack} className="action-btn" title="Retour">
                    <ArrowLeft size={20} />
                </button>
                <div style={{ marginTop: '20px' }}>
                    <span className="badge-admin">Root Access</span>
                    <h1>System Monitoring</h1>
                    <p className="text-secondary">Statistiques d'infrastructure en temps réel</p>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon"><Users size={24} /></div>
                        <div className="stat-info">
                            <h3>Utilisateurs</h3>
                            <div className="stat-value">{stats.users.total}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><FileCode size={24} /></div>
                        <div className="stat-info">
                            <h3>Fichiers</h3>
                            <div className="stat-value">{stats.storage.total_files}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><HardDrive size={24} /></div>
                        <div className="stat-info">
                            <h3>Volume Stockage</h3>
                            <div className="stat-value">{stats.storage.total_size_mb} MB</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><Activity size={24} /></div>
                        <div className="stat-info">
                            <h3>Santé API</h3>
                            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.system.status.toUpperCase()}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-section">
                <h2><Database size={20} /> Vue Physique du Stockage</h2>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Email (Masqué)</th>
                                <th>ID Fichier</th>
                                <th>Size</th>
                                <th>SHA-256 Hash du Blob Chiffré</th>
                                <th>Date Upload</th>
                            </tr>
                        </thead>
                        <tbody>
                            {storage.map((file) => (
                                <tr key={file.file_id}>
                                    <td>{file.user_id}</td>
                                    <td><code>{file.file_id}</code></td>
                                    <td>{formatSize(file.size_bytes)}</td>
                                    <td className="hash-cell"><code>{file.sha256_hash}</code></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Clock size={14} />
                                            {new Date(file.created_at).toLocaleString()}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {storage.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                                        Aucun fichier physique détecté sur le serveur.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="admin-section">
                <h2><ShieldCheck size={20} /> Rapport d'Intégrité</h2>
                <p className="text-secondary" style={{ marginBottom: '20px' }}>
                    Le serveur stocke uniquement des blobs binaires.
                    L'absence de métadonnées lisibles (en dehors du nom chiffré) garantit le Zero-Knowledge.
                </p>
                <button className="submit-btn" style={{ width: 'auto', padding: '12px 24px' }} onClick={fetchData}>
                    <RefreshCcw size={16} /> Re-scanner le stockage
                </button>
            </div>
        </div>
    );
}
