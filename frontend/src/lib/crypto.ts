/**
 * =============================================================================
 * VEIL - Module Cryptographique Côté Client (State of the Art)
 * =============================================================================
 * 
 * 🔐 ZERO-KNOWLEDGE + CLÉ NON-EXTRACTABLE
 * 
 * Ce module gère:
 * 1. Dérivation de clés avec Argon2id (mot de passe + sel serveur → clés)
 * 2. Import de la clé de chiffrement comme CryptoKey non-extractable
 * 3. Chiffrement AES-256-GCM (fichiers → blobs chiffrés)
 * 4. Déchiffrement (blobs → fichiers originaux)
 * 
 * ⚠️ SÉCURITÉ:
 * - L'encryptionKey est un objet CryptoKey avec extractable=false
 * - Le navigateur refuse physiquement d'exporter les bytes de la clé
 * - Même un script XSS ne peut pas lire la clé
 * - Les bytes bruts sont zéroïsés en mémoire après import
 * 
 * =============================================================================
 */

// Import de hash-wasm pour Argon2id (WASM bien packagé, compatible Vite)
import { argon2id } from 'hash-wasm';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Résultat de la dérivation de clés.
 * 
 * @property authKey - Clé d'authentification (envoyée au serveur, hashée)
 * @property encryptionKey - CryptoKey non-extractable (JAMAIS accessible en JS!)
 */
export interface DerivedKeys {
  authKey: Uint8Array;
  encryptionKey: CryptoKey;  // ← Non-extractable : le JS ne peut plus lire les bytes
}

/**
 * Résultat du chiffrement d'un fichier.
 * 
 * @property ciphertext - Données chiffrées
 * @property iv - Vecteur d'initialisation (nécessaire pour déchiffrer)
 */
export interface EncryptedData {
  ciphertext: Uint8Array;
  iv: Uint8Array;
}

// =============================================================================
// DÉRIVATION DE CLÉS (Argon2id + CryptoKey non-extractable)
// =============================================================================

/**
 * Dérive deux clés à partir du mot de passe et d'un sel serveur.
 * 
 * 🔑 CHANGEMENTS "STATE OF THE ART" :
 * ------------------------------------
 * 1. Le sel provient du serveur (pas de SHA-256(email) déterministe)
 * 2. La clé de chiffrement est importée comme CryptoKey avec extractable=false
 * 3. Les bytes bruts de la clé sont zéroïsés après import
 * 
 * 📊 PARAMÈTRES ARGON2ID:
 * ----------------------
 * - memory: 65536 KB (64 MB) - Rend les attaques par force brute très coûteuses
 * - iterations: 3 - Nombre de passes (recommandé par OWASP)
 * - parallelism: 4 - Utilise 4 threads
 * - hashLen: 64 bytes - Produit 512 bits, qu'on divise en 2 clés de 256 bits
 * 
 * @param password - Mot de passe en clair (jamais stocké!)
 * @param salt - Sel cryptographique unique fourni par le serveur
 * @returns Les deux clés dérivées (authKey brute + encryptionKey non-extractable)
 */
export async function deriveKeys(password: string, salt: Uint8Array): Promise<DerivedKeys> {
  console.log('🔑 Dérivation des clés avec Argon2id (hash-wasm)...');

  // Étape 1: Dériver les clés avec Argon2id via hash-wasm
  const hashHex = await argon2id({
    password: password,
    salt: salt,
    iterations: 3,      // Nombre de passes (time)
    memorySize: 65536,  // 64 MB de mémoire
    parallelism: 4,     // 4 threads
    hashLength: 64,     // 512 bits de sortie
    outputType: 'hex'   // Sortie en hexadécimal
  });

  // Convertir le hex en Uint8Array
  const derivedBytes = new Uint8Array(hashHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

  // Étape 2: Diviser en deux clés de 256 bits chacune
  const authKey = derivedBytes.slice(0, 32);        // Premiers 256 bits
  const encKeyRaw = derivedBytes.slice(32, 64);     // Derniers 256 bits

  // ══════════════════════════════════════════════════════
  // IMPORT NON-EXTRACTABLE (Protection XSS)
  // ══════════════════════════════════════════════════════
  // Le navigateur stocke la clé dans son module crypto C++.
  // JavaScript ne peut PLUS lire les octets de cette clé.
  // crypto.subtle.exportKey() lèvera une DOMException.
  const encryptionKey = await crypto.subtle.importKey(
    'raw',
    encKeyRaw.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,            // ← extractable: false = la clé est VERROUILLÉE
    ['encrypt', 'decrypt']
  );

  // Étape 3: Zéroïser les bytes bruts de la clé en mémoire
  // Même si un attaquant dumpe la RAM, les bytes sont détruits
  encKeyRaw.fill(0);
  derivedBytes.fill(0);

  console.log('✅ Clés dérivées avec succès');
  console.log('   - authKey: prête à être hashée et envoyée au serveur');
  console.log('   - encryptionKey: CryptoKey non-extractable (sécurisée)');

  return { authKey, encryptionKey };
}

// =============================================================================
// HASHAGE DE L'AUTH KEY (avant envoi au serveur)
// =============================================================================

/**
 * Hash l'authKey avec SHA-256 avant de l'envoyer au serveur.
 * 
 * 🔐 POURQUOI HASHER ?
 * --------------------
 * Même si un attaquant intercepte le hash, il ne peut pas:
 * 1. Retrouver l'authKey originale (SHA-256 est one-way)
 * 2. Dériver l'encryptionKey (elles sont indépendantes)
 * 
 * @param authKey - La clé d'authentification brute
 * @returns Le hash en format hexadécimal
 */
export async function hashAuthKey(authKey: Uint8Array): Promise<string> {
  const keyBuffer = new Uint8Array(authKey).buffer as ArrayBuffer;
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer as ArrayBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// =============================================================================
// CHIFFREMENT DE FICHIERS (AES-256-GCM)
// =============================================================================

/**
 * Chiffre un fichier avec AES-256-GCM.
 * 
 * 🔐 POURQUOI AES-256-GCM ?
 * -------------------------
 * - AES-256: Standard militaire, approuvé par la NSA pour documents TOP SECRET
 * - GCM (Galois/Counter Mode): 
 *   - Authenticated Encryption: garantit confidentialité ET intégrité
 *   - Le tag d'authentification détecte toute modification
 *   - Parallélisable: rapide sur multi-core
 * 
 * 📊 CHANGEMENT: Accepte directement un CryptoKey (plus besoin d'importer)
 * 
 * @param file - ArrayBuffer du fichier à chiffrer
 * @param encryptionKey - CryptoKey non-extractable (256 bits)
 * @returns Les données chiffrées et l'IV
 */
export async function encryptFile(
  file: ArrayBuffer,
  encryptionKey: CryptoKey
): Promise<EncryptedData> {
  console.log('🔒 Chiffrement du fichier avec AES-256-GCM...');

  // Étape 1: Générer un IV aléatoire (12 bytes = 96 bits recommandé pour GCM)
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  // Étape 2: Chiffrer avec AES-GCM (la clé est déjà un CryptoKey)
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
      tagLength: 128
    },
    encryptionKey,
    file
  );

  console.log(`✅ Fichier chiffré: ${file.byteLength} bytes → ${(ciphertext as ArrayBuffer).byteLength} bytes`);
  console.log(`   (${(ciphertext as ArrayBuffer).byteLength - file.byteLength} bytes de overhead = IV + tag)`);

  return {
    ciphertext: new Uint8Array(ciphertext as ArrayBuffer),
    iv: iv
  };
}

// =============================================================================
// DÉCHIFFREMENT DE FICHIERS
// =============================================================================

/**
 * Déchiffre un fichier avec AES-256-GCM.
 * 
 * 🔄 PROCESSUS:
 * -------------
 * 1. Utiliser le CryptoKey non-extractable directement
 * 2. Utiliser l'IV fourni (celui utilisé lors du chiffrement)
 * 3. Déchiffrer et vérifier le tag d'authentification
 * 
 * ⚠️ SI LE TAG EST INVALIDE:
 * --------------------------
 * WebCrypto lèvera une erreur ! Cela signifie que:
 * - Le fichier a été modifié (corruption ou attaque)
 * - La clé est incorrecte (mauvais mot de passe)
 * - L'IV est incorrect
 * 
 * @param ciphertext - Données chiffrées (inclut le tag à la fin)
 * @param iv - Vecteur d'initialisation utilisé lors du chiffrement
 * @param encryptionKey - CryptoKey non-extractable
 * @returns Le fichier original déchiffré
 */
export async function decryptFile(
  ciphertext: ArrayBuffer,
  iv: Uint8Array,
  encryptionKey: CryptoKey
): Promise<ArrayBuffer> {
  console.log('🔓 Déchiffrement du fichier...');

  const ivBuffer = new Uint8Array(iv).buffer as ArrayBuffer;
  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
        tagLength: 128
      },
      encryptionKey,
      ciphertext
    );

    console.log(`✅ Fichier déchiffré: ${(ciphertext as ArrayBuffer).byteLength} bytes → ${(decrypted as ArrayBuffer).byteLength} bytes`);
    return decrypted as ArrayBuffer;

  } catch {
    // Si le déchiffrement échoue, c'est que les données sont corrompues
    // ou que la clé est incorrecte
    console.error('❌ Échec du déchiffrement - données corrompues ou clé incorrecte');
    throw new Error('Impossible de déchiffrer le fichier. Vérifiez votre mot de passe.');
  }
}

// =============================================================================
// UTILITAIRES
// =============================================================================

/**
 * Convertit un Uint8Array en chaîne Base64.
 * Utilisé pour transmettre l'IV au serveur.
 */
export function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

/**
 * Convertit une chaîne Base64 en Uint8Array.
 * Utilisé pour récupérer l'IV du serveur.
 */
export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
