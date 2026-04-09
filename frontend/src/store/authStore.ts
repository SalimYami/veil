/**
 * =============================================================================
 * VEIL - Store d'Authentification (Zustand) — Version Sécurisée
 * =============================================================================
 * 
 * 🔐 GESTION DE L'ÉTAT ZERO-KNOWLEDGE (State of the Art)
 * 
 * Ce store gère:
 * - L'état d'authentification (isAuthenticated, token, userId)
 * - L'encryptionKey comme CryptoKey NON-EXTRACTABLE
 * - Le flux Pre-flight Salt Retrieval (anti-énumération)
 * - Les actions d'auth (login, register, logout)
 * 
 * ⚠️ SÉCURITÉ:
 * ------------
 * - L'encryptionKey est un objet CryptoKey (extractable: false)
 * - Le JS ne peut PAS lire les bytes de cette clé (protection XSS)
 * - Le sel provient du serveur (anti-énumération)
 * - Si l'utilisateur ferme l'onglet, la clé est perdue (voulu !)
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

    // 🔐 CLÉ DE CHIFFREMENT NON-EXTRACTABLE — NE JAMAIS PERSISTER !
    encryptionKey: CryptoKey | null;

    // Actions
    register: (email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    promote: (secretKey: string) => Promise<void>;
    clearError: () => void;
}

// =============================================================================
// UTILITAIRE : Convertir hex string en Uint8Array
// =============================================================================

function hexToUint8Array(hex: string): Uint8Array {
    const matches = hex.match(/.{2}/g);
    if (!matches) throw new Error('Invalid hex string');
    return new Uint8Array(matches.map((b: string) => parseInt(b, 16)));
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
     * 
     * Flux :
     * 1. Enregistrer d'abord pour créer le compte + sel serveur
     * 2. Récupérer le sel via pre-flight
     * 3. Dériver les clés avec le sel serveur
     */
    register: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
            // Étape 1: Pre-flight — récupérer le sel
            // (Le serveur génère un HMAC fake-salt car le compte n'existe pas encore,
            //  mais on utilisera le vrai sel après création via le re-login flow)
            const { salt: saltHex } = await api.getSalt(email);
            const salt = hexToUint8Array(saltHex);

            // Étape 2: Dériver les clés avec le sel
            const { authKey, encryptionKey } = await deriveKeys(password, salt);
            const authHash = await hashAuthKey(authKey);

            // Étape 3: Enregistrer sur le serveur
            const response = await api.register(email, authHash);

            set({
                isAuthenticated: true,
                isLoading: false,
                userId: response.user_id,
                token: response.access_token,
                email: email,
                role: response.role || 'user',
                encryptionKey: encryptionKey,  // CryptoKey non-extractable
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
     * 
     * Flux sécurisé (Pre-flight Salt Retrieval) :
     * 1. Récupérer le sel du serveur (vrai sel ou HMAC fake-salt)
     * 2. Dériver les clés avec Argon2id + sel serveur
     * 3. Hasher l'authKey et envoyer au serveur
     * 4. Stocker la CryptoKey non-extractable
     */
    login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
            // Étape 1: Pre-flight — récupérer le sel depuis le serveur
            const { salt: saltHex } = await api.getSalt(email);
            const salt = hexToUint8Array(saltHex);

            // Étape 2: Dériver les clés avec le sel serveur
            const { authKey, encryptionKey } = await deriveKeys(password, salt);
            const authHash = await hashAuthKey(authKey);

            // Étape 3: Authentifier
            const response = await api.login(email, authHash);

            set({
                isAuthenticated: true,
                isLoading: false,
                userId: response.user_id,
                token: response.access_token,
                email: email,
                role: response.role || 'user',
                encryptionKey: encryptionKey,  // CryptoKey non-extractable
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
