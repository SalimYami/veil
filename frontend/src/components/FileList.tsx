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
  other: 'text-muted-foreground',
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
    <div className="group flex items-center gap-4 px-6 py-4 hover:bg-secondary/40 transition-all duration-300 relative border-b border-white/[0.02] last:border-0 rounded-xl hover:shadow-premium">

      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl border border-white/[0.04] bg-card/60 flex items-center justify-center ${GROUP_COLOR[g]} shadow-sm`}>
        <FileTypeIcon name={file.name} size={18} />
      </div>

      {/* Name + tags */}
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[14px] font-semibold text-foreground truncate">{file.name}</p>
        <div className="flex gap-2 mt-1.5 flex-wrap">
          {file.tags && file.tags.map(t => (
            <span key={t} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary/80 border border-border px-2 py-0.5 rounded-md">{t}</span>
          ))}
        </div>
      </div>

      {/* Size */}
      <span className="text-[12px] font-mono text-muted-foreground flex-shrink-0 w-20 text-right opacity-80">{formatBytes(file.size)}</span>

      {/* Date */}
      <span className="text-[12px] text-muted-foreground flex-shrink-0 w-20 text-right hidden sm:block opacity-80">{formatDate(file.created_at)}</span>

      {/* Encrypted badge */}
      <Shield size={14} className="text-emerald-500/80 flex-shrink-0 ml-4" />

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button onClick={onTag} title="Tags" className="w-8 h-8 rounded-lg hover:bg-secondary text-muted-foreground hover:text-accent flex items-center justify-center cursor-pointer transition-colors">
          <Tag size={15} />
        </button>
        <button onClick={onPreview} title="Inspecter" className="w-8 h-8 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary flex items-center justify-center cursor-pointer transition-colors">
          <Eye size={15} />
        </button>
        <button onClick={onDownload} title="Télécharger" className="w-8 h-8 rounded-lg hover:bg-secondary text-muted-foreground hover:text-emerald-400 flex items-center justify-center cursor-pointer transition-colors">
          <Download size={15} />
        </button>
        <button onClick={onDelete} title="Supprimer" className="w-8 h-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center cursor-pointer transition-colors">
          <Trash2 size={15} />
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
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[72px] rounded-xl bg-card border border-white/[0.02] animate-pulse" />
      ))}
    </div>
  );

  /* Empty vault */
  if (!files || files.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 text-center animate-fadeIn">
      <div className="w-16 h-16 rounded-2xl border border-white/[0.04] bg-card flex items-center justify-center text-muted-foreground mb-6 shadow-premium">
        <FolderLock size={28} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">Empty Vault</h3>
      <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
        Upload your first files. They will be encrypted client-side immediately.
      </p>
    </div>
  );

  /* No match */
  if (list.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 text-center animate-fadeIn">
      <div className="w-16 h-16 rounded-2xl border border-white/[0.04] bg-card flex items-center justify-center text-muted-foreground mb-6 shadow-premium">
        <Search size={28} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">No results</h3>
      <p className="text-[14px] text-muted-foreground">
        {activeTag ? `No matches for tag "${activeTag}"` : `No matches for "${searchQuery}"`}
      </p>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-[13px] font-medium shadow-sm">
          <AlertCircle size={16}/>{error}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-4 px-2">
        <span className="text-[12px] text-muted-foreground font-bold tracking-widest uppercase">
          {list.length} File{list.length > 1 ? 's' : ''} Record
        </span>
        <button onClick={() => fetchFiles()} className="text-[12px] font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
          <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="space-y-1 bg-card/40 backdrop-blur-sm p-2 rounded-[20px] border border-white/[0.02] shadow-inner">
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="card w-full max-w-sm shadow-premium-lg animate-slideUp">
            <div className="px-6 py-5 border-b border-border">
              <h3 className="text-[16px] font-bold text-foreground tracking-tight flex items-center gap-2">
                <AlertCircle size={18} className="text-destructive" /> Confirm Deletion
              </h3>
            </div>
            <div className="p-6">
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                Are you sure you want to delete <strong className="text-foreground">"{deleteModal.name}"</strong>?
                This cryptographically sealed file will be <span className="text-destructive font-medium">permanently destroyed</span>.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-secondary/20">
              <button 
                onClick={() => setDeleteModal(null)} 
                className="px-4 py-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => { await deleteFile(deleteModal.id); setDeleteModal(null); }}
                className="px-4 py-2 text-[13px] font-semibold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 rounded-lg transition-colors"
              >
                Purge File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag modal */}
      {tagModal && <TagModal fileId={tagModal.id} fileName={tagModal.name} currentTags={tagModal.tags} onClose={() => setTagModal(null)} />}

      {/* Preview modal */}
      {previewData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/90 backdrop-blur-xl p-4 animate-fadeIn">
          <div className="card w-full max-w-2xl max-h-[85vh] flex flex-col shadow-premium-xl animate-slideUp">
            <div className="px-8 py-6 border-b border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                    <Shield size={18} className="text-emerald-500" />
                 </div>
                 <h3 className="text-lg font-bold text-foreground tracking-tight">
                   Encryption Proof
                 </h3>
              </div>
              <button onClick={() => setPreviewData(null)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all">
                 <X size={18}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-2">
                 <p className="text-[14px] text-muted-foreground leading-relaxed">
                   Displaying exact first <strong className="text-foreground">512 bytes</strong> of ciphertext for{' '}
                   <code className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md text-[12px]">{previewData.file_name}</code> as stored on the server.
                 </p>
              </div>
              <div className="p-5 rounded-2xl bg-[#0a0a0c] border border-white/[0.04] overflow-x-auto shadow-inner relative group">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <pre className="font-mono text-[13px] text-muted-foreground/80 leading-loose whitespace-pre-wrap break-all select-all">
                  {previewData.preview_hex.match(/.{1,64}/g)?.join('\n')}
                </pre>
              </div>
              <div className="p-5 rounded-2xl border border-white/[0.04] bg-card shadow-sm flex items-center justify-between gap-4">
                <div>
                   <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Integrity Hash (SHA-256)</p>
                   <code className="text-[13px] font-mono text-primary break-all">{previewData.sha256_hash}</code>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03]">
                <div className="mt-0.5 bg-emerald-500/10 p-1.5 rounded-lg flex-shrink-0">
                   <Lock size={16} className="text-emerald-500" />
                </div>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  <strong className="text-emerald-500 font-semibold block mb-1">Zero-knowledge verified.</strong> 
                  This blob is the output of client-side AES-256-GCM. The server holds zero decryption capability, possessing only this raw, irreversibly opaque ciphertext.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {previewLoading && (
        <div className="fixed inset-0 z-[199] flex items-center justify-center bg-background/50 backdrop-blur-sm animate-fadeIn">
          <div className="px-6 py-4 rounded-2xl border border-white/[0.06] bg-card shadow-premium flex items-center gap-4">
            <Loader2 size={20} className="text-primary animate-spin" />
            <span className="text-[14px] font-bold text-foreground tracking-wide">Decrypting buffer...</span>
          </div>
        </div>
      )}
    </div>
  );
}
