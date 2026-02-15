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
    auth_tag: string;
    size: number;
    mime_type?: string;
    tags?: string[];
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
 * Upload un fichier chiffré (presigned URL flow).
 * 
 * @param token - JWT de l'utilisateur
 * @param fileName - Nom original du fichier
 * @param iv - Vecteur d'initialisation (Base64)
 * @param authTag - Tag d'authentification AES-GCM (Base64)
 * @param encryptedData - Données chiffrées
 * @param mimeType - Type MIME (optionnel)
 */
export async function uploadFile(
    token: string,
    fileName: string,
    iv: string,
    authTag: string,
    encryptedData: Uint8Array,
    mimeType?: string
): Promise<{ file_id: string }> {
    // Step 1: Request presigned upload URL
    const initResponse = await api.post('/api/files/upload-init', {
        file_name: fileName,
        iv: iv,
        auth_tag: authTag,
        file_size: encryptedData.byteLength,
        mime_type: mimeType
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const { upload_url, file_id } = initResponse.data;

    // Step 2: Upload directly to MinIO using presigned URL
    await axios.put(upload_url, encryptedData, {
        headers: {
            'Content-Type': 'application/octet-stream'
        }
    });

    // Step 3: Confirm upload to backend
    await api.post('/api/files/upload-confirm', {
        file_id: file_id
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });

    return { file_id };
}

/**
 * Télécharge un fichier chiffré (presigned URL flow).
 * 
 * @returns Le blob chiffré, l'IV et l'auth_tag nécessaires pour le déchiffrer
 */
export async function downloadFile(
    token: string,
    fileId: string
): Promise<{ data: ArrayBuffer; iv: string; authTag: string; fileName: string }> {
    // Step 1: Request presigned download URL
    const urlResponse = await api.get(`/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const { download_url, file_name, iv, auth_tag } = urlResponse.data;

    // Step 2: Download directly from MinIO using presigned URL
    const fileResponse = await axios.get(download_url, {
        responseType: 'arraybuffer'
    });

    return {
        data: fileResponse.data,
        iv: iv,
        authTag: auth_tag,
        fileName: file_name
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

// =============================================================================
// TAGS, RECHERCHE, ACTIVITÉ
// =============================================================================

/**
 * Met à jour les tags d'un fichier.
 */
export async function updateFileTags(token: string, fileId: string, tags: string[]): Promise<{ tags: string[] }> {
    const response = await api.put(`/api/files/${fileId}/tags`,
        { tags },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
}

/**
 * Recherche de fichiers par nom avec suggestions.
 */
export async function searchFiles(token: string, query: string): Promise<{ results: FileMetadata[]; query: string }> {
    const response = await api.get('/api/files/search', {
        params: { q: query },
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

export interface ActivityEntry {
    action: 'upload' | 'download' | 'delete' | 'tag';
    file_name: string;
    file_id: string;
    timestamp: string;
    details: string;
}

/**
 * Récupère l'historique d'activité de l'utilisateur.
 */
export async function getActivityHistory(token: string, limit: number = 50): Promise<{ activities: ActivityEntry[] }> {
    const response = await api.get<ActivityEntry[]>('/api/activity', {
        params: { limit },
        headers: { Authorization: `Bearer ${token}` },
    });
    return { activities: response.data };
}

export default api;

