import { useState, useRef, useCallback } from 'react';
import { useFileStore } from '../store/fileStore';
import { Upload, FileUp, Loader2, File as FileIcon, CheckCircle2, AlertCircle, Clock, Lock } from 'lucide-react';

const STATUS: Record<string, { label: string; color: string }> = {
  waiting:    { label: 'Pending',     color: 'text-muted-foreground' },
  encrypting: { label: 'Encrypting',  color: 'text-primary' },
  uploading:  { label: 'Transmitting',color: 'text-sky-400' },
  done:       { label: 'Sealed',      color: 'text-emerald-400' },
  error:      { label: 'Failed',      color: 'text-destructive' },
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'waiting')     return <Clock size={16} className="text-muted-foreground" />;
  if (status === 'encrypting')  return <Loader2 size={16} className="text-primary animate-spin" />;
  if (status === 'uploading')   return <Loader2 size={16} className="text-sky-400 animate-spin" />;
  if (status === 'done')        return <CheckCircle2 size={16} className="text-emerald-400" />;
  if (status === 'error')       return <AlertCircle size={16} className="text-destructive" />;
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
    <div className="space-y-6 max-w-4xl animate-fadeIn">

      {/* Drop zone */}
      <div
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 min-h-[280px]
          ${isUploading ? 'border-primary/30 bg-primary/[0.02] cursor-wait shadow-inner'
            : dragging   ? 'border-emerald-500/50 bg-emerald-500/[0.04] scale-[0.99] shadow-inner'
            :              'border-white/[0.05] hover:border-white/[0.15] bg-card/30 hover:bg-card/50'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={onDrop}
        onClick={() => !isUploading && ref.current?.click()}
      >
        <input ref={ref} type="file" multiple onChange={onChange} className="hidden" />

        {isUploading ? (
          <div className="flex flex-col items-center gap-6 py-10 animate-fadeIn">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
              <Loader2 size={36} strokeWidth={1.5} className="text-primary animate-spin relative z-10" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-[16px] font-bold text-foreground tracking-tight">
                {uploadQueue.find(q => q.status === 'encrypting') ? 'Executing Client-Side Encryption' : 'Establishing Secure Uplink'}
              </p>
              <p className="text-[13px] text-muted-foreground font-mono tracking-widest uppercase">
                {uploadQueue.filter(q => q.status === 'done').length} / {uploadQueue.length} files · {uploadProgress}%
              </p>
            </div>
            <div className="w-64 h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
              <div className="h-full bg-primary rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.6)]" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 py-12 pointer-events-none">
            <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-all duration-300 shadow-premium
              ${dragging ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 scale-110' : 'border-white/[0.04] bg-card text-muted-foreground'}`}>
              {dragging ? <FileUp size={28} strokeWidth={1.5} /> : <Upload size={28} strokeWidth={1.5} />}
            </div>
            <div className="text-center space-y-1">
              <p className={`text-[18px] font-bold tracking-tight ${dragging ? 'text-emerald-400' : 'text-foreground'}`}>
                {dragging ? 'Release to encrypt & secure' : 'Drag & drop vault entries'}
              </p>
              <p className="text-[14px] text-muted-foreground">
                or <span className="text-primary underline underline-offset-4 cursor-pointer font-medium hover:text-white transition-colors">browse local system</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notice */}
      <div className="flex items-center gap-4 p-5 rounded-2xl border border-white/[0.04] bg-card/60 shadow-sm">
        <div className="bg-secondary/80 p-2 rounded-xl flex-shrink-0">
           <Lock size={18} className="text-muted-foreground" />
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Zero-Knowledge Architecture:</strong> AES-256-GCM encryption is executed exclusively within your memory space. Server topology lacks the cryptographic material required to inspect packet payloads.
        </p>
      </div>

      {/* Queue Details */}
      {uploadQueue.length > 0 && (
        <div className="rounded-2xl border border-white/[0.02] bg-card/30 overflow-hidden divide-y divide-white/[0.02]">
          {uploadQueue.map((item, i) => {
            const s = STATUS[item.status] || STATUS.waiting;
            return (
              <div key={i} className="flex items-center gap-4 px-6 py-4 bg-transparent hover:bg-secondary/40 transition-colors">
                <StatusIcon status={item.status} />
                <div className="p-1.5 bg-secondary/50 rounded-lg">
                   <FileIcon size={16} className="text-muted-foreground flex-shrink-0" />
                </div>
                <span className="flex-1 truncate text-[14px] font-medium text-foreground min-w-0 pr-4">{item.file.name}</span>
                
                {(item.status === 'encrypting' || item.status === 'uploading') && (
                  <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden flex-shrink-0">
                    <div className={`h-full rounded-full transition-all ${item.status === 'encrypting' ? 'bg-primary' : 'bg-sky-400'}`}
                      style={{ width: `${item.progress}%` }} />
                  </div>
                )}
                
                <span className={`text-[11px] font-bold uppercase tracking-widest flex-shrink-0 ml-4 ${s.color}`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
