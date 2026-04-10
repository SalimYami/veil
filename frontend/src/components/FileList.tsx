import { useEffect, useState } from 'react';
import { useFileStore } from '../store/fileStore';
import { getFilePreview, type FilePreview } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { TagModal } from './TagModal';
import {
    FileText, Download, Trash2, Loader2, FileImage,
    FileVideo, FileAudio, File as FileIcon, Lock, Eye, X, Shield, Tag
} from 'lucide-react';

function getFileIcon(fileName: string) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return <FileImage size={24} />;
    if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext || '')) return <FileVideo size={24} />;
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext || '')) return <FileAudio size={24} />;
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '')) return <FileText size={24} />;
    return <FileIcon size={24} />;
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
        } catch {
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

    let displayedFiles = files;
    if (activeTag) {
        displayedFiles = displayedFiles.filter(f => f.tags?.includes(activeTag));
    }
    if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        displayedFiles = displayedFiles.filter(f => f.name.toLowerCase().includes(q));
    }

    if (isLoading && (!files || files.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-vault-text-muted gap-4 animate-[fadeIn_0.5s_ease-out]">
                <Loader2 className="animate-spin text-vault-primary" size={36} />
                <p className="font-medium text-white/80">Chargement du coffre-fort...</p>
            </div>
        );
    }

    if (!files || files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-16 text-vault-text-muted text-center animate-[fadeInUp_0.5s_ease-out]">
                <div className="w-20 h-20 mb-6 bg-vault-bg-tertiary rounded-full flex items-center justify-center text-vault-text-secondary border border-white/5 shadow-inner">
                    <Lock size={36} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Coffre-fort vide</h3>
                <p className="text-sm max-w-xs leading-relaxed">Vos documents chiffrés et sécurisés apparaîtront ici.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-4 relative">
            {error && (
                <div className="px-4 py-3 bg-vault-error/10 border border-vault-error/30 text-vault-error rounded-xl text-sm font-medium flex items-center gap-2 animate-[fadeIn_0.3s_ease-out]">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {displayedFiles.length === 0 && (activeTag || searchQuery) && (
                <div className="flex flex-col items-center justify-center p-12 text-vault-text-muted text-center bg-vault-bg-tertiary/30 rounded-2xl border border-white/5 animate-[fadeIn_0.3s_ease-out]">
                    <Lock size={36} className="mb-4 text-vault-text-secondary opacity-50" />
                    <h3 className="text-lg font-semibold text-white/90 mb-1">Aucun fichier trouvé</h3>
                    <p className="text-sm">{activeTag ? `Aucun fichier avec le tag "${activeTag}"` : `Aucun résultat pour "${searchQuery}"`}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max overflow-y-auto custom-scrollbar p-1">
                {displayedFiles.map((file, index) => (
                    <div
                        key={file.id}
                        className="group flex flex-col bg-vault-bg-secondary/80 hover:bg-vault-bg-tertiary border border-white/10 hover:border-vault-primary/40 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.15)] animate-[fadeInUp_0.4s_ease-out_forwards] opacity-0"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="flex items-start gap-4 mb-3">
                            <div className="relative w-12 h-12 flex-shrink-0 bg-vault-bg-primary rounded-xl flex items-center justify-center text-vault-primary border border-white/5 group-hover:border-vault-primary/30 transition-colors shadow-inner">
                                {getFileIcon(file.name)}
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-vault-bg-secondary rounded-full flex items-center justify-center shadow-md pb-[1px]" title="Chiffré AES-256-GCM">
                                    <Shield size={10} className="text-vault-success" />
                                </div>
                            </div>
                            
                            <div className="flex-1 min-w-0 pt-0.5">
                                <h4 className="font-semibold text-white/95 text-sm truncate w-full group-hover:text-vault-primary transition-colors" title={file.name}>
                                    {file.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-xs text-vault-text-muted font-mono bg-vault-bg-primary/50 self-start px-2 py-0.5 rounded-md inline-flex border border-white/5">
                                    <span className="text-vault-secondary">{formatFileSize(file.size)}</span>
                                    <span className="opacity-50">•</span>
                                    <span>{formatDate(file.created_at)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center flex-wrap gap-1.5 mb-4 min-h-[22px]">
                            {file.tags && file.tags.length > 0 ? (
                                file.tags.map(tag => (
                                    <span key={tag} className="px-2 py-0.5 text-[0.65rem] font-medium font-mono uppercase tracking-wider text-vault-text-secondary bg-white/5 border border-white/10 rounded-md">
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-[0.7rem] text-vault-text-muted/50 italic px-1">Aucun tag</span>
                            )}
                        </div>

                        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                                className="flex-1 flex items-center justify-center gap-1.5 p-2 text-vault-text-secondary hover:text-white hover:bg-white/10 rounded-lg text-xs font-medium transition-colors"
                                onClick={() => setTagModalFile({ id: file.id, name: file.name, tags: file.tags || [] })}
                                title="Gérer les tags"
                                disabled={isLoading}
                            >
                                <Tag size={14} /> <span className="hidden sm:inline">Tags</span>
                            </button>
                            <button
                                className="flex-1 flex items-center justify-center gap-1.5 p-2 text-vault-text-secondary hover:text-vault-primary hover:bg-vault-primary/10 rounded-lg text-xs font-medium transition-colors"
                                onClick={() => handleShowPreview(file.id)}
                                title="Vérifier le chiffrement"
                                disabled={isLoading || isPreviewLoading}
                            >
                                <Eye size={14} /> <span className="hidden sm:inline">Inspect</span>
                            </button>
                            <button
                                className="flex-1 flex items-center justify-center p-2 text-vault-text-secondary hover:text-vault-success hover:bg-vault-success/10 rounded-lg transition-colors border border-transparent hover:border-vault-success/20"
                                onClick={() => handleDownload(file.id)}
                                title="Déchiffrer et télécharger"
                                disabled={isLoading}
                            >
                                <Download size={16} />
                            </button>
                            <button
                                className="flex-1 flex items-center justify-center p-2 text-vault-text-muted hover:text-vault-error hover:bg-vault-error/10 rounded-lg transition-colors"
                                onClick={() => handleDelete(file.id, file.name)}
                                title="Supprimer définitivement"
                                disabled={isLoading}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-vault-bg-primary/80 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-vault-bg-secondary border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-[scaleIn_0.2s_ease-out]">
                        <div className="px-6 py-4 border-b border-white/5">
                            <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                                <AlertCircle className="text-vault-error" size={18} />
                                Confirmer la suppression
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-vault-text-secondary text-sm">
                                Supprimer définitivement <strong className="text-white">"{confirmDelete.name}"</strong> ? Cette action est irréversible.
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-vault-bg-tertiary flex justify-end gap-3 mt-2">
                            <button className="px-4 py-2 bg-transparent text-vault-text-secondary hover:text-white rounded-lg text-sm font-medium transition-colors" onClick={() => setConfirmDelete(null)}>Annuler</button>
                            <button
                                className="px-4 py-2 bg-vault-error/20 text-vault-error border border-vault-error/30 hover:bg-vault-error/40 rounded-lg text-sm font-medium transition-colors"
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
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-vault-bg-primary/80 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-vault-bg-secondary border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-[scaleIn_0.2s_ease-out]">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-vault-bg-tertiary">
                            <h3 className="font-semibold text-lg flex items-center gap-2 text-white">
                                <Shield size={18} className="text-vault-success" />
                                Preuve de Chiffrement ZK
                            </h3>
                            <button className="p-1.5 text-vault-text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors" onClick={() => setPreviewData(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-6">
                            <p className="text-vault-text-secondary text-sm leading-relaxed">
                                Voici les <strong className="text-white">512 premiers octets</strong> du fichier <code className="px-1.5 py-0.5 bg-black/30 rounded text-vault-primary font-mono text-xs">{previewData.file_name}</code> tels qu'ils sont stockés sur les serveurs.
                                Sans votre mot de passe, ces données sont <span className="text-vault-error font-medium">strictement indéchiffrables</span>.
                            </p>

                            <div className="bg-black/50 border border-white/5 rounded-xl p-4 overflow-x-auto shadow-inner">
                                <pre className="font-mono text-[0.7rem] leading-relaxed text-vault-text-muted whitespace-pre-wrap break-all selection:bg-vault-primary/30">
                                    {previewData.preview_hex.match(/.{1,64}/g)?.join('\n') || previewData.preview_hex}
                                </pre>
                            </div>

                            <div className="flex flex-col gap-2 p-4 bg-vault-bg-tertiary rounded-xl border border-white/5">
                                <strong className="text-sm text-white/90">Signature SHA-256 du Blob:</strong>
                                <div className="font-mono text-xs p-2 bg-black/30 rounded-lg text-vault-secondary break-all border border-vault-secondary/10">
                                    {previewData.sha256_hash}
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 mt-2 bg-vault-success/5 border border-vault-success/20 rounded-xl">
                                <div className="p-2 bg-vault-success/10 rounded-lg text-vault-success shrink-0">
                                    <Lock size={20} />
                                </div>
                                <div>
                                    <strong className="text-sm text-vault-success block mb-1">Architecture Security-First</strong>
                                    <p className="text-xs text-vault-text-secondary leading-relaxed">Ce blob est le résultat direct de l'algorithme AES-256-GCM exécuté localement dans votre RAM avant expédition sur le réseau.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
