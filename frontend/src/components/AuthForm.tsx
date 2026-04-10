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
            setFormError('Le mot de passe doit faire au moins 8 caractères.');
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
        <div className="w-full animate-[fadeIn_0.5s_ease-out]">
            
            {/* Header (Mobile Only) */}
            <div className="lg:hidden flex flex-col items-center mb-10">
                <div className="mb-6 text-white pb-3 border-b border-white/10">
                    <Logo size={42} />
                </div>
                <h1 className="text-3xl font-semibold text-white tracking-tight">VEIL</h1>
                <p className="text-zinc-500 text-sm mt-1">Enterprise Zero-Knowledge Vault</p>
            </div>

            <div className="mb-8">
                <h2 className="text-3xl font-semibold tracking-tight text-white mb-2">
                    {isLogin ? 'Connexion' : 'Créer un compte'}
                </h2>
                <p className="text-zinc-500 text-sm">
                    {isLogin ? 'Accédez à votre coffre-fort hautement sécurisé.' : 'Devenez l\'unique dépositaire de vos données.'}
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Tabs */}
                <div className="flex p-1 bg-[#111] rounded-lg border border-white/5">
                    <button
                        type="button"
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                            isLogin 
                                ? 'bg-[#222] text-white shadow-sm border border-white/10' 
                                : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                        onClick={() => handleTabSwitch(true)}
                    >
                        Connexion
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                            !isLogin 
                                ? 'bg-[#222] text-white shadow-sm border border-white/10' 
                                : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                        onClick={() => handleTabSwitch(false)}
                    >
                        Inscription
                    </button>
                </div>

                {/* Inline Error */}
                {(formError || error) && (
                    <div className="flex items-start gap-3 p-3.5 bg-red-500/5 border border-red-500/20 text-red-500 rounded-lg text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{formError || error}</span>
                    </div>
                )}

                <div className="space-y-4">
                    <ModernInput
                        label="Email professionnel"
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
                        <div className="animate-[fadeIn_0.2s_ease-out]">
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
                    className="w-full mt-6 py-3 px-4 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-semibold rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_2px_10px_rgba(255,255,255,0.05)] disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {isLogin ? 'Déchiffrement...' : 'Génération ZK...'}
                        </>
                    ) : (
                        <>
                            {isLogin ? 'Accéder au coffre' : 'Créer le coffre sécurisé'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 flex items-start gap-4 p-4 bg-[#0A0A0A] border border-white/5 rounded-lg">
                 <div className="p-1.5 bg-[#111] border border-white/5 text-zinc-400 rounded-md">
                    <Fingerprint className="w-4 h-4" />
                 </div>
                 <div>
                     <h4 className="text-sm font-medium text-white mb-1">Architecture Zero-Knowledge</h4>
                     <p className="text-xs text-zinc-500 leading-relaxed">
                         Le mot de passe n'est jamais transmis au serveur. Seulement des preuves cryptographiques. 
                         <span className="text-red-400/80 font-medium ml-1">Récupération de compte impossible.</span>
                     </p>
                 </div>
            </div>
        </div>
    );
}
