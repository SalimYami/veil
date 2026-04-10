import { useState, useEffect } from 'react';
import { useFileStore } from '../store/fileStore';
import { getFilePreview, type FilePreview } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { TagModal } from './TagModal';
import {
  FileText, Download, Trash2, Loader2, FileImage,
  FileVideo, FileAudio, File as FileIcon, Lock, Eye, X,
  Shield, Tag, AlertCircle, RefreshCcw, Search,
  MoreHorizontal, FolderLock
} from 'lucide-react';

/* ─── Helpers ─── */
const EXT_GROUPS = {
  image:    ['jpg','jpeg','png','gif','webp','svg','avif','bmp','ico'],
  video:    ['mp4','mkv','avi','mov','webm','flv','wmv'],
  audio:    ['mp3','wav','ogg','flac','m4a','aac','opus'],
  document: ['pdf','doc','docx','txt','md','csv','xls','xlsx','ppt','pptx'],
};

function getGroup(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  for (const [group, exts] of Object.entries(EXT_GROUPS))
    if (exts.includes(ext)) return group;
  return 'other';
}

function FileIconComp({ name, size = 18 }: { name: string; size?: number }) {
  const g = getGroup(name);
  if (g === 'image')    return <FileImage  size={size} />;
  if (g === 'video')    return <FileVideo  size={size} />;
  if (g === 'audio')    return <FileAudio  size={size} />;
  if (g === 'document') return <FileText   size={size} />;
  return <FileIcon size={size} />;
}

const GROUP_STYLES: Record<string, string> = {
  image:    'text-purple-400  bg-purple-500/10  border-purple-500/25',
  video:    'text-pink-400    bg-pink-500/10    border-pink-500/25',
  audio:    'text-amber-400   bg-amber-500/10   border-amber-500/25',
  document: 'text-sky-400     bg-sky-500/10     border-sky-500/25',
  other:    'text-v-t2        bg-white/5        border-white/10',
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
}

/* ─── File Card ─── */
function FileCard({
  file,
  onPreview,
  onDownload,
  onDelete,
  onTag,
  previewLoading,
}: {
  file: { id: string; name: string; size: number; created_at: string; tags?: string[] };
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onTag: () => void;
  previewLoading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const group = getGroup(file.name);
  const iconStyle = GROUP_STYLES[group] || GROUP_STYLES.other;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,22,0.6)] hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(14,14,30,0.8)] transition-all duration-200 overflow-hidden">

      {/* Top section */}
      <div className="p-4 flex items-start gap-3 flex-1">
        {/* Icon */}
        <div className={`flex-shrink-0 w-11 h-11 rounded-2xl border flex items-center justify-center ${iconStyle}`}>
          <FileIconComp name={file.name} size={20} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-v-t1 leading-snug truncate mb-1" title={file.name}>
            {file.name}
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-v-accent bg-v-accent/10 px-1.5 py-0.5 rounded border border-v-accent/15">
              {formatBytes(file.size)}
            </span>
            <span className="text-[10px] text-v-t3">{formatDate(file.created_at)}</span>
          </div>
        </div>

        {/* Shield + menu trigger */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <Shield size={12} className="text-v-success opacity-70" />
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-v-t3 hover:text-v-t2 cursor-pointer"
            >
              <MoreHorizontal size={14} />
            </button>

            {/* Dropdown menu */}
            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-8 z-50 w-44 glass-heavy rounded-2xl shadow-2xl overflow-hidden animate-scale-in py-1.5">
                  {[
                    { icon: <Tag size={13} />, label: 'Gérer les tags', action: onTag },
                    { icon: <Eye size={13} />, label: 'Inspecter le blob', action: onPreview, disabled: previewLoading },
                    { icon: <Download size={13} />, label: 'Télécharger', action: onDownload },
                    { icon: <Trash2 size={13} />, label: 'Supprimer', action: onDelete, danger: true },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { if (!item.disabled) { item.action(); setOpen(false); } }}
                      disabled={item.disabled}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-40
                        ${item.danger
                          ? 'text-v-danger hover:bg-v-danger/10'
                          : 'text-v-t2 hover:bg-white/5 hover:text-v-t1'
                        }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tags row */}
      {file.tags && file.tags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1">
          {file.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-md text-[9px] font-mono uppercase tracking-wider bg-white/5 border border-white/8 text-v-t3">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom action bar — visible on hover */}
      <div className="border-t border-[rgba(255,255,255,0.05)] px-3 py-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {[
          { icon: <Tag size={12} />,      label: 'Tags',      action: onTag,      color: 'hover:text-v-accent hover:bg-v-accent/10' },
          { icon: <Eye size={12} />,      label: 'Inspect',   action: onPreview,  color: 'hover:text-v-info hover:bg-v-info/10' },
          { icon: <Download size={12} />, label: 'Download',  action: onDownload, color: 'hover:text-v-success hover:bg-v-success/10' },
          { icon: <Trash2 size={12} />,   label: 'Suppr.',    action: onDelete,   color: 'hover:text-v-danger hover:bg-v-danger/10' },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-medium text-v-t3 transition-all cursor-pointer ${btn.color}`}
          >
            {btn.icon}
            <span className="hidden sm:inline">{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export function FileList() {
  const { files, isLoading, fetchFiles, downloadFile, deleteFile, error, activeTag, searchQuery, addToast } = useFileStore();
  const { token } = useAuthStore();

  const [previewData, setPreviewData] = useState<FilePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [tagModalFile, setTagModalFile] = useState<{ id: string; name: string; tags: string[] } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handlePreview = async (id: string) => {
    if (!token) return;
    setPreviewLoading(true);
    try { setPreviewData(await getFilePreview(token, id)); }
    catch { addToast("Erreur lors de la récupération de l'aperçu", 'error'); }
    finally { setPreviewLoading(false); }
  };

  let displayed = files || [];
  if (activeTag) displayed = displayed.filter(f => f.tags?.includes(activeTag));
  if (searchQuery.trim()) displayed = displayed.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  /* States */
  if (isLoading && displayed.length === 0) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-[130px] rounded-2xl border border-[rgba(255,255,255,0.04)] animate-pulse" style={{ background: 'rgba(255,255,255,0.02)', animationDelay: `${i * 0.06}s` }} />
      ))}
    </div>
  );

  if (!files || files.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-up">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] flex items-center justify-center">
          <FolderLock size={32} className="text-v-t3" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl border border-v-accent/25 bg-v-accent/10 flex items-center justify-center">
          <Lock size={13} className="text-v-accent" />
        </div>
      </div>
      <h3 className="font-bold text-[17px] text-white mb-2">Coffre-fort vide</h3>
      <p className="text-v-t3 text-[13px] max-w-xs leading-relaxed">
        Aucun fichier dans votre coffre. Uploadez vos premiers documents — ils seront chiffrés instantanément.
      </p>
    </div>
  );

  if (displayed.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <Search size={28} className="text-v-t3 mb-3 opacity-50" />
      <h3 className="font-semibold text-v-t1 text-[15px] mb-1">Aucun résultat</h3>
      <p className="text-v-t3 text-[12px]">
        {activeTag ? `Aucun fichier avec le tag « ${activeTag} »` : `Aucun résultat pour « ${searchQuery} »`}
      </p>
    </div>
  );

  return (
    <>
      {error && <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl border border-v-danger/25 bg-v-danger/8 text-v-danger text-[13px] animate-fade-in"><AlertCircle size={14}/>{error}</div>}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-mono text-v-t3">
          {displayed.length} fichier{displayed.length > 1 ? 's' : ''}
          {(activeTag || searchQuery) ? ' filtrés' : ''}
        </span>
        <button onClick={() => fetchFiles()} className="flex items-center gap-1.5 text-[11px] text-v-t3 hover:text-v-t2 transition-colors cursor-pointer">
          <RefreshCcw size={11} className={isLoading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {displayed.map((file, i) => (
          <div key={file.id} style={{ animationDelay: `${i * 0.035}s` }} className="animate-fade-up">
            <FileCard
              file={file}
              previewLoading={previewLoading}
              onPreview={() => handlePreview(file.id)}
              onDownload={() => downloadFile(file.id)}
              onDelete={() => setConfirmDelete({ id: file.id, name: file.name })}
              onTag={() => setTagModalFile({ id: file.id, name: file.name, tags: file.tags || [] })}
            />
          </div>
        ))}
      </div>

      {/* Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-xl p-4 animate-fade-in">
          <div className="glass-heavy rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-2">
              <AlertCircle size={16} className="text-v-danger" />
              <h3 className="font-bold text-[15px] text-white">Confirmer la suppression</h3>
            </div>
            <div className="p-6">
              <p className="text-[13px] text-v-t2 leading-relaxed">
                Supprimer définitivement <strong className="text-white">« {confirmDelete.name} »</strong> ?<br />
                Cette action est <span className="text-v-danger font-semibold">irréversible</span> — les données chiffrées seront effacées du serveur.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.05)] flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-[13px] text-v-t2 hover:text-v-t1 hover:bg-white/5 rounded-xl transition-colors cursor-pointer">Annuler</button>
              <button
                onClick={async () => { await deleteFile(confirmDelete.id); setConfirmDelete(null); }}
                className="px-4 py-2 text-[13px] font-semibold bg-v-danger/10 text-v-danger border border-v-danger/25 hover:bg-v-danger/20 rounded-xl transition-colors cursor-pointer"
              >Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {tagModalFile && <TagModal fileId={tagModalFile.id} fileName={tagModalFile.name} currentTags={tagModalFile.tags} onClose={() => setTagModalFile(null)} />}

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-fade-in">
          <div className="glass-heavy rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between bg-v-success/5">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-v-success" />
                <h3 className="font-bold text-[15px] text-white">Preuve de chiffrement ZK</h3>
              </div>
              <button onClick={() => setPreviewData(null)} className="p-1.5 rounded-xl text-v-t3 hover:text-v-t1 hover:bg-white/10 cursor-pointer transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scroll p-6 flex flex-col gap-5">
              <p className="text-[13px] text-v-t2 leading-relaxed">
                Premiers <strong className="text-white">512 octets</strong> stockés pour{' '}
                <code className="text-v-accent text-[11px] bg-v-accent/10 px-1.5 py-0.5 rounded">{previewData.file_name}</code>.
                Sans votre clé, ces données sont <span className="text-v-danger font-semibold">indéchiffrables</span>.
              </p>
              <div className="bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 overflow-x-auto">
                <pre className="font-mono text-[10px] leading-relaxed text-v-t3 whitespace-pre-wrap break-all select-all">
                  {previewData.preview_hex.match(/.{1,64}/g)?.join('\n')}
                </pre>
              </div>
              <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
                <p className="text-[10px] font-mono text-v-t3 uppercase tracking-widest mb-1.5">SHA-256 du blob chiffré</p>
                <code className="text-[11px] font-mono text-v-accent-3 break-all">{previewData.sha256_hash}</code>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl border border-v-success/15 bg-v-success/5">
                <Lock size={18} className="text-v-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] font-bold text-v-success mb-0.5">Garantie Zero-Knowledge</p>
                  <p className="text-[11px] text-v-t3 leading-relaxed">
                    Ce blob résulte de l'AES-256-GCM exécuté dans votre RAM. Le serveur n'a jamais accès à votre clé ou au contenu original.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewLoading && (
        <div className="fixed inset-0 z-[199] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl p-5 flex items-center gap-3">
            <Loader2 size={18} className="text-v-accent animate-spin" />
            <span className="text-[13px] text-v-t1 font-medium">Récupération du blob...</span>
          </div>
        </div>
      )}
    </>
  );
}
