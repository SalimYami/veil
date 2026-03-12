/**
 * VEIL - Store des Fichiers (Zustand)
 * Gère fichiers, tags, multi-upload, recherche
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
import type { ActivityEntry } from '../lib/api';

// =============================================================================
// TYPES
// =============================================================================

export interface VeilFile {
    id: string;
    name: string;
    iv: string;
    auth_tag: string;
    size: number;
    mime_type?: string;
    created_at: string;
    tags: string[];
}

interface UploadQueueItem {
    file: File;
    status: 'waiting' | 'encrypting' | 'uploading' | 'done' | 'error';
    progress: number;
    error?: string;
}

interface FileState {
    files: VeilFile[];
    isLoading: boolean;
    uploadProgress: number;
    error: string | null;

    // Multi-upload
    uploadQueue: UploadQueueItem[];
    isUploading: boolean;

    // Tags
    allTags: string[];
    activeTag: string | null;

    // Search
    searchQuery: string;
    searchResults: VeilFile[];
    isSearching: boolean;

    // Activity
    activities: ActivityEntry[];

    // Toast
    toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;

    // Actions
    fetchFiles: () => Promise<void>;
    uploadFile: (file: File) => Promise<void>;
    uploadFiles: (files: File[]) => Promise<void>;
    downloadFile: (fileId: string) => Promise<void>;
    deleteFile: (fileId: string) => Promise<void>;
    updateFileTags: (fileId: string, tags: string[]) => Promise<void>;
    setActiveTag: (tag: string | null) => void;
    searchFiles: (query: string) => Promise<void>;
    setSearchQuery: (query: string) => void;
    fetchActivity: () => Promise<void>;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
    removeToast: (id: string) => void;
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
    uploadQueue: [],
    isUploading: false,
    allTags: [],
    activeTag: null,
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    activities: [],
    toasts: [],

    /**
     * 📂 Récupère la liste des fichiers
     */
    fetchFiles: async () => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        set({ isLoading: true, error: null });

        try {
            const rawFiles = await api.listFiles(token);
            // Ensure tags is always an array for the store
            const files: VeilFile[] = rawFiles.map(f => ({
                ...f,
                tags: f.tags || []
            }));
            // Extract all unique tags
            const allTags = [...new Set(files.flatMap(f => f.tags || []))];
            set({ files: files || [], allTags: allTags || [], isLoading: false });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.response?.data?.detail || 'Erreur lors du chargement des fichiers',
            });
        }
    },

    /**
     * 📤 UPLOAD D'UN FICHIER (single)
     */
    uploadFile: async (file: File) => {
        await get().uploadFiles([file]);
    },

    /**
     * 📤 MULTI-UPLOAD
     */
    uploadFiles: async (files: File[]) => {
        const { token, encryptionKey } = useAuthStore.getState();

        if (!token || !encryptionKey) {
            set({ error: 'Non authentifié' });
            return;
        }

        const queue: UploadQueueItem[] = files.map(f => ({
            file: f,
            status: 'waiting' as const,
            progress: 0,
        }));

        set({ uploadQueue: queue, isUploading: true, error: null });

        for (let i = 0; i < queue.length; i++) {
            try {
                // Update status to encrypting
                queue[i].status = 'encrypting';
                queue[i].progress = 20;
                set({ uploadQueue: [...queue], uploadProgress: Math.round(((i) / queue.length) * 100) });

                const fileBuffer = await queue[i].file.arrayBuffer();
                const { ciphertext, iv } = await encryptFile(fileBuffer, encryptionKey);
                const ivBase64 = arrayBufferToBase64(iv);

                // Extract Auth Tag (last 16 bytes for AES-GCM 128-bit tag)
                const tag = ciphertext.slice(-16);
                const encryptedContent = ciphertext.slice(0, -16);
                const tagBase64 = arrayBufferToBase64(tag);

                // Update status to uploading
                queue[i].status = 'uploading';
                queue[i].progress = 60;
                set({ uploadQueue: [...queue] });

                await api.uploadFile(
                    token,
                    queue[i].file.name,
                    ivBase64,
                    tagBase64,
                    encryptedContent,
                    queue[i].file.type
                );

                // Done
                queue[i].status = 'done';
                queue[i].progress = 100;
                set({ uploadQueue: [...queue], uploadProgress: Math.round(((i + 1) / queue.length) * 100) });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                queue[i].status = 'error';
                queue[i].error = error.response?.data?.detail || 'Erreur';
                set({ uploadQueue: [...queue] });
            }
        }

        // Refresh
        await get().fetchFiles();
        await get().fetchActivity();

        const successCount = queue.filter(q => q.status === 'done').length;
        if (successCount > 0) {
            get().addToast(
                successCount === 1
                    ? 'Fichier chiffré et uploadé avec succès'
                    : `${successCount} fichiers chiffrés et uploadés`,
                'success'
            );
        }

        const errorCount = queue.filter(q => q.status === 'error').length;
        if (errorCount > 0) {
            get().addToast(`${errorCount} fichier(s) en erreur`, 'error');
        }

        // Clear queue after delay
        setTimeout(() => {
            set({ uploadQueue: [], isUploading: false, uploadProgress: 0 });
        }, 2000);
    },

    /**
     * 📥 TÉLÉCHARGEMENT
     */
    downloadFile: async (fileId: string) => {
        const { token, encryptionKey } = useAuthStore.getState();

        if (!token || !encryptionKey) {
            set({ error: 'Non authentifié' });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const { data, iv, authTag, fileName } = await api.downloadFile(token, fileId);
            const ivBytes = base64ToArrayBuffer(iv);
            const tagBytes = base64ToArrayBuffer(authTag);

            // Recombine data and tag for WebCrypto decrypt
            const combined = new Uint8Array(data.byteLength + tagBytes.byteLength);
            combined.set(new Uint8Array(data), 0);
            combined.set(tagBytes, data.byteLength);

            const decrypted = await decryptFile(combined.buffer as ArrayBuffer, ivBytes, encryptionKey);

            const blob = new Blob([decrypted]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);

            get().addToast('Fichier déchiffré et téléchargé', 'success');
            set({ isLoading: false });
            await get().fetchActivity();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Erreur lors du téléchargement',
            });
            get().addToast('Erreur lors du téléchargement', 'error');
        }
    },

    /**
     * 🗑️ Suppression
     */
    deleteFile: async (fileId: string) => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        set({ isLoading: true, error: null });

        try {
            await api.deleteFile(token, fileId);
            await get().fetchFiles();
            await get().fetchActivity();
            get().addToast('Fichier supprimé définitivement', 'info');
            set({ isLoading: false });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.response?.data?.detail || 'Erreur lors de la suppression',
            });
            get().addToast('Erreur lors de la suppression', 'error');
        }
    },

    /**
     * 🏷️ Update tags
     */
    updateFileTags: async (fileId: string, tags: string[]) => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        try {
            await api.updateFileTags(token, fileId, tags);
            await get().fetchFiles();
            await get().fetchActivity();
            get().addToast('Tags mis à jour', 'success');
        } catch {
            get().addToast('Erreur lors de la mise à jour des tags', 'error');
        }
    },

    setActiveTag: (tag: string | null) => {
        set({ activeTag: tag });
    },

    /**
     * 🔍 Search
     */
    searchFiles: async (query: string) => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        if (!query.trim()) {
            set({ searchResults: [], isSearching: false });
            return;
        }

        set({ isSearching: true });

        try {
            const { results } = await api.searchFiles(token, query);
            set({ searchResults: results as VeilFile[], isSearching: false });
        } catch {
            set({ isSearching: false });
        }
    },

    setSearchQuery: (query: string) => {
        set({ searchQuery: query });
    },

    /**
     * 📋 Fetch activity
     */
    fetchActivity: async () => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        try {
            const { activities } = await api.getActivityHistory(token, 30);
            set({ activities: activities || [] });
        } catch {
            // Silent fail
        }
    },

    /**
     * Toast system
     */
    addToast: (message: string, type: 'success' | 'error' | 'info') => {
        const id = crypto.randomUUID();
        set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => {
            get().removeToast(id);
        }, 3500);
    },

    removeToast: (id: string) => {
        set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    },

    clearError: () => set({ error: null }),
}));
