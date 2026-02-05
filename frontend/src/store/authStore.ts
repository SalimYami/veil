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

    // 🔐 CLÉ DE CHIFFREMENT - NE JAMAIS PERSISTER !
    encryptionKey: Uint8Array | null;

    // Actions
    register: (email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
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
    encryptionKey: null,

    /**
     * 📝 INSCRIPTION
     * 
     * Flux:
     * 1. Dériver les clés avec Argon2id
     * 2. Hasher l'authKey
     * 3. Envoyer email + authHash au serveur
     * 4. Stocker le token et l'encryptionKey en mémoire
     */
    register: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
            console.log('📝 Inscription en cours...');

            // Étape 1: Dériver les clés côté client
            const { authKey, encryptionKey } = await deriveKeys(password, email);

            // Étape 2: Hasher l'authKey avant de l'envoyer
            const authHash = await hashAuthKey(authKey);

            // Étape 3: Appeler l'API d'inscription
            const response = await api.register(email, authHash);

            // Étape 4: Stocker l'état authentifié
            set({
                isAuthenticated: true,
                isLoading: false,
                userId: response.user_id,
                token: response.access_token,
                email: email,
                // 🔐 L'encryptionKey reste en RAM - JAMAIS persistée !
                encryptionKey: encryptionKey,
            });

            console.log('✅ Inscription réussie !');
            console.log('🔐 encryptionKey stockée en mémoire (RAM only)');

        } catch (error: any) {
            console.error('❌ Erreur d\'inscription:', error);
            set({
                isLoading: false,
                error: error.response?.data?.detail || 'Erreur lors de l\'inscription',
            });
            throw error;
        }
    },

    /**
     * 🔑 CONNEXION
     * 
     * Même flux que l'inscription:
     * 1. Re-dériver les clés (le client ne les stocke pas!)
     * 2. Envoyer authHash pour vérification
     * 3. Récupérer le token et garder l'encryptionKey
     */
    login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
            console.log('🔑 Connexion en cours...');

            // Étape 1: Re-dériver les clés
            const { authKey, encryptionKey } = await deriveKeys(password, email);

            // Étape 2: Hasher l'authKey
            const authHash = await hashAuthKey(authKey);

            // Étape 3: Appeler l'API de connexion
            const response = await api.login(email, authHash);

            // Étape 4: Stocker l'état authentifié
            set({
                isAuthenticated: true,
                isLoading: false,
                userId: response.user_id,
                token: response.access_token,
                email: email,
                encryptionKey: encryptionKey,
            });

            console.log('✅ Connexion réussie !');

        } catch (error: any) {
            console.error('❌ Erreur de connexion:', error);
            set({
                isLoading: false,
                error: error.response?.data?.detail || 'Email ou mot de passe incorrect',
            });
            throw error;
        }
    },

    /**
     * 🚪 DÉCONNEXION
     * 
     * ⚠️ CRITIQUE: On efface l'encryptionKey de la mémoire !
     * Sans cette clé, les fichiers ne peuvent plus être déchiffrés.
     */
    logout: () => {
        console.log('🚪 Déconnexion...');
        console.log('🔐 encryptionKey effacée de la mémoire');

        set({
            isAuthenticated: false,
            userId: null,
            token: null,
            email: null,
            encryptionKey: null, // ⚠️ Clé effacée !
            error: null,
        });
    },

    /**
     * Efface le message d'erreur.
     */
    clearError: () => set({ error: null }),
}));
