import { useState, useRef, useCallback } from 'react';
import { useFileStore } from '../store/fileStore';
import { Upload, FileUp, Loader2, ShieldCheck, File as FileIcon, CheckCircle, AlertCircle, Clock } from 'lucide-react';

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
        if (files.length > 0) {
            await uploadFiles(files);
        }
    }, [uploadFiles]);

    const handleClick = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            await uploadFiles(Array.from(files));
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'waiting': return <Clock size={16} className="text-vault-text-muted" />;
            case 'encrypting': return <Loader2 size={16} className="text-vault-primary animate-spin" />;
            case 'uploading': return <Loader2 size={16} className="text-vault-secondary animate-spin" />;
            case 'done': return <CheckCircle size={16} className="text-vault-success" />;
            case 'error': return <AlertCircle size={16} className="text-vault-error" />;
            default: return null;
        }
    };

    const getStatusTheme = (status: string) => {
         switch (status) {
            case 'waiting': return 'text-vault-text-muted bg-white/5 border-white/10';
            case 'encrypting': return 'text-vault-primary bg-vault-primary/10 border-vault-primary/20';
            case 'uploading': return 'text-vault-secondary bg-vault-secondary/10 border-vault-secondary/20';
            case 'done': return 'text-vault-success bg-vault-success/10 border-vault-success/20';
            case 'error': return 'text-vault-error bg-vault-error/10 border-vault-error/20';
            default: return 'text-vault-text-muted bg-white/5 border-white/10';
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div
                className={`flex-1 relative flex flex-col items-center justify-center min-h-[140px] rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden group
                    ${isUploading 
                        ? 'border-vault-primary/50 bg-vault-primary/5 cursor-wait' 
                        : isDragging 
                            ? 'border-vault-success bg-vault-success/10 scale-[1.02] shadow-[0_0_30px_rgba(16,185,129,0.15)]' 
                            : 'border-white/10 hover:border-vault-primary/40 hover:bg-vault-primary/5 cursor-pointer hover:shadow-[inset_0_0_30px_rgba(37,99,235,0.05)]'
                    }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                />

                {isUploading ? (
                    <div className="flex flex-col items-center gap-4 w-full px-8 animate-[fadeIn_0.3s_ease-out]">
                        <div className="w-14 h-14 bg-vault-primary/10 rounded-full flex items-center justify-center text-vault-primary border border-vault-primary/20 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                            <Loader2 className="w-7 h-7 animate-spin" />
                        </div>
                        <div className="text-center w-full">
                            <h3 className="font-semibold text-white/90">Chiffrement & Upload</h3>
                            <p className="text-sm text-vault-text-muted mt-1">{uploadQueue.filter(q => q.status === 'done').length} / {uploadQueue.length} fichiers</p>
                            
                            <div className="w-full h-1.5 bg-vault-bg-tertiary rounded-full mt-4 overflow-hidden border border-white/5 shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-vault-primary shadow-[0_0_10px_var(--color-vault-primary)] to-vault-secondary bg-[length:200%_100%] animate-[gradient-shift_2s_ease_infinite] transition-all duration-300 ease-out"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <span className="text-xs text-vault-primary font-mono mt-2 block font-medium">{uploadProgress}% complété</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-6 px-6 pointer-events-none">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isDragging ? 'bg-vault-success/20 text-vault-success shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-110' : 'bg-vault-bg-tertiary text-vault-text-secondary group-hover:bg-vault-primary/10 group-hover:text-vault-primary group-hover:shadow-[0_0_15px_rgba(37,99,235,0.2)] group-hover:-translate-y-1'}`}>
                            {isDragging ? <FileUp size={32} /> : <Upload size={32} />}
                        </div>
                        <div>
                            <h3 className={`text-lg font-semibold transition-colors duration-300 ${isDragging ? 'text-vault-success' : 'text-white/90 group-hover:text-white'}`}>
                                {isDragging ? 'Déposez pour chiffrer' : 'Glissez-déposez vos fichiers'}
                            </h3>
                            <p className="text-sm text-vault-text-muted mt-1">Multi-fichiers supporté • <span className="font-mono text-xs opacity-70">MAX 100MB</span></p>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[0.7rem] font-mono tracking-widest text-vault-success uppercase font-semibold bg-vault-success/10 px-3 py-1 rounded-md border border-vault-success/20 backdrop-blur-sm pointer-events-none">
                    <ShieldCheck size={14} />
                    Protection Active
                </div>
            </div>

            {/* Multi-upload queue */}
            {uploadQueue.length > 0 && (
                <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto custom-scrollbar p-1">
                    {uploadQueue.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-vault-bg-tertiary/50 border border-white/5 rounded-xl animate-[fadeIn_0.3s_ease-out]">
                            <div className="flex items-center gap-3 overflow-hidden text-vault-text-primary">
                                {getStatusIcon(item.status)}
                                <FileIcon size={16} className="text-vault-text-muted flex-shrink-0" />
                                <span className="truncate text-sm font-medium">{item.file.name}</span>
                            </div>
                            <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                {(item.status === 'encrypting' || item.status === 'uploading') && (
                                    <div className="w-16 h-1.5 bg-vault-bg-primary rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <div className={`h-full transition-all duration-300 ease-out ${item.status === 'encrypting' ? 'bg-vault-primary' : 'bg-vault-secondary'}`} style={{ width: `${item.progress}%` }} />
                                    </div>
                                )}
                                <span className={`text-[0.65rem] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md border ${getStatusTheme(item.status)}`}>
                                    {item.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
