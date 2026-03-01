
import React, { useState } from 'react';
import { Church, Mail, Lock, ArrowRight, Wifi, AlertCircle, UserPlus, LogIn, ShieldAlert } from 'lucide-react';
import { APP_CONFIG } from '../config';
import { supabase, isConfigured } from '../services/supabaseClient';

interface LoginProps {
  onLogin: (role: 'admin' | 'member') => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const DEMO_PASSWORD = "123456"; 
  const MASTER_CODE = "AD2024"; // <--- CÓDIGO DE SEGURANÇA PARA CRIAR CONTAS ADMIN

  const [isRegistering, setIsRegistering] = useState(false); 
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState(''); // Estado para o código de segurança
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [imgError, setImgError] = useState(false);

  // Verifica se o email digitado é de um administrador
  const isAdminEmail = /admin|adm|pastor|lider|secretaria|tesouraria/i.test(email);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const detectedRole = isAdminEmail ? 'admin' : 'member';

    // 1. MODO DEMONSTRAÇÃO / OFFLINE (Sem Supabase)
    if (!isConfigured) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Fake delay
        
        if (isForgotPassword) {
            setSuccessMsg(`(Modo Demo) Link de recuperação enviado para ${email}`);
            setLoading(false);
            return;
        }

        if (password === DEMO_PASSWORD) {
            onLogin(detectedRole);
        } else {
            setErrorMsg(`Senha incorreta (Demo: ${DEMO_PASSWORD})`);
        }
        setLoading(false);
        return;
    }

    // 2. MODO REAL (Com Supabase)
    try {
        if (isForgotPassword) {
            // Tenta recuperar a senha
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            if (error) throw error;
            setSuccessMsg('Link de recuperação enviado! Verifique sua caixa de entrada.');
            setIsForgotPassword(false);
        } else if (isRegistering) {
            // VERIFICAÇÃO DE SEGURANÇA PARA ADMINS NO CADASTRO
            if (isAdminEmail && adminCode !== MASTER_CODE) {
                setErrorMsg(`Para cadastrar um acesso administrativo ("${email}"), é necessário o Código da Igreja.`);
                setLoading(false);
                return;
            }

            // Tenta Cadastrar
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });
            
            if (error) throw error;

            // Se "Confirm Email" estiver DESLIGADO no Supabase, logamos direto.
            if (data.session) {
                // Deslogar imediatamente para forçar aprovação do admin
                await supabase.auth.signOut();
                setSuccessMsg('Cadastro realizado! Aguarde a liberação do seu acesso pela secretaria.');
                setIsRegistering(false);
            } else {
                setSuccessMsg('Cadastro realizado! Verifique seu e-mail para confirmar a conta, ou aguarde a liberação da secretaria.');
                setIsRegistering(false); 
            }

        } else {
            // Tenta Logar
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            
            // Login bem sucedido
            onLogin(detectedRole);
        }
    } catch (error: any) {
        console.error("Auth Error:", error);
        
        if (error.message.includes('Invalid login credentials')) {
            setErrorMsg("E-mail ou senha incorretos.");
        } else if (error.message.includes('User already registered')) {
            setErrorMsg("Este e-mail já está cadastrado. Tente fazer login.");
        } else if (error.message.includes('Email not confirmed')) {
            setErrorMsg("E-mail pendente de confirmação. Verifique sua caixa de entrada.");
        } else {
            setErrorMsg(error.message || "Erro ao realizar operação");
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full flex overflow-hidden min-h-[500px]">
        
        {/* Lado Esquerdo - Visual (Apenas Desktop) */}
        <div className="hidden md:flex md:w-1/2 bg-blue-900 relative items-center justify-center p-8 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-slate-900/90 z-10"></div>
            <img 
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
                alt="Church Background" 
                className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="relative z-20 text-white">
                 <div className="mb-6 flex justify-center">
                    {APP_CONFIG.logoUrl && !imgError ? (
                        <img 
                            src={APP_CONFIG.logoUrl} 
                            alt="Logo" 
                            className="w-24 h-24 object-contain bg-white/10 rounded-xl p-2 backdrop-blur-sm"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm">
                            <Church className="w-12 h-12" />
                        </div>
                    )}
                 </div>
                 <h2 className="text-3xl font-bold mb-2">{APP_CONFIG.churchName}</h2>
                 <p className="text-blue-200 italic font-medium">"Nós te recebemos de braços abertos!"</p>
            </div>
        </div>

        {/* Lado Direito - Login */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-slate-50 dark:bg-slate-900">
            
            {/* LOGO MOBILE */}
            <div className="md:hidden flex flex-col items-center mb-8 text-center">
                {APP_CONFIG.logoUrl && !imgError ? (
                    <img 
                        src={APP_CONFIG.logoUrl} 
                        alt="Logo" 
                        className="w-20 h-20 object-contain mb-3"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="bg-blue-600 p-3 rounded-xl mb-3">
                        <Church className="w-10 h-10 text-white" />
                    </div>
                )}
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{APP_CONFIG.churchName}</h2>
                <p className="text-blue-600 dark:text-blue-400 text-sm italic mt-1 font-medium">"Nós te recebemos de braços abertos!"</p>
            </div>

            <div className="text-center md:text-left mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
                    {isForgotPassword ? <Lock className="w-6 h-6 text-blue-600" /> : isRegistering ? <UserPlus className="w-6 h-6 text-blue-600"/> : <LogIn className="w-6 h-6 text-blue-600" />}
                    {isForgotPassword ? 'Recuperar Senha' : isRegistering ? 'Criar Conta' : 'Acesse sua Conta'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                    {isForgotPassword ? 'Digite seu e-mail para receber um link de recuperação.' : isRegistering ? 'Preencha os dados para se cadastrar.' : 'Digite seu e-mail e senha para fazer login.'}
                </p>
            </div>

            {errorMsg && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-100 dark:border-red-900/50">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {successMsg && (
                <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 p-3 rounded-lg text-sm flex items-start gap-2 border border-emerald-100 dark:border-emerald-900/50">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                            placeholder="seu@email.com"
                        />
                    </div>
                    {isRegistering && isAdminEmail && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 ml-1 font-semibold flex items-center gap-1 mt-1">
                            <ShieldAlert className="w-3 h-3" /> Acesso Admin detectado. Chave Mestra necessária.
                        </p>
                    )}
                </div>

                {!isForgotPassword && (
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Senha</label>
                            {!isRegistering && (
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setIsForgotPassword(true);
                                        setErrorMsg('');
                                        setSuccessMsg('');
                                    }}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Esqueceu a senha?
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                    </div>
                )}

                {/* CAMPO DE SEGURANÇA EXTRA PARA ADMINS */}
                {isRegistering && isAdminEmail && (
                     <div className="space-y-1 animate-in slide-in-from-top-2 fade-in">
                        <label className="text-sm font-bold text-amber-600 dark:text-amber-500 flex items-center gap-2">
                             Código da Igreja (Segurança)
                        </label>
                        <div className="relative">
                            <ShieldAlert className="absolute left-3 top-3.5 w-5 h-5 text-amber-500" />
                            <input 
                                type="text" 
                                required
                                value={adminCode}
                                onChange={e => setAdminCode(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white placeholder-amber-300"
                                placeholder="Digite o código da liderança"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 ml-1">Para teste use: <b>AD2024</b></p>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-900 text-white py-3.5 rounded-xl font-bold hover:bg-blue-800 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            {isForgotPassword ? 'Enviar Link de Recuperação' : isRegistering ? 'Cadastrar' : 'Entrar'}
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
                {isForgotPassword ? (
                    <button 
                        onClick={() => {
                            setIsForgotPassword(false);
                            setErrorMsg('');
                            setSuccessMsg('');
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold transition-colors"
                    >
                        Voltar para o Login
                    </button>
                ) : (
                    <button 
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setErrorMsg('');
                            setSuccessMsg('');
                            setAdminCode('');
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold transition-colors"
                    >
                        {isRegistering ? 'Já tem uma conta? Fazer Login' : 'Não tem conta? Criar Cadastro'}
                    </button>
                )}
            </div>

            <div className="mt-8 flex justify-center items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest">
                <Wifi className={`w-3 h-3 ${isConfigured ? 'text-green-500' : 'text-slate-400'}`} />
                {isConfigured ? 'Servidor Conectado' : 'Aguardando Conexão'}
            </div>
        </div>
      </div>
    </div>
  );
};
