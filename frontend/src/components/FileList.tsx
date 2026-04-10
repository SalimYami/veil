import { useEffect, useState } from 'react';
import { useFileStore } from '../store/fileStore';
import { getFilePreview, type FilePreview } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { TagModal } from './TagModal';
import {
  FileText, Download, Trash2, Loader2, FileImage,
  FileVideo, FileAudio, File as FileIcon, Lock, Eye, X,
  Shield, Tag, AlertCircle, RefreshCcw, Search
} from 'lucide-react';

/* ─── Helpers ─── */

function getFileExt(name: string) {
  return name.split('.').pop()?.toLowerCase() || '';
}

function getFileIcon(name: string) {
  const ext = getFileExt(name);
  const cls = 'opacity-80';
  if (['jpg','jpeg','png','gif','webp','svg','avif'].includes(ext)) return <FileImage size={20} className={cls} />;
  if (['mp4','mkv','avi','mov','webm'].includes(ext))              return <FileVideo  size={20} className={cls} />;
  if (['mp3','wav','ogg','flac','m4a'].includes(ext))              return <FileAudio  size={20} className={cls} />;
  if (['pdf','doc','docx','txt','md','csv'].includes(ext))         return <FileText   size={20} className={cls} />;
  return <FileIcon size={20} className={cls} />;
}

function getFileColor(name: string): string {
  const ext = getFileExt(name);
  if (['jpg','jpeg','png','gif','webp','svg','avif'].includes(ext)) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
  if (['mp4','mkv','avi','mov','webm'].includes(ext))              return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
  if (['mp3','wav','ogg','flac','m4a'].includes(ext))              return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (['pdf','doc','docx','txt','md','csv'].includes(ext))         return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
  return 'text-v-t2 bg-white/5 border-white/10';
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── Component ─── */

export function FileList() {
  const { files, isLoading, fetchFiles, downloadFile, deleteFile, error, activeTag, searchQuery, addToast } = useFileStore();
  const { token } = useAuthStore();

  const [previewData, setPreviewData]   = useState<FilePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [tagModalFile, setTagModalFile] = useState<{ id: string; name: string; tags: string[] } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleDownload = (id: string) => downloadFile(id);

  const handlePreview = async (id: string) => {
    if (!token) return;
    setPreviewLoading(true);
    try {
      const data = await getFilePreview(token, id);
      setPreviewData(data);
    } catch {
      addToast("Erreur lors de la récupération de l'aperçu chiffré", 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  /* Filter */
  let displayed = files || [];
  if (activeTag)            displayed = displayed.filter(f => f.tags?.includes(activeTag));
  if (searchQuery.trim())   displayed = displayed.filter(f => f.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));

  /* ── Loading skeleton ── */
  if (isLoading && (!files || files.length === 0)) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] animate-pulse" />
        ))}
      </div>
    );
  }

  /* ── Empty vault ── */
  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-up">
        <div className="w-20 h-20 rounded-3xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] flex items-center justify-center mb-5">
          <Lock size={32} className="text-v-t3" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">Coffre-fort vide</h3>
        <p className="text-v-t3 text-sm max-w-xs leading-relaxed">
          Uploadez vos premiers fichiers — ils seront chiffrés localement avant d'être stockés.
        </p>
      </div>
    );
  }

  /* ── No results ── */
  if (displayed.length === 0 && (activeTag || searchQuery)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        <Search size={32} className="text-v-t3 mb-4" />
        <h3 className="text-v-t1 font-semibold mb-1">Aucun fichier trouvé</h3>
        <p className="text-v-t3 text-sm">
          {activeTag ? `Aucun fichier avec le tag « ${activeTag} »` : `Aucun résultat pour « ${searchQuery} »`}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-v-danger/25 bg-v-danger/8 text-v-danger text-sm animate-fade-in">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Count bar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-v-t3 font-mono">{displayed.length} fichier{displayed.length > 1 ? 's' : ''}{(activeTag || searchQuery) ? ' filtrés' : ''}</span>
        <button
          onClick={() => fetchFiles()}
          className="flex items-center gap-1.5 text-xs text-v-t3 hover:text-v-t2 transition-colors cursor-pointer"
          title="Rafraîchir"
        >
          <RefreshCcw size={12} />
          Actualiser
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {displayed.map((file, index) => {
          const iconColor = getFileColor(file.name);
          const isHov = hovered === file.id;
          return (
            <div
              key={file.id}
              className={`group relative flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden
                ${isHov
                  ? 'border-v-accent/30 bg-[rgba(99,102,241,0.05)] shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(99,102,241,0.15)]'
                  : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.1)]'
                }`}
              style={{ animationDelay: `${index * 0.04}s` }}
              onMouseEnter={() => setHovered(file.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Card body */}
              <div className="p-4 flex flex-col gap-3 flex-1">
                {/* Icon + name */}
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${iconColor}`}>
                    {getFileIcon(file.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-v-t1 truncate leading-tight" title={file.name}>
                      {file.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-mono text-v-accent bg-v-accent/10 px-1.5 py-0.5 rounded border border-v-accent/15">
                        {formatSize(file.size)}
                      </span>
                      <span className="text-[10px] text-v-t3">{formatDate(file.created_at)}</span>
                    </div>
                  </div>
                  {/* Shield badge */}
                  <div className="flex-shrink-0" title="Chiffré AES-256-GCM">
                    <Shield size={13} className="text-v-success opacity-80" />
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center flex-wrap gap-1 min-h-[20px]">
                  {file.tags && file.tags.length > 0 ? (
                    file.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-v-t3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-md"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-v-t3 italic">Aucun tag</span>
                  )}
                </div>
              </div>

              {/* Actions footer */}
              <div className={`px-3 py-2.5 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between gap-1 transition-opacity duration-200 ${isHov ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                {[
                  {
                    icon: <Tag size={13} />,
                    label: 'Tags',
                    color: 'hover:text-v-accent hover:bg-v-accent/10',
                    action: () => setTagModalFile({ id: file.id, name: file.name, tags: file.tags || [] }),
                    title: 'Gérer les tags',
                  },
                  {
                    icon: <Eye size={13} />,
                    label: 'Inspect',
                    color: 'hover:text-v-info hover:bg-v-info/10',
                    action: () => handlePreview(file.id),
                    title: 'Vérifier le chiffrement',
                    disabled: previewLoading,
                  },
                  {
                    icon: <Download size={13} />,
                    label: 'Download',
                    color: 'hover:text-v-success hover:bg-v-success/10',
                    action: () => handleDownload(file.id),
                    title: 'Déchiffrer et télécharger',
                  },
                  {
                    icon: <Trash2 size={13} />,
                    label: 'Suppr.',
                    color: 'hover:text-v-danger hover:bg-v-danger/10',
                    action: () => setConfirmDelete({ id: file.id, name: file.name }),
                    title: 'Supprimer définitivement',
                  },
                ].map((btn) => (
                  <button
                    key={btn.title}
                    onClick={btn.action}
                    disabled={isLoading || btn.disabled}
                    title={btn.title}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium text-v-t3 transition-all cursor-pointer disabled:opacity-40 ${btn.color}`}
                  >
                    {btn.icon}
                    <span className="hidden sm:inline">{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Delete confirm modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-heavy rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h3 className="font-semibold text-base text-white flex items-center gap-2">
                <AlertCircle size={16} className="text-v-danger" />
                Confirmer la suppression
              </h3>
            </div>
            <div className="p-6">
              <p className="text-v-t2 text-sm leading-relaxed">
                Supprimer définitivement{' '}
                <strong className="text-white">"{confirmDelete.name}"</strong> ?
                {' '}Cette action est <span className="text-v-danger font-medium">irréversible</span>.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.05)] flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-v-t2 hover:text-v-t1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={async () => { await deleteFile(confirmDelete.id); setConfirmDelete(null); }}
                className="px-4 py-2 text-sm font-semibold bg-v-danger/15 text-v-danger border border-v-danger/30 hover:bg-v-danger/25 rounded-lg transition-colors cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tag modal ── */}
      {tagModalFile && (
        <TagModal
          fileId={tagModalFile.id}
          fileName={tagModalFile.name}
          currentTags={tagModalFile.tags}
          onClose={() => setTagModalFile(null)}
        />
      )}

      {/* ── Preview modal ── */}
      {previewData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-heavy rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between bg-[rgba(34,197,94,0.05)]">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-v-success" />
                <h3 className="font-semibold text-white">Preuve de Chiffrement ZK</h3>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                className="p-1.5 rounded-lg text-v-t3 hover:text-v-t1 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scroll p-6 flex flex-col gap-5">
              <p className="text-v-t2 text-sm leading-relaxed">
                Voici les <strong className="text-white">512 premiers octets</strong> du fichier{' '}
                <code className="px-1.5 py-0.5 bg-black/30 rounded text-v-accent font-mono text-xs">{previewData.file_name}</code>{' '}
                tels qu'ils sont stockés sur les serveurs. Sans votre mot de passe, ces données sont{' '}
                <span className="text-v-danger font-medium">strictement indéchiffrables</span>.
              </p>

              {/* Hex preview */}
              <div className="bg-black/50 border border-[rgba(255,255,255,0.06)] rounded-xl p-4 overflow-x-auto">
                <pre className="font-mono text-[0.65rem] leading-relaxed text-v-t3 whitespace-pre-wrap break-all select-all">
                  {previewData.preview_hex.match(/.{1,64}/g)?.join('\n') || previewData.preview_hex}
                </pre>
              </div>

              {/* Hash */}
              <div className="flex flex-col gap-2 p-4 bg-[rgba(255,255,255,0.02)] rounded-xl border border-[rgba(255,255,255,0.05)]">
                <span className="text-xs font-semibold text-v-t2 font-mono uppercase tracking-wider">SHA-256 du blob chiffré</span>
                <code className="font-mono text-[11px] text-v-accent-2 break-all leading-relaxed">
                  {previewData.sha256_hash}
                </code>
              </div>

              {/* ZK proof banner */}
              <div className="flex items-start gap-3 p-4 bg-v-success/5 border border-v-success/15 rounded-xl">
                <Lock size={18} className="text-v-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-v-success mb-0.5">Architecture Security-First Validée</p>
                  <p className="text-xs text-v-t3 leading-relaxed">
                    Ce blob est le résultat de l'algorithme AES-256-GCM exécuté localement dans votre RAM.
                    Le serveur n'a jamais eu accès à votre clé ou au contenu original.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview loading overlay */}
      {previewLoading && (
        <div className="fixed inset-0 z-[199] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl p-6 flex items-center gap-3">
            <Loader2 size={20} className="text-v-accent animate-spin" />
            <span className="text-v-t1 text-sm font-medium">Récupération du blob chiffré...</span>
          </div>
        </div>
      )}
    </div>
  );
}
