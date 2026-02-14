import { useEffect, useState } from 'react';
import { useFileStore } from '../store/fileStore';
import { getFilePreview, type FilePreview } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { TagModal } from './TagModal';
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
    Shield,
    Tag
} from 'lucide-react';

function getFileIcon(fileName: string) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return <FileImage size={24} />;
    if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext || '')) return <FileVideo size={24} />;
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext || '')) return <FileAudio size={24} />;
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '')) return <FileText size={24} />;
    return <File size={24} />;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function FileList() {
    const { files, isLoading, fetchFiles, downloadFile, deleteFile, error, activeTag, searchQuery, addToast } = useFileStore();
    const { token } = useAuthStore();

    const [previewData, setPreviewData] = useState<FilePreview | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [tagModalFile, setTagModalFile] = useState<{ id: string; name: string; tags: string[] } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleDownload = async (fileId: string) => {
        await downloadFile(fileId);
    };

    const handleShowPreview = async (fileId: string) => {
        if (!token) return;
        setIsPreviewLoading(true);
        try {
            const data = await getFilePreview(token, fileId);
            setPreviewData(data);
        } catch (err) {
            addToast("Erreur lors de la récupération de l'aperçu chiffré", 'error');
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleDelete = (fileId: string, fileName: string) => {
        setConfirmDelete({ id: fileId, name: fileName });
    };

    const confirmDeleteAction = async () => {
        if (confirmDelete) {
            await deleteFile(confirmDelete.id);
            setConfirmDelete(null);
        }
    };

    // Filter files by active tag and search query
    let displayedFiles = files;
    if (activeTag) {
        displayedFiles = displayedFiles.filter(f => f.tags?.includes(activeTag));
    }
    if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        displayedFiles = displayedFiles.filter(f => f.name.toLowerCase().includes(q));
    }

    if (isLoading && files.length === 0) {
        return (
            <div className="file-list-loading">
                <Loader2 className="spinner" size={32} />
                <p>Chargement du coffre...</p>
            </div>
        );
    }

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
            {error && <div className="error-banner">{error}</div>}

            {displayedFiles.length === 0 && (activeTag || searchQuery) && (
                <div className="file-list-empty">
                    <Lock size={32} />
                    <h3>Aucun fichier trouvé</h3>
                    <p>{activeTag ? `Aucun fichier avec le tag "${activeTag}"` : `Aucun résultat pour "${searchQuery}"`}</p>
                </div>
            )}

            <div className="file-grid">
                {displayedFiles.map((file, index) => (
                    <div
                        key={file.id}
                        className="file-card"
                        data-file-id={file.id}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
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
                            {file.tags && file.tags.length > 0 && (
                                <div className="file-tags">
                                    {file.tags.map(tag => (
                                        <span key={tag} className="file-tag-pill">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="file-actions">
                            <button
                                className="action-btn"
                                onClick={() => setTagModalFile({ id: file.id, name: file.name, tags: file.tags || [] })}
                                title="Gérer les tags"
                                disabled={isLoading}
                            >
                                <Tag size={18} />
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => handleShowPreview(file.id)}
                                title="Vérifier le chiffrement"
                                disabled={isLoading || isPreviewLoading}
                            >
                                <Eye size={18} />
                            </button>
                            <button
                                className="action-btn download"
                                onClick={() => handleDownload(file.id)}
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

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="modal-content-minimal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-minimal">
                            <h3>Confirmer la suppression</h3>
                        </div>
                        <div className="modal-body-minimal">
                            <p>Supprimer <strong>"{confirmDelete.name}"</strong> ? Cette action est irréversible.</p>
                        </div>
                        <div className="modal-footer-minimal">
                            <button className="cancel-btn" onClick={() => setConfirmDelete(null)}>Annuler</button>
                            <button
                                className="submit-btn-minimal"
                                style={{ background: 'var(--error)' }}
                                onClick={confirmDeleteAction}
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tag Modal */}
            {tagModalFile && (
                <TagModal
                    fileId={tagModalFile.id}
                    fileName={tagModalFile.name}
                    currentTags={tagModalFile.tags}
                    onClose={() => setTagModalFile(null)}
                />
            )}

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
                                {previewData.preview_hex.match(/.{1,64}/g)?.join('\n') || previewData.preview_hex}
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
