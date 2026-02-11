import { useState, useRef, useCallback } from 'react';
import { useFileStore } from '../store/fileStore';
import { Upload, FileUp, Loader2, ShieldCheck, File, CheckCircle, AlertCircle, Clock } from 'lucide-react';

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
        fileInputRef.current?.click();
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
            case 'waiting': return <Clock size={14} className="queue-icon waiting" />;
            case 'encrypting': return <Loader2 size={14} className="spinner queue-icon encrypting" />;
            case 'uploading': return <Loader2 size={14} className="spinner queue-icon uploading" />;
            case 'done': return <CheckCircle size={14} className="queue-icon done" />;
            case 'error': return <AlertCircle size={14} className="queue-icon error" />;
            default: return null;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'waiting': return 'En attente';
            case 'encrypting': return 'Chiffrement...';
            case 'uploading': return 'Upload...';
            case 'done': return 'Terminé';
            case 'error': return 'Erreur';
            default: return '';
        }
    };

    return (
        <>
            <div
                className={`file-uploader ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={!isUploading ? handleClick : undefined}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />

                {isUploading ? (
                    <div className="upload-progress">
                        <div className="upload-icon">
                            <Loader2 className="spinner" size={36} />
                        </div>
                        <div className="upload-text">
                            <h3>Chiffrement & Upload</h3>
                            <p>{uploadQueue.filter(q => q.status === 'done').length} / {uploadQueue.length} fichiers</p>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <span>{uploadProgress}% complété</span>
                    </div>
                ) : (
                    <div className="upload-content">
                        <div className="upload-icon">
                            {isDragging ? <FileUp size={36} /> : <Upload size={36} />}
                        </div>
                        <div className="upload-text">
                            <h3>{isDragging ? 'Déposez pour chiffrer' : 'Glissez-déposez vos fichiers'}</h3>
                            <p>ou cliquez pour explorer • Multi-fichiers supporté</p>
                        </div>
                    </div>
                )}

                <div className="encryption-badge">
                    <ShieldCheck size={12} />
                    Protection AES-256-GCM
                </div>
            </div>

            {/* Multi-upload queue */}
            {uploadQueue.length > 0 && (
                <div className="upload-queue">
                    {uploadQueue.map((item, index) => (
                        <div key={index} className={`queue-item ${item.status}`}>
                            <div className="queue-file-info">
                                {getStatusIcon(item.status)}
                                <File size={14} />
                                <span className="queue-file-name">{item.file.name}</span>
                            </div>
                            <div className="queue-status">
                                <span className={`queue-label ${item.status}`}>
                                    {getStatusLabel(item.status)}
                                </span>
                                {(item.status === 'encrypting' || item.status === 'uploading') && (
                                    <div className="queue-progress-bar">
                                        <div className="queue-progress-fill" style={{ width: `${item.progress}%` }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
