import { useState, useRef, useCallback } from 'react';
import { useFileStore } from '../store/fileStore';
import {
  Upload, FileUp, Loader2, ShieldCheck, File as FileIcon,
  CheckCircle2, AlertCircle, Clock, Lock
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  waiting:    { label: 'En attente',  color: 'text-v-t3',      bg: 'bg-white/5',         border: 'border-white/10' },
  encrypting: { label: 'Chiffrement', color: 'text-v-accent',  bg: 'bg-v-accent/10',     border: 'border-v-accent/25' },
  uploading:  { label: 'Upload',      color: 'text-v-info',    bg: 'bg-v-info/10',       border: 'border-v-info/25' },
  done:       { label: 'Sécurisé',   color: 'text-v-success',  bg: 'bg-v-success/10',    border: 'border-v-success/25' },
  error:      { label: 'Erreur',      color: 'text-v-danger',  bg: 'bg-v-danger/10',     border: 'border-v-danger/25' },
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'waiting')    return <Clock size={14} className="text-v-t3" />;
  if (status === 'encrypting') return <Loader2 size={14} className="text-v-accent animate-spin" />;
  if (status === 'uploading')  return <Loader2 size={14} className="text-v-info animate-spin" />;
  if (status === 'done')       return <CheckCircle2 size={14} className="text-v-success" />;
  if (status === 'error')      return <AlertCircle size={14} className="text-v-danger" />;
  return null;
}

export function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFiles, isUploading, uploadQueue, uploadProgress } = useFileStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) await uploadFiles(files);
  }, [uploadFiles]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) await uploadFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const doneCount = uploadQueue.filter(q => q.status === 'done').length;
  const totalCount = uploadQueue.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        className={`relative flex flex-col items-center justify-center min-h-[180px] rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden cursor-pointer group
          ${isUploading
            ? 'border-v-accent/40 bg-v-accent/5 cursor-wait'
            : isDragging
              ? 'border-v-success/60 bg-v-success/8 scale-[1.01]'
              : 'border-[rgba(255,255,255,0.1)] hover:border-v-accent/40 hover:bg-v-accent/5'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />

        {/* Ambient glow overlay on drag */}
        {isDragging && (
          <div className="absolute inset-0 bg-gradient-to-b from-v-success/5 to-transparent pointer-events-none" />
        )}

        {isUploading ? (
          /* Upload in progress */
          <div className="flex flex-col items-center gap-4 w-full px-10 py-6 animate-fade-in">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full bg-v-accent/10 border border-v-accent/20 flex items-center justify-center">
                <Loader2 size={24} className="text-v-accent animate-spin" />
              </div>
              <div className="absolute -inset-1 rounded-full border border-v-accent/10 animate-ping opacity-40" />
            </div>
            <div className="text-center w-full">
              <p className="font-semibold text-white text-sm">
                {uploadQueue[uploadQueue.findIndex(q => q.status === 'encrypting' || q.status === 'uploading')]?.status === 'encrypting'
                  ? '🔐 Chiffrement en cours...'
                  : '📡 Transmission sécurisée...'
                }
              </p>
              <p className="text-xs text-v-t3 mt-1 font-mono">{doneCount} / {totalCount} fichiers</p>
              {/* Progress bar */}
              <div className="mt-4 w-full h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden border border-[rgba(255,255,255,0.05)]">
                <div
                  className="h-full bg-gradient-to-r from-v-accent to-v-accent-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-v-accent mt-1.5 block">{uploadProgress}%</span>
            </div>
          </div>
        ) : (
          /* Idle state */
          <div className="flex flex-col items-center gap-4 py-8 px-6 pointer-events-none">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300
              ${isDragging
                ? 'bg-v-success/15 border-v-success/40 text-v-success'
                : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-v-t3 group-hover:bg-v-accent/10 group-hover:border-v-accent/30 group-hover:text-v-accent'
              }`}
            >
              {isDragging ? <FileUp size={24} /> : <Upload size={24} />}
            </div>
            <div className="text-center">
              <p className={`font-semibold text-sm transition-colors duration-200 ${isDragging ? 'text-v-success' : 'text-v-t1 group-hover:text-white'}`}>
                {isDragging ? 'Déposez pour chiffrer' : 'Glissez-déposez vos fichiers'}
              </p>
              <p className="text-xs text-v-t3 mt-1">
                ou <span className="text-v-accent-3 underline underline-offset-2">parcourir</span>
                {' '}· Multi-fichiers · <span className="font-mono">Max 100MB</span>
              </p>
            </div>
          </div>
        )}

        {/* Bottom badge */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full border border-v-success/20 bg-v-success/8 backdrop-blur-sm pointer-events-none">
          <ShieldCheck size={11} className="text-v-success" />
          <span className="text-[10px] font-mono text-v-success uppercase tracking-widest">Protection Active</span>
        </div>
      </div>

      {/* Upload queue */}
      {uploadQueue.length > 0 && (
        <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto custom-scroll">
          {uploadQueue.map((item, index) => {
            const s = STATUS_MAP[item.status] || STATUS_MAP.waiting;
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] animate-fade-in"
              >
                <div className={`flex-shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center ${s.bg} ${s.border}`}>
                  <StatusIcon status={item.status} />
                </div>
                <FileIcon size={13} className="text-v-t3 flex-shrink-0" />
                <span className="flex-1 truncate text-sm text-v-t1 font-medium min-w-0">{item.file.name}</span>

                {/* Progress bar for active states */}
                {(item.status === 'encrypting' || item.status === 'uploading') && (
                  <div className="w-20 h-1 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden flex-shrink-0">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${item.status === 'encrypting' ? 'bg-v-accent' : 'bg-v-info'}`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex-shrink-0 ${s.color} ${s.bg} ${s.border}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Info footer */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)]">
        <Lock size={13} className="text-v-t3 flex-shrink-0" />
        <p className="text-[11px] text-v-t3 leading-relaxed">
          Le chiffrement AES-256-GCM s'effectue localement dans votre RAM avant tout envoi réseau.
          {' '}<span className="text-v-t2">Le serveur reçoit uniquement des blobs opaques.</span>
        </p>
      </div>
    </div>
  );
}
