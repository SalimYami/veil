import { useState, useRef, useCallback, useEffect } from 'react';
import { useFileStore } from '../store/fileStore';
import { Upload, FileUp, Loader2, ShieldCheck, CheckCircle } from 'lucide-react';

export function FileUploader() {
    const [isDragging, setIsDragging] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploadFile, isLoading, uploadProgress } = useFileStore();
    const prevLoadingRef = useRef(isLoading);

    // Show success toast when upload completes
    useEffect(() => {
        if (prevLoadingRef.current && !isLoading && uploadProgress === 0) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
        prevLoadingRef.current = isLoading;
    }, [isLoading, uploadProgress]);

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

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            await uploadFile(files[0]);
        }
    }, [uploadFile]);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            await uploadFile(files[0]);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <div
                className={`file-uploader ${isDragging ? 'dragging' : ''} ${isLoading ? 'uploading' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />

                {isLoading ? (
                    <div className="upload-progress">
                        <div className="upload-icon">
                            <Loader2 className="spinner" size={36} />
                        </div>
                        <div className="upload-text">
                            <h3>Chiffrement & Upload</h3>
                            <p>{uploadProgress < 50 ? 'Chiffrement local AES-256...' : 'Envoi vers le Cloud...'}</p>
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
                            <h3>{isDragging ? 'Déposez pour chiffrer' : 'Glissez-déposez votre fichier'}</h3>
                            <p>ou cliquez pour explorer</p>
                        </div>
                    </div>
                )}

                <div className="encryption-badge">
                    <ShieldCheck size={12} />
                    Protection AES-256-GCM
                </div>
            </div>

            {/* Success Toast */}
            {showSuccess && (
                <div className="upload-success">
                    <CheckCircle size={18} />
                    Fichier chiffré et uploadé avec succès
                </div>
            )}
        </>
    );
}
