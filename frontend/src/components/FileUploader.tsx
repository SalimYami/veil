import { useState, useRef, useCallback } from 'react';
import { useFileStore } from '../store/fileStore';
import { Upload, FileUp, Loader2, File as FileIcon, CheckCircle2, AlertCircle, Clock, Lock } from 'lucide-react';

const STATUS: Record<string, { label: string; color: string }> = {
  waiting:    { label: 'En attente',  color: 'text-v-t3' },
  encrypting: { label: 'Chiffrement', color: 'text-v-accent' },
  uploading:  { label: 'Envoi',       color: 'text-v-info' },
  done:       { label: 'Terminé',     color: 'text-v-success' },
  error:      { label: 'Erreur',      color: 'text-v-danger' },
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'waiting')     return <Clock size={13} className="text-v-t3" />;
  if (status === 'encrypting')  return <Loader2 size={13} className="text-v-accent animate-spin" />;
  if (status === 'uploading')   return <Loader2 size={13} className="text-v-info animate-spin" />;
  if (status === 'done')        return <CheckCircle2 size={13} className="text-v-success" />;
  if (status === 'error')       return <AlertCircle size={13} className="text-v-danger" />;
  return null;
}

export function FileUploader() {
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const { uploadFiles, isUploading, uploadQueue, uploadProgress } = useFileStore();

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) await uploadFiles(files);
  }, [uploadFiles]);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) await uploadFiles(Array.from(e.target.files));
    if (ref.current) ref.current.value = '';
  };

  return (
    <div className="space-y-4">

      {/* Drop zone */}
      <div
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors cursor-pointer min-h-[160px]
          ${isUploading ? 'border-v-accent/30 bg-v-accent/[0.03] cursor-wait'
            : dragging   ? 'border-v-success/50 bg-v-success/[0.04]'
            :              'border-v-border hover:border-v-border-l hover:bg-v-surface/50'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={onDrop}
        onClick={() => !isUploading && ref.current?.click()}
      >
        <input ref={ref} type="file" multiple onChange={onChange} className="hidden" />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3 py-6 anim-in">
            <Loader2 size={24} className="text-v-accent animate-spin" />
            <div className="text-center">
              <p className="text-[13px] font-medium text-v-t1">
                {uploadQueue.find(q => q.status === 'encrypting') ? 'Chiffrement en cours...' : 'Envoi sécurisé...'}
              </p>
              <p className="text-[11px] text-v-t3 mt-1 font-mono">
                {uploadQueue.filter(q => q.status === 'done').length}/{uploadQueue.length} · {uploadProgress}%
              </p>
            </div>
            <div className="w-48 h-1.5 bg-v-border rounded-full overflow-hidden">
              <div className="h-full bg-v-accent rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 pointer-events-none">
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors
              ${dragging ? 'border-v-success/30 bg-v-success/10 text-v-success' : 'border-v-border bg-v-surface text-v-t3'}`}>
              {dragging ? <FileUp size={20} /> : <Upload size={20} />}
            </div>
            <div className="text-center">
              <p className={`text-[13px] font-medium ${dragging ? 'text-v-success' : 'text-v-t1'}`}>
                {dragging ? 'Déposez les fichiers' : 'Glissez-déposez vos fichiers'}
              </p>
              <p className="text-[12px] text-v-t3 mt-0.5">
                ou <span className="text-v-accent underline underline-offset-2 cursor-pointer">parcourir</span> · Max 100 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Queue */}
      {uploadQueue.length > 0 && (
        <div className="rounded-lg border border-v-border divide-y divide-v-border overflow-hidden">
          {uploadQueue.map((item, i) => {
            const s = STATUS[item.status] || STATUS.waiting;
            return (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-v-surface/50">
                <StatusIcon status={item.status} />
                <FileIcon size={13} className="text-v-t3 flex-shrink-0" />
                <span className="flex-1 truncate text-[12px] text-v-t1 min-w-0">{item.file.name}</span>
                {(item.status === 'encrypting' || item.status === 'uploading') && (
                  <div className="w-16 h-1 bg-v-border rounded-full overflow-hidden flex-shrink-0">
                    <div className={`h-full rounded-full transition-all ${item.status === 'encrypting' ? 'bg-v-accent' : 'bg-v-info'}`}
                      style={{ width: `${item.progress}%` }} />
                  </div>
                )}
                <span className={`text-[10px] font-mono flex-shrink-0 ${s.color}`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Notice */}
      <div className="flex items-center gap-2.5 p-3 rounded-lg border border-v-border bg-v-surface">
        <Lock size={13} className="text-v-t3 flex-shrink-0" />
        <p className="text-[11px] text-v-t3 leading-relaxed">
          Le chiffrement s'effectue localement avant tout envoi réseau. Le serveur reçoit uniquement des blobs opaques.
        </p>
      </div>
    </div>
  );
}
