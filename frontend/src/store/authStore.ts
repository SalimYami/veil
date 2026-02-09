/**
 * =============================================================================
 * VEIL - Store d'Authentification (Zustand)
 * =============================================================================
 * 
 * 🔐 GESTION DE L'ÉTAT ZERO-KNOWLEDGE
 * 
 * Ce store gère:
 * - L'état d'authentification (isAuthenticated, token, userId)
 * - L'encryptionKey (CRITIQUE: reste en mémoire uniquement!)
 * - Les actions d'auth (login, register, logout)
 * 
 * ⚠️ SÉCURITÉ:
 * ------------
 * - L'encryptionKey est stockée UNIQUEMENT en RAM (pas de localStorage!)
 * - Si l'utilisateur ferme l'onglet, la clé est perdue
 * - C'est voulu ! Cela empêche le vol de clé par accès physique
 * 
 * =============================================================================
 */

import { create } from 'zustand';
import { deriveKeys, hashAuthKey } from '../lib/crypto';
import * as api from '../lib/api';

// =============================================================================
// TYPES
// =============================================================================

interface AuthState {
    // État d'authentification
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Données utilisateur
    userId: string | null;
    token: string | null;
    email: string | null;
    role: string | null;

    // 🔐 CLÉ DE CHIFFREMENT - NE JAMAIS PERSISTER !
    encryptionKey: Uint8Array | null;

    // Actions
    register: (email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    promote: (secretKey: string) => Promise<void>;
    clearError: () => void;
}

// =============================================================================
// STORE ZUSTAND
// =============================================================================

export const useAuthStore = create<AuthState>((set, get) => ({
    // État initial
    isAuthenticated: false,
    isLoading: false,
    error: null,
    userId: null,
    token: null,
    email: null,
    role: null,
    encryptionKey: null,

    /**
     * 📝 INSCRIPTION
     */
    register: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
            const { authKey, encryptionKey } = await deriveKeys(password, email);
            const authHash = await hashAuthKey(authKey);
            const response = await api.register(email, authHash);

            set({
                isAuthenticated: true,
                isLoading: false,
                userId: response.user_id,
                token: response.access_token,
                email: email,
                role: response.role || 'user',
                encryptionKey: encryptionKey,
            });
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.response?.data?.detail || 'Erreur lors de l\'inscription',
            });
            throw error;
        }
    },

    /**
     * 🔑 CONNEXION
     */
    login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
            const { authKey, encryptionKey } = await deriveKeys(password, email);
            const authHash = await hashAuthKey(authKey);
            const response = await api.login(email, authHash);

            set({
                isAuthenticated: true,
                isLoading: false,
                userId: response.user_id,
                token: response.access_token,
                email: email,
                role: response.role || 'user',
                encryptionKey: encryptionKey,
            });
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.response?.data?.detail || 'Email ou mot de passe incorrect',
            });
            throw error;
        }
    },

    /**
     * 🚪 DÉCONNEXION
     */
    logout: () => {
        set({
            isAuthenticated: false,
            userId: null,
            token: null,
            email: null,
            role: null,
            encryptionKey: null,
            error: null,
        });
    },

    /**
     * 🚀 PROMOTION ADMIN
     */
    promote: async (secretKey: string) => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true, error: null });
        try {
            const { role } = await api.promoteToAdmin(token, secretKey);
            set({ role, isLoading: false });
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.response?.data?.detail || 'Clé de sécurité invalide',
            });
            throw error;
        }
    },

    /**
     * Efface le message d'erreur.
     */
    clearError: () => set({ error: null }),
}));
