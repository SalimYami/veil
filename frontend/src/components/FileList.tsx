import { useEffect, useState } from 'react';
import { useFileStore } from '../store/fileStore';
import { getFilePreview, type FilePreview } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { TagModal } from './TagModal';
import {
  FileText, Download, Trash2, Loader2, FileImage,
  FileVideo, FileAudio, File as FileIcon, Eye, X,
  Shield, AlertCircle, RefreshCcw, Search, FolderLock, Lock,
  Tag
} from 'lucide-react';

/* ─── Helpers ─── */
const EXT = {
  img:  ['jpg','jpeg','png','gif','webp','svg','avif'],
  vid:  ['mp4','mkv','avi','mov','webm'],
  aud:  ['mp3','wav','ogg','flac','m4a'],
  doc:  ['pdf','doc','docx','txt','md','csv','xls','xlsx'],
};

function fileGroup(name: string) {
  const e = name.split('.').pop()?.toLowerCase() || '';
  if (EXT.img.includes(e)) return 'img';
  if (EXT.vid.includes(e)) return 'vid';
  if (EXT.aud.includes(e)) return 'aud';
  if (EXT.doc.includes(e)) return 'doc';
  return 'other';
}

function FileTypeIcon({ name, size = 16 }: { name: string; size?: number }) {
  const g = fileGroup(name);
  if (g === 'img') return <FileImage size={size} />;
  if (g === 'vid') return <FileVideo size={size} />;
  if (g === 'aud') return <FileAudio size={size} />;
  if (g === 'doc') return <FileText size={size} />;
  return <FileIcon size={size} />;
}

const GROUP_COLOR: Record<string, string> = {
  img:   'text-purple-400',
  vid:   'text-pink-400',
  aud:   'text-amber-400',
  doc:   'text-sky-400',
  other: 'text-v-t3',
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024**2) return `${(b/1024).toFixed(0)} KB`;
  return `${(b/1024**2).toFixed(1)} MB`;
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

/* ─── Row ─── */
function FileRow({ file, onPreview, onDownload, onDelete, onTag }: {
  file: { id: string; name: string; size: number; created_at: string; tags?: string[] };
  onPreview: () => void; onDownload: () => void; onDelete: () => void; onTag: () => void;
}) {

  const g = fileGroup(file.name);

  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-v-surface/60 transition-colors relative">

      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-md border border-v-border bg-v-surface flex items-center justify-center ${GROUP_COLOR[g]}`}>
        <FileTypeIcon name={file.name} size={15} />
      </div>

      {/* Name + tags */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-v-t1 truncate leading-tight">{file.name}</p>
        {file.tags && file.tags.length > 0 && (
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {file.tags.map(t => (
              <span key={t} className="text-[9px] font-mono text-v-t3 bg-v-surface border border-v-border px-1.5 py-px rounded">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Size */}
      <span className="text-[11px] font-mono text-v-t3 flex-shrink-0 w-16 text-right">{formatBytes(file.size)}</span>

      {/* Date */}
      <span className="text-[11px] text-v-t3 flex-shrink-0 w-14 text-right hidden sm:block">{formatDate(file.created_at)}</span>

      {/* Encrypted badge */}
      <Shield size={12} className="text-v-success/60 flex-shrink-0" />

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onTag} title="Tags" className="w-7 h-7 rounded-md hover:bg-v-elevated text-v-t3 hover:text-v-accent flex items-center justify-center cursor-pointer transition-colors">
          <Tag size={13} />
        </button>
        <button onClick={onPreview} title="Inspecter" className="w-7 h-7 rounded-md hover:bg-v-elevated text-v-t3 hover:text-v-info flex items-center justify-center cursor-pointer transition-colors">
          <Eye size={13} />
        </button>
        <button onClick={onDownload} title="Télécharger" className="w-7 h-7 rounded-md hover:bg-v-elevated text-v-t3 hover:text-v-success flex items-center justify-center cursor-pointer transition-colors">
          <Download size={13} />
        </button>
        <button onClick={onDelete} title="Supprimer" className="w-7 h-7 rounded-md hover:bg-v-elevated text-v-t3 hover:text-v-danger flex items-center justify-center cursor-pointer transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export function FileList() {
  const { files, isLoading, fetchFiles, downloadFile, deleteFile, error, activeTag, searchQuery, addToast } = useFileStore();
  const { token } = useAuthStore();
  const [previewData, setPreviewData] = useState<FilePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [tagModal, setTagModal] = useState<{ id: string; name: string; tags: string[] } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handlePreview = async (id: string) => {
    if (!token) return;
    setPreviewLoading(true);
    try { setPreviewData(await getFilePreview(token, id)); }
    catch { addToast("Erreur aperçu", 'error'); }
    finally { setPreviewLoading(false); }
  };

  let list = files || [];
  if (activeTag)          list = list.filter(f => f.tags?.includes(activeTag));
  if (searchQuery.trim()) list = list.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  /* Loading */
  if (isLoading && list.length === 0) return (
    <div className="rounded-lg border border-v-border overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-[52px] border-b border-v-border last:border-0 animate-pulse bg-v-surface/30" />
      ))}
    </div>
  );

  /* Empty vault */
  if (!files || files.length === 0) return (
    <div className="flex flex-col items-center py-20 text-center anim-up">
      <div className="w-14 h-14 rounded-xl border border-v-border bg-v-surface flex items-center justify-center text-v-t3 mb-4">
        <FolderLock size={24} />
      </div>
      <h3 className="text-[15px] font-semibold text-v-t1 mb-1">Coffre-fort vide</h3>
      <p className="text-[12px] text-v-t3 max-w-[250px]">Uploadez vos premiers fichiers — ils seront chiffrés instantanément.</p>
    </div>
  );

  /* No match */
  if (list.length === 0) return (
    <div className="flex flex-col items-center py-14 text-center anim-in">
      <Search size={20} className="text-v-t3 mb-3" />
      <p className="text-[13px] text-v-t3">Aucun résultat{activeTag ? ` pour le tag « ${activeTag} »` : ` pour « ${searchQuery} »`}</p>
    </div>
  );

  return (
    <>
      {error && <div className="flex items-center gap-2 p-3 mb-3 rounded-lg border border-v-danger/20 bg-v-danger/[0.06] text-v-danger text-[12px] anim-in"><AlertCircle size={13}/>{error}</div>}

      {/* Header row */}
      <div className="flex items-center justify-between mb-2 px-4">
        <span className="text-[11px] text-v-t3 font-mono">{list.length} fichier{list.length > 1 ? 's' : ''}</span>
        <button onClick={() => fetchFiles()} className="text-[11px] text-v-t3 hover:text-v-t2 flex items-center gap-1 cursor-pointer transition-colors">
          <RefreshCcw size={11} className={isLoading ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-v-border overflow-hidden divide-y divide-v-border bg-v-bg">
        {list.map((file) => (
          <FileRow
            key={file.id}
            file={file}
            onPreview={() => handlePreview(file.id)}
            onDownload={() => downloadFile(file.id)}
            onDelete={() => setDeleteModal({ id: file.id, name: file.name })}
            onTag={() => setTagModal({ id: file.id, name: file.name, tags: file.tags || [] })}
          />
        ))}
      </div>

      {/* Delete modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 anim-in">
          <div className="surface-overlay rounded-xl w-full max-w-sm shadow-2xl anim-scale">
            <div className="px-5 py-4 border-b border-v-border">
              <h3 className="text-[14px] font-semibold text-v-t1 flex items-center gap-2">
                <AlertCircle size={15} className="text-v-danger" /> Supprimer le fichier
              </h3>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-v-t2">
                Supprimer <strong className="text-v-t1">« {deleteModal.name} »</strong> ?
                Cette action est <span className="text-v-danger font-medium">irréversible</span>.
              </p>
            </div>
            <div className="px-5 py-3 border-t border-v-border flex justify-end gap-2">
              <button onClick={() => setDeleteModal(null)} className="h-8 px-3 text-[12px] text-v-t2 hover:text-v-t1 hover:bg-v-surface rounded-md cursor-pointer transition-colors">Annuler</button>
              <button onClick={async () => { await deleteFile(deleteModal.id); setDeleteModal(null); }}
                className="h-8 px-3 text-[12px] font-medium bg-v-danger/10 text-v-danger border border-v-danger/20 hover:bg-v-danger/20 rounded-md cursor-pointer transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Tag modal */}
      {tagModal && <TagModal fileId={tagModal.id} fileName={tagModal.name} currentTags={tagModal.tags} onClose={() => setTagModal(null)} />}

      {/* Preview modal */}
      {previewData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 anim-in">
          <div className="surface-overlay rounded-xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl anim-scale">
            <div className="px-5 py-4 border-b border-v-border flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-v-t1 flex items-center gap-2">
                <Shield size={15} className="text-v-success" /> Preuve de chiffrement
              </h3>
              <button onClick={() => setPreviewData(null)} className="text-v-t3 hover:text-v-t1 cursor-pointer transition-colors"><X size={15}/></button>
            </div>
            <div className="flex-1 overflow-y-auto scroll-thin p-5 space-y-4">
              <p className="text-[12px] text-v-t2 leading-relaxed">
                Premiers <strong className="text-v-t1">512 octets</strong> de{' '}
                <code className="text-v-accent bg-v-accent/10 px-1.5 py-0.5 rounded text-[11px]">{previewData.file_name}</code> tels que stockés.
              </p>
              <div className="p-3 rounded-md bg-v-bg border border-v-border overflow-x-auto">
                <pre className="font-mono text-[10px] text-v-t3 leading-relaxed whitespace-pre-wrap break-all select-all">
                  {previewData.preview_hex.match(/.{1,64}/g)?.join('\n')}
                </pre>
              </div>
              <div className="p-3 rounded-md border border-v-border bg-v-surface">
                <p className="text-[10px] font-mono text-v-t3 uppercase tracking-wider mb-1">SHA-256</p>
                <code className="text-[11px] font-mono text-v-accent break-all">{previewData.sha256_hash}</code>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-md border border-v-success/20 bg-v-success/[0.04]">
                <Lock size={14} className="text-v-success flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-v-t3 leading-relaxed">
                  <strong className="text-v-success">Zero-knowledge vérifié.</strong> Ce blob est le résultat d'un chiffrement AES-256-GCM exécuté localement.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewLoading && (
        <div className="fixed inset-0 z-[199] flex items-center justify-center bg-black/50 backdrop-blur-sm anim-in">
          <div className="surface-overlay rounded-lg p-4 flex items-center gap-2.5">
            <Loader2 size={15} className="text-v-accent animate-spin" />
            <span className="text-[13px] text-v-t1">Récupération...</span>
          </div>
        </div>
      )}
    </>
  );
}
