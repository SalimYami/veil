# 🔐 VEIL - Comment Ça Marche ?

> **"Vos secrets, invisibles dans le cloud"**

Ce document explique en détail le fonctionnement de VEIL, un système de stockage cloud **zero-knowledge** où le serveur ne voit **JAMAIS** vos données en clair.

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#-vue-densemble)
2. [Architecture Zero-Knowledge](#-architecture-zero-knowledge)
3. [Démarrage Rapide](#-démarrage-rapide)
4. [Flux d'Authentification](#-flux-dauthentification)
5. [Flux de Chiffrement des Fichiers](#-flux-de-chiffrement-des-fichiers)
6. [Structure du Code](#-structure-du-code)
7. [Technologies Utilisées](#-technologies-utilisées)
8. [FAQ Sécurité](#-faq-sécurité)

---

## 🎯 Vue d'Ensemble

VEIL est une application de stockage de fichiers sécurisée avec **chiffrement côté client**. 

### Le Principe Fondamental

```
┌─────────────────┐         ┌─────────────────┐
│   NAVIGATEUR    │         │     SERVEUR     │
│                 │         │                 │
│  📄 → 🔒 → 📦   │ ──────► │   📦 📦 📦     │
│                 │         │   (illisible)   │
│     VOS YEUX    │         │    AVEUGLE      │
└─────────────────┘         └─────────────────┘
```

**En résumé :**
- ✅ Le **chiffrement** se fait dans votre navigateur
- ✅ Le serveur ne reçoit que des **blobs chiffrés** (illisibles)
- ✅ Seul **vous** possédez la clé de déchiffrement
- ⚠️ Si vous perdez votre mot de passe, vos données sont **DÉFINITIVEMENT** perdues

---

## 🔐 Architecture Zero-Knowledge

### Pourquoi "Zero-Knowledge" ?

Le serveur ne peut **JAMAIS** :
- Lire le contenu de vos fichiers
- Déchiffrer vos données
- Récupérer votre mot de passe
- Accéder à vos clés de chiffrement

### Le Secret : La Dérivation de Clés

À partir de votre mot de passe, on dérive **DEUX clés distinctes** :

```
                    ┌─────────────────────────────────────┐
                    │     MOT DE PASSE + EMAIL            │
                    │        "MonSuperMotDePasse"         │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │          ARGON2id (WASM)            │
                    │   • 64 MB de mémoire                │
                    │   • 3 itérations                    │
                    │   • Résistant aux attaques GPU      │
                    └─────────────────┬───────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
          ┌──────────────────────┐   ┌──────────────────────┐
          │      AUTH KEY        │   │   ENCRYPTION KEY     │
          │   (256 bits)         │   │   (256 bits)         │
          │                      │   │                      │
          │ → Hashée et envoyée  │   │ → JAMAIS envoyée !   │
          │   au serveur pour    │   │   Reste dans le      │
          │   s'authentifier     │   │   navigateur (RAM)   │
          └──────────────────────┘   └──────────────────────┘
```

---

## 🚀 Démarrage Rapide

### 1. Lancer le Backend

```bash
cd veil/backend
pip install -r requirements.txt
python main.py
```

L'API sera disponible sur `http://localhost:8000`

> 📖 Documentation Swagger : `http://localhost:8000/docs`

### 2. Lancer le Frontend

```bash
cd veil/frontend
pnpm install
pnpm run dev
```

L'application sera sur `http://localhost:5173`

### 3. Utilisation

1. **Créer un compte** : Entrez email + mot de passe
2. **Attendre la dérivation** : ~2 secondes (Argon2 travaille)
3. **Uploader des fichiers** : Glissez-déposez dans la zone
4. **Télécharger** : Cliquez sur le bouton de téléchargement

---

## 🔑 Flux d'Authentification

### Inscription (Register)

```
UTILISATEUR                    NAVIGATEUR                      SERVEUR
    │                              │                              │
    │  email + mot de passe        │                              │
    ├─────────────────────────────►│                              │
    │                              │                              │
    │                     Argon2id │                              │
    │                     ┌────────┤                              │
    │                     │        │                              │
    │                     │ Dérive 2 clés:                        │
    │                     │ • authKey                             │
    │                     │ • encryptionKey                       │
    │                     │        │                              │
    │                     └────────┤                              │
    │                              │                              │
    │                     SHA-256  │                              │
    │                     ┌────────┤                              │
    │                     │        │                              │
    │                     │ authHash = SHA256(authKey)            │
    │                     │        │                              │
    │                     └────────┤                              │
    │                              │                              │
    │                              │  { email, authHash }         │
    │                              ├─────────────────────────────►│
    │                              │                              │
    │                              │                     bcrypt + │
    │                              │                     stockage │
    │                              │                              │
    │                              │       { JWT token }          │
    │                              │◄─────────────────────────────┤
    │                              │                              │
    │                     Stocke:  │                              │
    │                     • token (sessionStorage)                │
    │                     • encryptionKey (RAM)                   │
    │                              │                              │
    │      Dashboard affiché       │                              │
    │◄─────────────────────────────┤                              │
```

### Connexion (Login)

Le processus est identique :
1. Re-dériver les clés à partir du mot de passe
2. Hasher l'authKey et l'envoyer au serveur
3. Le serveur compare avec le hash stocké
4. Si OK → JWT retourné

> ⚠️ **IMPORTANT** : Si le mot de passe est incorrect, les clés dérivées seront différentes et le fichier ne pourra pas être déchiffré, même si le serveur était compromis !

---

## 📤 Flux de Chiffrement des Fichiers

### Upload

```
1. SÉLECTION DU FICHIER
   └─► confidential.pdf (2 MB)

2. LECTURE DU FICHIER
   └─► ArrayBuffer (données brutes)

3. CHIFFREMENT (dans le navigateur)
   ├─► Génère un IV aléatoire (12 bytes)
   ├─► Chiffre avec AES-256-GCM
   │   • Clé: encryptionKey (de la RAM)
   │   • Mode: GCM (authenticated encryption)
   └─► Résultat: blob chiffré + IV

4. ENVOI AU SERVEUR
   └─► POST /api/files/upload
       • Headers: Authorization: Bearer <JWT>
       • Body: { file_name, iv, encrypted_blob }

5. STOCKAGE SERVEUR
   └─► Le serveur stocke le blob tel quel (ILLISIBLE !)
       Il ne peut pas le déchiffrer sans l'encryptionKey
```

### Download

```
1. REQUÊTE AU SERVEUR
   └─► GET /api/files/{id}
       Headers: Authorization: Bearer <JWT>

2. RÉCEPTION DU BLOB CHIFFRÉ
   └─► Response: encrypted_blob + IV (dans les headers)

3. DÉCHIFFREMENT (dans le navigateur)
   ├─► Récupère l'encryptionKey de la RAM
   ├─► Déchiffre avec AES-256-GCM
   └─► Résultat: fichier original

4. TÉLÉCHARGEMENT
   └─► Le navigateur propose le téléchargement du fichier déchiffré
```

### Pourquoi AES-256-GCM ?

| Caractéristique | Avantage |
|-----------------|----------|
| **AES-256** | Standard militaire (FIPS 140-2) |
| **Mode GCM** | Authenticated Encryption = intégrité + confidentialité |
| **WebCrypto** | Accélération matérielle (Intel AES-NI) |
| **Tag 128 bits** | Détecte toute modification des données |

---

## 📁 Structure du Code

```
veil/
├── backend/                     # API Python (FastAPI)
│   ├── main.py                  # Point d'entrée (921 lignes)
│   │   ├── Routes Auth          # /api/auth/register, login, refresh
│   │   ├── Routes Files         # /api/files/, upload, download, delete
│   │   └── Middleware           # CORS, Logging, Auth JWT
│   └── storage/                 # Fichiers chiffrés stockés
│
└── frontend/                    # React + TypeScript + Vite
    ├── src/
    │   ├── lib/
    │   │   ├── api.ts           # Client HTTP (axios)
    │   │   └── crypto.ts        # 🔐 Argon2 + AES-256-GCM
    │   │
    │   ├── store/
    │   │   ├── authStore.ts     # État authentication (Zustand)
    │   │   └── fileStore.ts     # État fichiers (upload/download)
    │   │
    │   └── components/
    │       ├── AuthForm.tsx     # Formulaire login/register
    │       ├── Dashboard.tsx    # Page principale
    │       ├── FileUploader.tsx # Zone drag & drop
    │       └── FileList.tsx     # Liste des fichiers
    │
    └── public/                  # Assets statiques
```

### Fichiers Clés à Comprendre

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `crypto.ts` | Cœur du chiffrement zero-knowledge | 295 |
| `authStore.ts` | Gestion de l'encryptionKey en RAM | 183 |
| `fileStore.ts` | Upload/download avec chiffrement | 207 |
| `main.py` | API FastAPI complète | 921 |

---

## 🛠️ Technologies Utilisées

### Frontend

| Technologie | Usage |
|-------------|-------|
| **React 18** | Framework UI |
| **TypeScript** | Typage statique |
| **Vite** | Build tool ultra-rapide |
| **Zustand** | State management léger |
| **argon2-browser** | Dérivation de clés (WASM) |
| **WebCrypto API** | Chiffrement AES-256-GCM |
| **Axios** | Client HTTP |
| **Lucide React** | Icônes |

### Backend

| Technologie | Usage |
|-------------|-------|
| **FastAPI** | Framework API Python |
| **Uvicorn** | Serveur ASGI |
| **python-jose** | JWT tokens |
| **passlib[bcrypt]** | Hashing des auth_hash |
| **pydantic** | Validation des données |

### Cryptographie

| Algorithme | Usage |
|------------|-------|
| **Argon2id** | Dérivation de clés (résistant GPU/ASIC) |
| **SHA-256** | Hashage de l'authKey |
| **AES-256-GCM** | Chiffrement des fichiers |
| **bcrypt** | Hashing côté serveur |

---

## ❓ FAQ Sécurité

### Q: Que se passe-t-il si le serveur est piraté ?

**R:** L'attaquant récupère uniquement des blobs chiffrés **illisibles**. Sans votre mot de passe, il ne peut pas dériver l'encryptionKey et donc ne peut pas déchiffrer vos fichiers.

### Q: Pourquoi utiliser Argon2id ?

**R:** Argon2id est le gagnant du Password Hashing Competition (2015). Il est :
- Résistant aux attaques par GPU/ASIC (utilise beaucoup de mémoire)
- Recommandé par l'OWASP
- Plus sûr que bcrypt/scrypt pour la dérivation de clés

### Q: Où est stockée l'encryptionKey ?

**R:** **Uniquement en RAM** (mémoire vive du navigateur). Elle n'est :
- ❌ Jamais envoyée au serveur
- ❌ Jamais stockée en localStorage/sessionStorage
- ❌ Jamais écrite sur le disque

Si vous fermez l'onglet, la clé est perdue et vous devez vous reconnecter.

### Q: Comment fonctionne le JWT ?

**R:** 
- **Access Token** : Durée courte (15 min), utilisé pour chaque requête API
- **Refresh Token** : Durée longue (7 jours), permet de renouveler l'access token
- Stockés en sessionStorage (disparaît à la fermeture du navigateur)

### Q: Que faire si j'oublie mon mot de passe ?

**R:** **VOS DONNÉES SONT PERDUES DÉFINITIVEMENT.** C'est le prix de la sécurité zero-knowledge. Aucun mécanisme de récupération n'existe car le serveur ne possède pas les clés.

---

## 🔒 Résumé de la Sécurité

```
┌──────────────────────────────────────────────────────────────┐
│                    VEIL SECURITY MODEL                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ Mot de passe → Argon2id → authKey + encryptionKey       │
│                                                              │
│  ✅ authKey → SHA-256 → authHash → Serveur (stocké hashé)   │
│                                                              │
│  ✅ encryptionKey → RAM uniquement → JAMAIS au serveur      │
│                                                              │
│  ✅ Fichier → AES-256-GCM(encryptionKey) → Blob chiffré     │
│                                                              │
│  ✅ Serveur stocke uniquement le blob → AVEUGLE             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

**🔐 VEIL - Vos secrets restent les vôtres.**
