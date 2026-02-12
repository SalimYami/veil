import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Loader2, Shield, KeyRound, ArrowRight, AlertCircle } from 'lucide-react';
import { ModernInput } from './ModernInput';

export function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const { login, register, isLoading, error, clearError } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setFormError(null);

        if (!email || !password) {
            setFormError('Veuillez remplir tous les champs.');
            return;
        }

        if (password.length < 8) {
            setFormError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            setFormError('Les mots de passe ne correspondent pas.');
            return;
        }

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password);
            }
        } catch {
            // Error handled by store
        }
    };

    const handleTabSwitch = (loginMode: boolean) => {
        setIsLogin(loginMode);
        clearError();
        setFormError(null);
    };

    return (
        <div className="auth-container">
            {/* Logo & Header */}
            <div className="auth-header">
                <div className="logo-wrapper">
                    <div className="logo-bg"></div>
                    <div className="logo">
                        <Shield size={40} strokeWidth={1.8} />
                    </div>
                </div>
                <h1>VEIL</h1>
                <p className="tagline">Zero-Knowledge Cloud Vault</p>
            </div>

            {/* ZK Info */}
            <div className="zk-info">
                <KeyRound size={20} />
                <div>
                    <strong>Chiffrement de bout en bout</strong>
                    <p>Vos clés sont dérivées localement. Le serveur ne voit jamais votre mot de passe ni vos fichiers.</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <div className="auth-tabs">
                    <button
                        type="button"
                        className={isLogin ? 'active' : ''}
                        onClick={() => handleTabSwitch(true)}
                    >
                        Connexion
                    </button>
                    <button
                        type="button"
                        className={!isLogin ? 'active' : ''}
                        onClick={() => handleTabSwitch(false)}
                    >
                        Inscription
                    </button>
                </div>

                {/* Inline errors */}
                {(formError || error) && (
                    <div className="form-error">
                        <AlertCircle size={16} />
                        <span>{formError || error}</span>
                    </div>
                )}

                <ModernInput
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <ModernInput
                    label="Mot de passe principal"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    showPasswordToggle
                    required
                    minLength={8}
                />

                {!isLogin && (
                    <ModernInput
                        label="Confirmer le mot de passe"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        showPasswordToggle
                        required
                    />
                )}

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

            <div className="security-warning">
                <p>
                    ⚠️ <strong>Récupération Impossible</strong> <br />
                    En cas de perte de mot de passe, vos données sont cryptographiquement irrécupérables.
                </p>
            </div>
        </div>
    );
}
