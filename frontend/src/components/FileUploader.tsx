/**
 * =============================================================================
 * VEIL - File Uploader (Drag & Drop)
 * =============================================================================
 * 
 * Zone de dépôt pour uploader des fichiers.
 * Les fichiers sont chiffrés côté client avant l'envoi !
 * 
 * =============================================================================
 */

import { useState, useRef, useCallback } from 'react';
import { useFileStore } from '../store/fileStore';
import { Upload, FileUp, Loader2 } from 'lucide-react';

export function FileUploader() {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploadFile, isLoading, uploadProgress } = useFileStore();

    /**
     * Gestion du drag & drop
     */
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
            // Upload le premier fichier (on pourrait en gérer plusieurs)
            await uploadFile(files[0]);
        }
    }, [uploadFile]);

    /**
     * Gestion du clic pour sélection de fichier
     */
    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            await uploadFile(files[0]);
        }
        // Reset l'input pour permettre le même fichier
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
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
                    <Loader2 className="spinner" size={48} />
                    <p>Chiffrement et upload en cours...</p>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                    <span>{uploadProgress}%</span>
                </div>
            ) : (
                <div className="upload-content">
                    {isDragging ? (
                        <>
                            <FileUp size={48} />
                            <p>Déposez le fichier ici</p>
                        </>
                    ) : (
                        <>
                            <Upload size={48} />
                            <p>Glissez-déposez un fichier ici</p>
                            <span>ou cliquez pour sélectionner</span>
                        </>
                    )}
                </div>
            )}

            <div className="encryption-badge">
                🔒 Chiffrement AES-256-GCM côté client
            </div>
        </div>
    );
}
