/**
 * =============================================================================
 * VEIL - Liste des Fichiers
 * =============================================================================
 * 
 * Affiche tous les fichiers chiffrés de l'utilisateur.
 * Permet de télécharger (déchiffrer) ou supprimer.
 * 
 * =============================================================================
 */

import { useEffect } from 'react';
import { useFileStore } from '../store/fileStore';
import {
    FileText,
    Download,
    Trash2,
    Loader2,
    FileImage,
    FileVideo,
    FileAudio,
    File,
    Lock
} from 'lucide-react';

/**
 * Retourne l'icône appropriée selon le type de fichier
 */
function getFileIcon(fileName: string) {
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
        return <FileImage size={24} />;
    }
    if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext || '')) {
        return <FileVideo size={24} />;
    }
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext || '')) {
        return <FileAudio size={24} />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '')) {
        return <FileText size={24} />;
    }
    return <File size={24} />;
}

/**
 * Formate la taille du fichier
 */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formate la date
 */
function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function FileList() {
    const { files, isLoading, fetchFiles, downloadFile, deleteFile, error } = useFileStore();

    // Charger les fichiers au montage
    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    /**
     * Gestion du téléchargement (avec déchiffrement)
     */
    const handleDownload = async (fileId: string, fileName: string) => {
        console.log(`📥 Téléchargement de ${fileName}...`);
        await downloadFile(fileId);
    };

    /**
     * Gestion de la suppression
     */
    const handleDelete = async (fileId: string, fileName: string) => {
        if (confirm(`Supprimer "${fileName}" ?\n\nCette action est irréversible.`)) {
            await deleteFile(fileId);
        }
    };

    // État de chargement
    if (isLoading && files.length === 0) {
        return (
            <div className="file-list-loading">
                <Loader2 className="spinner" size={32} />
                <p>Chargement des fichiers...</p>
            </div>
        );
    }

    // Aucun fichier
    if (files.length === 0) {
        return (
            <div className="file-list-empty">
                <Lock size={48} />
                <h3>Aucun fichier</h3>
                <p>Uploadez votre premier fichier - il sera chiffré automatiquement !</p>
            </div>
        );
    }

    return (
        <div className="file-list">
            {error && (
                <div className="error-banner">
                    {error}
                </div>
            )}

            <div className="file-grid">
                {files.map((file) => (
                    <div key={file.id} className="file-card">
                        <div className="file-icon">
                            {getFileIcon(file.name)}
                            <div className="encrypted-badge" title="Fichier chiffré">
                                🔒
                            </div>
                        </div>

                        <div className="file-info">
                            <h4 title={file.name}>{file.name}</h4>
                            <span className="file-size">{formatFileSize(file.size)}</span>
                            <span className="file-date">{formatDate(file.created_at)}</span>
                        </div>

                        <div className="file-actions">
                            <button
                                className="action-btn download"
                                onClick={() => handleDownload(file.id, file.name)}
                                title="Télécharger (déchiffrer)"
                                disabled={isLoading}
                            >
                                <Download size={18} />
                            </button>
                            <button
                                className="action-btn delete"
                                onClick={() => handleDelete(file.id, file.name)}
                                title="Supprimer"
                                disabled={isLoading}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
