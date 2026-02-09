import { useEffect, useState } from 'react';
import { useFileStore } from '../store/fileStore';
import { getFilePreview, type FilePreview } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import {
    FileText,
    Download,
    Trash2,
    Loader2,
    FileImage,
    FileVideo,
    FileAudio,
    File,
    Lock,
    Eye,
    X,
    Shield
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
        year: 'numeric'
    });
}

export function FileList() {
    const { files, isLoading, fetchFiles, downloadFile, deleteFile, error } = useFileStore();
    const { token } = useAuthStore();

    // État pour la preview
    const [previewData, setPreviewData] = useState<FilePreview | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

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
     * Gestion de la preview chiffrée
     */
    const handleShowPreview = async (fileId: string) => {
        if (!token) return;
        setIsPreviewLoading(true);
        try {
            const data = await getFilePreview(token, fileId);
            setPreviewData(data);
        } catch (err) {
            console.error("Erreur preview:", err);
            alert("Erreur lors de la récupération de l'aperçu chiffré");
        } finally {
            setIsPreviewLoading(false);
        }
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
                <p>Chargement du coffre...</p>
            </div>
        );
    }

    // Aucun fichier
    if (files.length === 0) {
        return (
            <div className="file-list-empty">
                <Lock size={48} />
                <h3>Coffre-fort vide</h3>
                <p>Vos documents sécurisés apparaîtront ici.</p>
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
                            <div className="encrypted-badge" title="Chiffré AES-256-GCM">
                                <Shield size={10} color="var(--success)" />
                            </div>
                        </div>

                        <div className="file-info">
                            <h4 title={file.name} className="file-name">{file.name}</h4>
                            <div className="file-meta">
                                <span className="file-size">{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <span className="file-date">{formatDate(file.created_at)}</span>
                            </div>
                        </div>

                        <div className="file-actions">
                            <button
                                className="action-btn"
                                onClick={() => handleShowPreview(file.id)}
                                title="Vérifier le chiffrement (Aperçu hex)"
                                disabled={isLoading || isPreviewLoading}
                            >
                                <Eye size={18} />
                            </button>
                            <button
                                className="action-btn download"
                                onClick={() => handleDownload(file.id, file.name)}
                                title="Déchiffrer et télécharger"
                                disabled={isLoading}
                            >
                                <Download size={18} />
                            </button>
                            <button
                                className="action-btn delete"
                                onClick={() => handleDelete(file.id, file.name)}
                                title="Supprimer définitivement"
                                disabled={isLoading}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Preview Chiffrée */}
            {previewData && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Shield size={20} color="var(--success)" />
                                Preuve de Chiffrement (Zero-Knowledge)
                            </h3>
                            <button className="close-modal" onClick={() => setPreviewData(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="text-secondary" style={{ marginBottom: '15px' }}>
                                Voici les <strong>512 premiers octets</strong> du fichier <code>{previewData.file_name}</code> tels qu'ils sont stockés sur nos serveurs.
                                Sans votre mot de passe, ces données sont strictement indéchiffrables.
                            </p>

                            <div className="preview-hex">
                                {previewData.preview_hex.match(/.{1,64}/g)?.join('\n')}
                            </div>

                            <div className="preview-hash">
                                <strong>SHA-256 du Blob:</strong>
                                <span className="hash-cell"><code>{previewData.sha256_hash}</code></span>
                            </div>

                            <div className="zk-info" style={{ marginTop: '24px', marginBottom: 0 }}>
                                <Lock size={20} />
                                <div>
                                    <strong>Architecture Security-First</strong>
                                    <p>Ce que vous voyez ci-dessus est le résultat de l'algorithme AES-256-GCM exécuté localement dans votre navigateur avant l'envoi.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

