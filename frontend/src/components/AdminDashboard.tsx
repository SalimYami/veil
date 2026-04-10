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
    ArrowLeft,
    CheckCircle2
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError("Erreur lors de la récupération des données admin");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024);
        return mb.toFixed(2) + " MB";
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full p-8">
                <RefreshCcw className="text-vault-primary animate-spin mb-4" size={48} />
                <p className="text-vault-text-secondary font-medium animate-pulse">Initialisation du terminal admin...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 animate-[fadeIn_0.4s_ease-out]">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col gap-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-vault-text-secondary hover:text-white hover:bg-white/10 transition-colors" title="Retour">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono font-medium tracking-wider uppercase mb-3">
                            <ShieldCheck size={12} />
                            Root Access
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">System Monitoring</h1>
                        <p className="text-vault-text-secondary mt-1">Statistiques d'infrastructure en temps réel</p>
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-vault-error/10 border border-vault-error/20 text-vault-error text-sm font-medium animate-[shake_0.5s_ease-in-out]">
                        {error}
                    </div>
                )}

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-5 rounded-2xl bg-vault-bg-secondary border border-white/5 shadow-lg group hover:border-vault-primary/30 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-vault-primary/10 rounded-full blur-2xl group-hover:bg-vault-primary/20 transition-all -translate-y-1/2 translate-x-1/2" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 bg-vault-primary/10 rounded-xl text-vault-primary border border-vault-primary/20">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-medium text-vault-text-muted uppercase tracking-wider">Utilisateurs</h3>
                                    <div className="text-2xl font-bold text-white mt-1 group-hover:text-vault-primary transition-colors">{stats.users.total}</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-vault-bg-secondary border border-white/5 shadow-lg group hover:border-vault-secondary/30 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-vault-secondary/10 rounded-full blur-2xl group-hover:bg-vault-secondary/20 transition-all -translate-y-1/2 translate-x-1/2" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 bg-vault-secondary/10 rounded-xl text-vault-secondary border border-vault-secondary/20">
                                    <FileCode size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-medium text-vault-text-muted uppercase tracking-wider">Fichiers</h3>
                                    <div className="text-2xl font-bold text-white mt-1 group-hover:text-vault-secondary transition-colors">{stats.storage.total_files}</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-vault-bg-secondary border border-white/5 shadow-lg group hover:border-vault-accent/30 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-vault-accent/10 rounded-full blur-2xl group-hover:bg-vault-accent/20 transition-all -translate-y-1/2 translate-x-1/2" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 bg-vault-accent/10 rounded-xl text-vault-accent border border-vault-accent/20">
                                    <HardDrive size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-medium text-vault-text-muted uppercase tracking-wider">Volume Stockage</h3>
                                    <div className="text-2xl font-bold text-white mt-1 group-hover:text-vault-accent transition-colors">{stats.storage.total_size_mb} MB</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-vault-bg-secondary border border-white/5 shadow-lg group hover:border-vault-success/30 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-vault-success/10 rounded-full blur-2xl group-hover:bg-vault-success/20 transition-all -translate-y-1/2 translate-x-1/2" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 bg-vault-success/10 rounded-xl text-vault-success border border-vault-success/20">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-medium text-vault-text-muted uppercase tracking-wider">Santé API</h3>
                                    <div className="text-xl font-bold text-vault-success flex items-center gap-2 mt-1">
                                        <CheckCircle2 size={18} />
                                        {stats.system.status.toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-vault-bg-secondary rounded-2xl border border-white/5 shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Database size={20} className="text-vault-primary" /> 
                                Vue Physique du Stockage
                            </h2>
                            <p className="text-sm text-vault-text-secondary mt-1">Inspection des blobs chiffrés sur le serveur</p>
                        </div>
                        <button 
                            className="flex items-center gap-2 px-4 py-2 bg-vault-bg-tertiary border border-white/10 hover:bg-white/10 text-white text-sm font-medium rounded-xl transition-colors group"
                            onClick={fetchData}
                        >
                            <RefreshCcw size={16} className="text-vault-primary group-active:animate-spin" />
                            Actualiser
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-vault-bg-tertiary/50 border-b border-white/5">
                                    <th className="p-4 text-xs font-medium text-vault-text-muted uppercase tracking-wider">Email (Masqué)</th>
                                    <th className="p-4 text-xs font-medium text-vault-text-muted uppercase tracking-wider">ID Fichier</th>
                                    <th className="p-4 text-xs font-medium text-vault-text-muted uppercase tracking-wider">Size</th>
                                    <th className="p-4 text-xs font-medium text-vault-text-muted uppercase tracking-wider">SHA-256 Hash</th>
                                    <th className="p-4 text-xs font-medium text-vault-text-muted uppercase tracking-wider">Date Upload</th>
                                </tr>
                            </thead>
                            <tbody>
                                {storage?.map((file) => (
                                    <tr key={file.file_id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 text-sm text-vault-text-secondary">{file.user_id}</td>
                                        <td className="p-4 text-sm text-white font-mono group cursor-help" title={file.file_id}>
                                            <span className="truncate block max-w-[150px] opacity-80">{file.file_id}</span>
                                        </td>
                                        <td className="p-4 text-sm text-vault-text-secondary font-mono">{formatSize(file.size_bytes)}</td>
                                        <td className="p-4 text-xs text-vault-secondary font-mono">
                                            <span className="px-2 py-1 bg-vault-secondary/10 rounded-md border border-vault-secondary/20">{file.sha256_hash.substring(0, 16)}...</span>
                                        </td>
                                        <td className="p-4 text-sm text-vault-text-secondary">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="opacity-50" />
                                                {new Date(file.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(!storage || storage.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-vault-text-muted italic">
                                            Aucun fichier physique détecté sur le serveur.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-vault-bg-tertiary border border-white/5 shadow-inner">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
                        <ShieldCheck size={20} className="text-vault-success" /> 
                        Garantie Zero-Knowledge
                    </h2>
                    <p className="text-sm text-vault-text-secondary leading-relaxed">
                        Le serveur stocke <strong>uniquement des blobs binaires opaques</strong> avec leurs identifiants aléatoires (UUIDs).
                        L'absence totale de métadonnées lisibles (en dehors de ce dashboard système) garantit qu'il est cryptographiquement impossible pour l'administrateur de lire le contenu ou les vrais noms des fichiers.
                    </p>
                </div>
            </div>
        </div>
    );
}
