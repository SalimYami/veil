/**
 * =============================================================================
 * VEIL - Module Cryptographique Côté Client
 * =============================================================================
 * 
 * 🔐 C'EST ICI QUE LA MAGIE ZERO-KNOWLEDGE OPÈRE !
 * 
 * Ce module gère:
 * 1. Dérivation de clés avec Argon2id (mot de passe → clés)
 * 2. Chiffrement AES-256-GCM (fichiers → blobs chiffrés)
 * 3. Déchiffrement (blobs → fichiers originaux)
 * 
 * ⚠️ IMPORTANT: L'encryptionKey ne quitte JAMAIS ce fichier !
 * Elle reste en mémoire et n'est jamais envoyée au serveur.
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
 * @property encryptionKey - Clé de chiffrement (JAMAIS envoyée au serveur!)
 */
export interface DerivedKeys {
  authKey: Uint8Array;
  encryptionKey: Uint8Array;
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
// DÉRIVATION DE CLÉS (Argon2id)
// =============================================================================

/**
 * Dérive deux clés à partir du mot de passe et de l'email.
 * 
 * 🔑 POURQUOI ARGON2ID ?
 * ---------------------
 * - Gagnant du Password Hashing Competition (2015)
 * - Résistant aux attaques GPU/ASIC (utilise beaucoup de mémoire)
 * - Combine Argon2i (résistant aux side-channel) et Argon2d (résistant au GPU)
 * 
 * 📊 PARAMÈTRES CHOISIS:
 * ----------------------
 * - memory: 65536 KB (64 MB) - Rend les attaques par force brute très coûteuses
 * - iterations: 3 - Nombre de passes (recommandé par OWASP)
 * - parallelism: 4 - Utilise 4 threads
 * - hashLen: 64 bytes - Produit 512 bits, qu'on divise en 2 clés de 256 bits
 * 
 * 🔄 PROCESSUS:
 * -------------
 * 1. Salt = SHA-256(email) → Salt déterministe basé sur l'email
 * 2. derivedKey = Argon2id(password, salt, params) → 512 bits
 * 3. authKey = derivedKey[0:32] → 256 bits pour l'authentification
 * 4. encryptionKey = derivedKey[32:64] → 256 bits pour le chiffrement
 * 
 * @param password - Mot de passe en clair (jamais stocké!)
 * @param email - Email de l'utilisateur (utilisé comme base pour le salt)
 * @returns Les deux clés dérivées
 */
export async function deriveKeys(password: string, email: string): Promise<DerivedKeys> {
  console.log('🔑 Dérivation des clés avec Argon2id (hash-wasm)...');

  // Étape 1: Créer un salt déterministe à partir de l'email
  // Pourquoi déterministe ? Pour pouvoir re-dériver les mêmes clés à la connexion !
  const encoder = new TextEncoder();
  const emailBytes = encoder.encode(email.toLowerCase());
  const saltHash = await crypto.subtle.digest('SHA-256', emailBytes);
  const salt = new Uint8Array(saltHash).slice(0, 16); // Argon2 veut 16 bytes

  // Étape 2: Dériver les clés avec Argon2id via hash-wasm
  // Cette bibliothèque WASM est bien packagée et compatible avec Vite !
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

  // Étape 3: Diviser en deux clés de 256 bits chacune
  const authKey = derivedBytes.slice(0, 32);        // Premiers 256 bits
  const encryptionKey = derivedBytes.slice(32, 64); // Derniers 256 bits

  console.log('✅ Clés dérivées avec succès');
  console.log('   - authKey: prête à être hashée et envoyée au serveur');
  console.log('   - encryptionKey: stockée en RAM uniquement');

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
  const hashBuffer = await crypto.subtle.digest('SHA-256', authKey);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
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
 * 📊 STRUCTURE DU RÉSULTAT:
 * -------------------------
 * - ciphertext: données chiffrées + tag d'authentification (16 bytes à la fin)
 * - iv: vecteur d'initialisation (12 bytes, unique par fichier)
 * 
 * ⚠️ RÈGLE CRITIQUE:
 * ------------------
 * Ne JAMAIS réutiliser le même IV avec la même clé !
 * C'est pourquoi on génère un IV aléatoire pour chaque fichier.
 * 
 * @param file - ArrayBuffer du fichier à chiffrer
 * @param encryptionKey - Clé de chiffrement (256 bits)
 * @returns Les données chiffrées et l'IV
 */
export async function encryptFile(
  file: ArrayBuffer,
  encryptionKey: Uint8Array
): Promise<EncryptedData> {
  console.log('🔒 Chiffrement du fichier avec AES-256-GCM...');

  // Étape 1: Générer un IV aléatoire (12 bytes = 96 bits recommandé pour GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Étape 2: Importer la clé pour WebCrypto
  const cryptoKey = await crypto.subtle.importKey(
    'raw',                    // Format de la clé
    encryptionKey,            // La clé brute (256 bits)
    { name: 'AES-GCM' },      // Algorithme
    false,                    // Non extractable (sécurité)
    ['encrypt']               // Utilisation autorisée
  );

  // Étape 3: Chiffrer avec AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128  // Tag d'authentification de 128 bits (16 bytes)
    },
    cryptoKey,
    file
  );

  console.log(`✅ Fichier chiffré: ${file.byteLength} bytes → ${ciphertext.byteLength} bytes`);
  console.log(`   (${ciphertext.byteLength - file.byteLength} bytes de overhead = IV + tag)`);

  return {
    ciphertext: new Uint8Array(ciphertext),
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
 * 1. Importer la clé de chiffrement
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
 * @param encryptionKey - Clé de déchiffrement (doit être la même que pour le chiffrement)
 * @returns Le fichier original déchiffré
 */
export async function decryptFile(
  ciphertext: ArrayBuffer,
  iv: Uint8Array,
  encryptionKey: Uint8Array
): Promise<ArrayBuffer> {
  console.log('🔓 Déchiffrement du fichier...');

  // Étape 1: Importer la clé
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encryptionKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Étape 2: Déchiffrer
  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      cryptoKey,
      ciphertext
    );

    console.log(`✅ Fichier déchiffré: ${ciphertext.byteLength} bytes → ${decrypted.byteLength} bytes`);
    return decrypted;

  } catch (error) {
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
