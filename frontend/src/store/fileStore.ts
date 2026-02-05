/**
 * =============================================================================
 * VEIL - Store des Fichiers (Zustand)
 * =============================================================================
 * 
 * Gère la liste des fichiers et les opérations d'upload/download.
 * 
 * =============================================================================
 */

import { create } from 'zustand';
import * as api from '../lib/api';
import {
    encryptFile,
    decryptFile,
    arrayBufferToBase64,
    base64ToArrayBuffer
} from '../lib/crypto';
import { useAuthStore } from './authStore';

// =============================================================================
// TYPES
// =============================================================================

export interface VeilFile {
    id: string;
    name: string;
    iv: string;
    size: number;
    created_at: string;
}

interface FileState {
    files: VeilFile[];
    isLoading: boolean;
    uploadProgress: number;
    error: string | null;

    // Actions
    fetchFiles: () => Promise<void>;
    uploadFile: (file: File) => Promise<void>;
    downloadFile: (fileId: string) => Promise<void>;
    deleteFile: (fileId: string) => Promise<void>;
    clearError: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useFileStore = create<FileState>((set, get) => ({
    files: [],
    isLoading: false,
    uploadProgress: 0,
    error: null,

    /**
     * 📂 Récupère la liste des fichiers
     */
    fetchFiles: async () => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        set({ isLoading: true, error: null });

        try {
            const files = await api.listFiles(token);
            set({ files, isLoading: false });
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.response?.data?.detail || 'Erreur lors du chargement des fichiers',
            });
        }
    },

    /**
     * 📤 UPLOAD D'UN FICHIER
     * 
     * Flux Zero-Knowledge:
     * 1. Lire le fichier comme ArrayBuffer
     * 2. Chiffrer avec AES-256-GCM (côté client!)
     * 3. Envoyer le blob chiffré au serveur
     * 
     * ⚠️ Le serveur reçoit uniquement des données chiffrées illisibles !
     */
    uploadFile: async (file: File) => {
        const { token, encryptionKey } = useAuthStore.getState();

        if (!token || !encryptionKey) {
            set({ error: 'Non authentifié' });
            return;
        }

        set({ isLoading: true, uploadProgress: 0, error: null });

        try {
            console.log(`📤 Upload: ${file.name} (${file.size} bytes)`);

            // Étape 1: Lire le fichier
            const fileBuffer = await file.arrayBuffer();
            set({ uploadProgress: 20 });

            // Étape 2: Chiffrer côté client
            console.log('🔒 Chiffrement en cours...');
            const { ciphertext, iv } = await encryptFile(fileBuffer, encryptionKey);
            set({ uploadProgress: 60 });

            // Étape 3: Convertir l'IV en Base64 pour le transport
            const ivBase64 = arrayBufferToBase64(iv);

            // Étape 4: Envoyer au serveur
            console.log('☁️ Upload vers le serveur...');
            await api.uploadFile(token, file.name, ivBase64, ciphertext);
            set({ uploadProgress: 100 });

            console.log('✅ Upload terminé !');

            // Rafraîchir la liste des fichiers
            await get().fetchFiles();
            set({ isLoading: false, uploadProgress: 0 });

        } catch (error: any) {
            console.error('❌ Erreur d\'upload:', error);
            set({
                isLoading: false,
                uploadProgress: 0,
                error: error.response?.data?.detail || 'Erreur lors de l\'upload',
            });
        }
    },

    /**
     * 📥 TÉLÉCHARGEMENT D'UN FICHIER
     * 
     * Flux Zero-Knowledge:
     * 1. Télécharger le blob chiffré depuis le serveur
     * 2. Déchiffrer avec l'encryptionKey (côté client!)
     * 3. Proposer le téléchargement du fichier original
     */
    downloadFile: async (fileId: string) => {
        const { token, encryptionKey } = useAuthStore.getState();

        if (!token || !encryptionKey) {
            set({ error: 'Non authentifié' });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            // Étape 1: Télécharger le blob chiffré
            console.log('📥 Téléchargement du fichier chiffré...');
            const { data, iv, fileName } = await api.downloadFile(token, fileId);

            // Étape 2: Convertir l'IV de Base64
            const ivBytes = base64ToArrayBuffer(iv);

            // Étape 3: Déchiffrer côté client
            console.log('🔓 Déchiffrement en cours...');
            const decrypted = await decryptFile(data, ivBytes, encryptionKey);

            // Étape 4: Créer un lien de téléchargement
            const blob = new Blob([decrypted]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);

            console.log('✅ Fichier déchiffré et téléchargé !');
            set({ isLoading: false });

        } catch (error: any) {
            console.error('❌ Erreur de téléchargement:', error);
            set({
                isLoading: false,
                error: error.message || 'Erreur lors du téléchargement',
            });
        }
    },

    /**
     * 🗑️ Suppression d'un fichier
     */
    deleteFile: async (fileId: string) => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        set({ isLoading: true, error: null });

        try {
            await api.deleteFile(token, fileId);
            await get().fetchFiles();
            set({ isLoading: false });
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.response?.data?.detail || 'Erreur lors de la suppression',
            });
        }
    },

    clearError: () => set({ error: null }),
}));
