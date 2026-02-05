/**
 * =============================================================================
 * VEIL - Formulaire d'Authentification
 * =============================================================================
 * 
 * Composant unifié pour login et inscription.
 * Gère la dérivation de clés et l'affichage des erreurs.
 * 
 * =============================================================================
 */

import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Lock, Mail, Eye, EyeOff, Loader2, Shield, KeyRound } from 'lucide-react';

export function AuthForm() {
    // État local du formulaire
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // État global d'authentification
    const { login, register, isLoading, error, clearError } = useAuthStore();

    /**
     * Soumission du formulaire
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        // Validation basique
        if (!email || !password) {
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            alert('Les mots de passe ne correspondent pas');
            return;
        }

        if (password.length < 8) {
            alert('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password);
            }
        } catch (err) {
            // L'erreur est déjà gérée dans le store
        }
    };

    return (
        <div className="auth-container">
            {/* En-tête avec logo */}
            <div className="auth-header">
                <div className="logo">
                    <Shield size={48} strokeWidth={1.5} />
                </div>
                <h1>VEIL</h1>
                <p className="tagline">Your secrets, invisible to the cloud</p>
            </div>

            {/* Explication Zero-Knowledge */}
            <div className="zk-info">
                <KeyRound size={20} />
                <div>
                    <strong>Chiffrement Zero-Knowledge</strong>
                    <p>Votre mot de passe génère une clé de chiffrement unique.
                        Elle ne quitte jamais votre navigateur.</p>
                </div>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit}>
                {/* Tabs Login/Register */}
                <div className="auth-tabs">
                    <button
                        type="button"
                        className={isLogin ? 'active' : ''}
                        onClick={() => { setIsLogin(true); clearError(); }}
                    >
                        Connexion
                    </button>
                    <button
                        type="button"
                        className={!isLogin ? 'active' : ''}
                        onClick={() => { setIsLogin(false); clearError(); }}
                    >
                        Inscription
                    </button>
                </div>

                {/* Champ Email */}
                <div className="input-group">
                    <Mail size={20} />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                {/* Champ Mot de passe */}
                <div className="input-group">
                    <Lock size={20} />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                    <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                {/* Confirmation mot de passe (inscription uniquement) */}
                {!isLogin && (
                    <div className="input-group">
                        <Lock size={20} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirmer le mot de passe"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                )}

                {/* Message d'erreur */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Bouton de soumission */}
                <button type="submit" className="submit-btn" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="spinner" size={20} />
                            {isLogin ? 'Connexion...' : 'Dérivation des clés...'}
                        </>
                    ) : (
                        isLogin ? 'Se connecter' : 'Créer un compte'
                    )}
                </button>
            </form>

            {/* Avertissement sécurité */}
            <div className="security-warning">
                <p>
                    ⚠️ <strong>Important:</strong> Si vous oubliez votre mot de passe,
                    vos fichiers seront <strong>définitivement perdus</strong>.
                    Aucune récupération possible.
                </p>
            </div>
        </div>
    );
}
