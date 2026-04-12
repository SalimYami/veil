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
    <div className="group flex items-center gap-3 px-4 py-2 hover:bg-white/[0.03] transition-all duration-200 border-b border-white/[0.02] last:border-0 rounded-lg">

      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded border border-white/[0.04] bg-white/[0.01] flex items-center justify-center ${GROUP_COLOR[g]} shadow-sm`}>
        <FileTypeIcon name={file.name} size={14} />
      </div>

      {/* Name + tags */}
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[12px] font-semibold text-white/90 truncate">{file.name}</p>
        <div className="flex gap-1.5 mt-0.5 flex-wrap">
          {file.tags && file.tags.map(t => (
            <span key={t} className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 bg-white/[0.03] border border-white/5 px-1.5 rounded-sm">{t}</span>
          ))}
        </div>
      </div>

      {/* Size */}
      <span className="text-[10px] font-mono text-muted-foreground/60 flex-shrink-0 w-16 text-right">{formatBytes(file.size)}</span>

      {/* Date */}
      <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 w-16 text-right hidden lg:block">{formatDate(file.created_at)}</span>

      {/* Encrypted badge */}
      <Shield size={12} className="text-primary/60 flex-shrink-0 ml-2" />

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onTag} title="Tags" className="w-6 h-6 rounded hover:bg-white/5 text-muted-foreground/50 hover:text-primary flex items-center justify-center transition-colors">
          <Tag size={12} />
        </button>
        <button onClick={onPreview} title="Inspect" className="w-6 h-6 rounded hover:bg-white/5 text-muted-foreground/50 hover:text-primary flex items-center justify-center transition-colors">
          <Eye size={12} />
        </button>
        <button onClick={onDownload} title="Download" className="w-6 h-6 rounded hover:bg-white/5 text-muted-foreground/50 hover:text-emerald-400 flex items-center justify-center transition-colors">
          <Download size={12} />
        </button>
        <button onClick={onDelete} title="Delete" className="w-6 h-6 rounded hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive flex items-center justify-center transition-colors">
          <Trash2 size={12} />
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
    catch { addToast("Preview error", 'error'); }
    finally { setPreviewLoading(false); }
  };

  let list = files || [];
  if (activeTag)          list = list.filter(f => f.tags?.includes(activeTag));
  if (searchQuery.trim()) list = list.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  /* Loading */
  if (isLoading && list.length === 0) return (
    <div className="space-y-2 animate-in">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-[48px] rounded-lg bg-white/[0.02] border border-white/[0.04] animate-pulse" />
      ))}
    </div>
  );

  /* Empty vault */
  if (!files || files.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-in">
      <div className="w-12 h-12 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-center text-muted-foreground/40 mb-4">
        <FolderLock size={20} />
      </div>
      <h3 className="text-lg font-bold text-white mb-1 tracking-tight">Empty Vault</h3>
      <p className="text-[12px] text-muted-foreground/60 max-w-[240px]">
        No encrypted records found. Upload files to begin secure storage.
      </p>
    </div>
  );

  /* No match */
  if (list.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-in">
      <div className="w-12 h-12 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-center text-muted-foreground/40 mb-4">
        <Search size={20} />
      </div>
      <h3 className="text-lg font-bold text-white mb-1 tracking-tight">No Results</h3>
      <p className="text-[12px] text-muted-foreground/60">
        No matches found for your current criteria.
      </p>
    </div>
  );

  return (
    <div className="animate-in">
      {error && (
        <div className="flex items-center gap-2.5 p-3 mb-4 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-[11px] font-semibold">
          <AlertCircle size={14}/>{error}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] text-muted-foreground/50 font-black tracking-widest uppercase">
          {list.length} Encrypted File{list.length > 1 ? 's' : ''}
        </span>
        <button onClick={() => fetchFiles()} className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/50 hover:text-primary flex items-center gap-2 transition-colors">
          <RefreshCcw size={12} className={isLoading ? 'animate-spin' : ''} /> Sync
        </button>
      </div>

      {/* Table */}
      <div className="space-y-0.5 bg-black/20 p-1.5 rounded-xl border border-white/[0.03] shadow-inner">
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in">
          <div className="card w-full max-w-[340px] shadow-pro animate-in">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-[14px] font-bold text-white tracking-tight flex items-center gap-2">
                <AlertCircle size={16} className="text-destructive" /> Security Confirmation
              </h3>
            </div>
            <div className="p-5">
              <p className="text-[12px] text-muted-foreground/80 leading-relaxed">
                Are you sure you want to delete <strong className="text-white">"{deleteModal.name}"</strong>? 
                This action is <span className="text-destructive font-bold uppercase tracking-tighter">irreversible</span> and destroys all cryptographic data.
              </p>
            </div>
            <div className="px-5 py-3 border-t border-white/5 flex justify-end gap-2 bg-white/[0.01]">
              <button onClick={() => setDeleteModal(null)} className="btn-ghost">Cancel</button>
              <button 
                onClick={async () => { await deleteFile(deleteModal.id); setDeleteModal(null); }}
                className="px-3 py-1.5 rounded-md text-[11px] font-bold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
              >
                Destroy File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag modal */}
      {tagModal && <TagModal fileId={tagModal.id} fileName={tagModal.name} currentTags={tagModal.tags} onClose={() => setTagModal(null)} />}

      {/* Preview modal */}
      {previewData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in">
          <div className="card w-full max-w-[640px] max-h-[80vh] flex flex-col shadow-pro">
            <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                 <Shield size={16} className="text-primary" />
                 <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Ciphertext Inspection</h3>
              </div>
              <button onClick={() => setPreviewData(null)} className="text-muted-foreground/50 hover:text-white transition-colors">
                 <X size={16}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-none">
              <div className="p-4 rounded-lg bg-black/40 border border-white/[0.03] shadow-inner font-mono text-[11px] text-muted-foreground/70 leading-relaxed break-all select-all">
                {previewData.preview_hex.match(/.{1,64}/g)?.join('\n')}
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
                   <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-1">SHA-256 Integrity</p>
                   <code className="text-[11px] font-mono text-primary/80 break-all">{previewData.sha256_hash}</code>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <Lock size={14} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-muted-foreground/90 leading-relaxed font-medium">
                    <span className="text-white block font-bold mb-0.5">Verified Ciphertext.</span>
                    This data is an exact representation of the AES-256-GCM encrypted block stored in our trustless architecture.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {previewLoading && (
        <div className="fixed inset-0 z-[199] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in">
          <div className="px-6 py-4 rounded-xl border border-white/[0.06] bg-black/60 shadow-pro flex items-center gap-4">
            <Loader2 size={16} className="text-primary animate-spin" />
            <span className="text-[12px] font-bold text-white tracking-wide">Decrypting buffer...</span>
          </div>
        </div>
      )}
    </div>
  );
}
