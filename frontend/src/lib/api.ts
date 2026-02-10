/**
 * =============================================================================
 * VEIL - Client API
 * =============================================================================
 * 
 * Ce module gère toutes les communications avec le backend.
 * 
 * =============================================================================
 */

import axios from 'axios';

// URL de base de l'API (en développement)
const API_BASE_URL = 'http://localhost:8000';

// Instance Axios configurée
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// =============================================================================
// TYPES
// =============================================================================

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user_id: string;
    role: string;
    expires_in: number;
}

export interface FileMetadata {
    id: string;
    name: string;
    iv: string;
    size: number;
    created_at: string;
}

// =============================================================================
// AUTHENTIFICATION
// =============================================================================

/**
 * Inscription d'un nouvel utilisateur.
 * 
 * @param email - Email de l'utilisateur
 * @param authHash - Hash de l'authKey (SHA-256)
 */
export async function register(email: string, authHash: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', {
        email,
        auth_hash: authHash,
    });
    return response.data;
}

/**
 * Connexion d'un utilisateur existant.
 */
export async function login(email: string, authHash: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', {
        email,
        auth_hash: authHash,
    });
    return response.data;
}

// =============================================================================
// FICHIERS
// =============================================================================

/**
 * Récupère la liste des fichiers de l'utilisateur.
 */
export async function listFiles(token: string): Promise<FileMetadata[]> {
    const response = await api.get<FileMetadata[]>('/api/files', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

/**
 * Upload un fichier chiffré.
 * 
 * @param token - JWT de l'utilisateur
 * @param fileName - Nom original du fichier
 * @param iv - Vecteur d'initialisation (Base64)
 * @param encryptedData - Données chiffrées
 */
export async function uploadFile(
    token: string,
    fileName: string,
    iv: string,
    encryptedData: Uint8Array
): Promise<{ message: string; file_id: string }> {
    const formData = new FormData();
    formData.append('file_name', fileName);
    formData.append('iv', iv);
    formData.append('file', new Blob([new Uint8Array(encryptedData).buffer as ArrayBuffer]));

    const response = await api.post('/api/files/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
        },
    });
    return response.data;
}

/**
 * Télécharge un fichier chiffré.
 * 
 * @returns Le blob chiffré et l'IV nécessaire pour le déchiffrer
 */
export async function downloadFile(
    token: string,
    fileId: string
): Promise<{ data: ArrayBuffer; iv: string; fileName: string }> {
    const response = await api.get(`/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer',
    });

    return {
        data: response.data,
        iv: response.headers['x-file-iv'],
        fileName: response.headers['x-file-name'],
    };
}

/**
 * Supprime un fichier.
 */
export async function deleteFile(token: string, fileId: string): Promise<void> {
    await api.delete(`/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
}

// =============================================================================
// PREVIEW & ADMIN
// =============================================================================

export interface FilePreview {
    file_id: string;
    file_name: string;
    size_bytes: number;
    sha256_hash: string;
    preview_hex: string;
    preview_length: number;
    message: string;
}

export interface AdminFile {
    user_id: string;
    file_id: string;
    file_name: string;
    size_bytes: number;
    sha256_hash: string;
    created_at: string;
}

export interface AdminDashboard {
    system: { status: string; version: string; timestamp: string };
    users: { total: number; details: Array<{ email: string; files_count: number; storage_mb: number }> };
    storage: { total_files: number; total_size_bytes: number; total_size_mb: number; average_file_size_mb: number };
    limits: { max_file_size_mb: number; max_files_per_user: number };
}

/**
 * Prévisualise les données chiffrées d'un fichier.
 */
export async function getFilePreview(token: string, fileId: string): Promise<FilePreview> {
    const response = await api.get<FilePreview>(`/api/files/${fileId}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

/**
 * Récupère la liste de tous les fichiers stockés (admin).
 */
export async function getAdminStorage(token: string): Promise<{ total_files: number; files: AdminFile[] }> {
    const response = await api.get('/api/admin/storage', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

/**
 * Récupère le dashboard admin.
 */
export async function getAdminDashboard(token: string): Promise<AdminDashboard> {
    const response = await api.get('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

/**
 * Promeut l'utilisateur au rang d'admin avec une clé secrète
 */
export async function promoteToAdmin(token: string, secretKey: string): Promise<{ role: string }> {
    const response = await api.post('/api/auth/promote',
        { secret_key: secretKey },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
}

export default api;

