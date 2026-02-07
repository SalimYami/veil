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
import { Lock, Mail, Eye, EyeOff, Loader2, Shield, KeyRound, ArrowRight } from 'lucide-react';

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
            {/* En-tête avec logo animé */}
            <div className="auth-header">
                <div className="logo-wrapper">
                    <div className="logo-bg"></div>
                    <div className="logo">
                        <Shield size={42} strokeWidth={2} />
                    </div>
                </div>
                <h1>VEIL</h1>
                <p className="tagline">Zero-Knowledge Cloud Vault</p>
            </div>

            {/* Explication Zero-Knowledge */}
            <div className="zk-info">
                <KeyRound size={22} />
                <div>
                    <strong>Chiffrement de bout en bout</strong>
                    <p>Vos clés sont dérivées localement. Le serveur ne voit jamais votre mot de passe ni vos fichiers.</p>
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
                    <div className="input-wrapper">
                        <Mail size={18} />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Champ Mot de passe */}
                <div className="input-group">
                    <div className="input-wrapper">
                        <Lock size={18} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mot de passe principal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Confirmation mot de passe (inscription uniquement) */}
                {!isLogin && (
                    <div className="input-group">
                        <div className="input-wrapper">
                            <Lock size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Confirmer le mot de passe"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                )}

                {/* Message d'erreur */}
                {error && (
                    <div className="error-message">
                        <Shield size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Bouton de soumission */}
                <button type="submit" className="submit-btn" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="spinner" size={20} />
                            {isLogin ? 'Déchiffrement du coffre...' : 'Création des clés...'}
                        </>
                    ) : (
                        <>
                            {isLogin ? 'Ouvrir le coffre' : 'Créer mon coffre sécurisé'}
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>

            {/* Avertissement sécurité */}
            <div className="security-warning">
                <p>
                    ⚠️ <strong>Récupération Impossible</strong> <br />
                    En cas de perte de mot de passe, vos données sont cryptographiquement irrécupérables.
                </p>
            </div>
        </div>
    );
}
