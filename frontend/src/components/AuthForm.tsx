import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Loader2, KeyRound, ArrowRight, AlertCircle, Fingerprint } from 'lucide-react';
import { ModernInput } from './ModernInput';
import { Logo } from './Logo';

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
        <div className="w-full animate-[fadeInDown_0.8s_cubic-bezier(0.16,1,0.3,1)]">
            
            {/* Header (Mobile Only) */}
            <div className="lg:hidden flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-white/20 to-white/5 p-[1px] shadow-[0_0_20px_rgba(255,255,255,0.05)] mb-4">
                     <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                        <Logo className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">VEIL</h1>
                <p className="text-vault-text-secondary text-sm">Enterprise Zero-Knowledge Vault</p>
            </div>

            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                    {isLogin ? 'Bienvenue.' : 'Créez votre coffre.'}
                </h2>
                <p className="text-vault-text-secondary text-sm">
                    {isLogin ? 'Connectez-vous pour accéder à vos fichiers de bout en bout.' : 'Inscrivez-vous et devenez l\'unique dépositaire de vos données.'}
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Tabs */}
                <div className="flex p-1 bg-[#111] rounded-xl border border-white/5 shadow-inner">
                    <button
                        type="button"
                        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-300 ${
                            isLogin 
                                ? 'bg-white text-black shadow-sm' 
                                : 'text-vault-text-muted hover:text-white hover:bg-white/5'
                        }`}
                        onClick={() => handleTabSwitch(true)}
                    >
                        Connexion
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-300 ${
                            !isLogin 
                                ? 'bg-white text-black shadow-sm' 
                                : 'text-vault-text-muted hover:text-white hover:bg-white/5'
                        }`}
                        onClick={() => handleTabSwitch(false)}
                    >
                        Inscription
                    </button>
                </div>

                {/* Inline HTML Error */}
                {(formError || error) && (
                    <div className="flex items-center gap-3 p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm animate-[shake_0.4s_ease-in-out]">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{formError || error}</span>
                    </div>
                )}

                <div className="space-y-4">
                    <ModernInput
                        label="Adresse email"
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
                        <div className="animate-[fadeIn_0.3s_ease-in-out]">
                             <ModernInput
                                label="Confirmer le mot de passe"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                showPasswordToggle
                                required
                            />
                        </div>
                    )}
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full mt-6 py-3.5 px-4 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-semibold rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)] disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {isLogin ? 'Déchiffrement en cours...' : 'Génération des clés ZK...'}
                        </>
                    ) : (
                        <>
                            {isLogin ? 'Ouvrir le coffre' : 'Créer le coffre sécurisé'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-10 flex items-start gap-4 p-4 bg-zinc-900 border border-white/5 rounded-xl">
                 <div className="p-2 bg-zinc-800 text-white rounded-lg">
                    <Fingerprint className="w-5 h-5" />
                 </div>
                 <div>
                     <h4 className="text-sm font-semibold text-white mb-1">Authentification Zero-Knowledge</h4>
                     <p className="text-xs text-vault-text-muted leading-relaxed">
                         Votre mot de passe principal n'est jamais transmis au serveur. Seulement des hashs de preuves. 
                         <span className="text-red-400 font-medium ml-1">En cas de perte, la récupération est impossible.</span>
                     </p>
                 </div>
            </div>
        </div>
    );
}
