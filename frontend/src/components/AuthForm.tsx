import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Lock, Mail, Eye, EyeOff, Loader2, Shield, KeyRound, ArrowRight, AlertCircle } from 'lucide-react';

export function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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

                {/* Inline errors (replaces alert()) */}
                {(formError || error) && (
                    <div className="form-error">
                        <AlertCircle size={16} />
                        <span>{formError || error}</span>
                    </div>
                )}

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
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

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
