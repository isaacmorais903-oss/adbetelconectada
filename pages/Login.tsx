
import React, { useState } from 'react';
import { Church, Mail, Lock, ArrowRight, User, Phone, Wifi } from 'lucide-react';
import { APP_CONFIG } from '../config';

interface LoginProps {
  onLogin: (role: 'admin' | 'member') => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  // Mock login handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simula delay de rede
    setTimeout(() => {
      setLoading(false);
      // Por padrão entra como admin para teste, mas num app real validaria o usuário
      onLogin('admin');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors">
      {/* Lado Esquerdo - Banner (Escondido em Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-slate-900/90 z-10"></div>
        <img 
            src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
            alt="Church Background" 
            className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="relative z-20 text-white p-12 max-w-lg">
            {APP_CONFIG.logoUrl && !imgError ? (
                // AUMENTADO para w-40 h-40
                <div className="w-40 h-40 mb-8 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden p-2">
                     <img 
                        src={APP_CONFIG.logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-contain" 
                        onError={() => setImgError(true)}
                     />
                </div>
            ) : (
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl w-24 h-24 flex items-center justify-center mb-8 border border-white/20 shadow-xl">
                    <Church className="w-12 h-12 text-white" />
                </div>
            )}
            
            {/* Título ajustado para separar linhas e aproximar */}
            <h1 className="text-5xl font-bold mb-6 leading-none tracking-tight">
                <span className="block">{APP_CONFIG.churchName}</span>
                <span className="block text-3xl font-medium text-blue-200 mt-[-5px]">{APP_CONFIG.churchSubtitle}</span>
            </h1>

            <p className="text-blue-100 text-2xl font-light leading-relaxed italic">
                "Nós te recebemos de braços abertos"
            </p>
            
            <div className="mt-12 flex items-center gap-4 text-sm text-blue-200 font-medium">
                <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-blue-900 bg-blue-500 flex items-center justify-center text-[10px] text-white">
                            <User className="w-4 h-4" />
                        </div>
                    ))}
                </div>
                <p>Gestão completa para o Reino</p>
            </div>
        </div>
      </div>

      {/* Lado Direito - Formuário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
                {APP_CONFIG.logoUrl && !imgError ? (
                    // Aumentado mobile também para w-24 h-24
                    <div className="inline-flex lg:hidden mb-6 w-24 h-24">
                        <img 
                            src={APP_CONFIG.logoUrl} 
                            alt="Logo" 
                            className="w-full h-full object-contain"
                            onError={() => setImgError(true)}
                        />
                    </div>
                ) : (
                    <div className="inline-flex lg:hidden bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-200 mb-6">
                        <Church className="w-6 h-6 text-white" />
                    </div>
                )}
                
                {/* Alteração do Nome com Ícone de Conexão */}
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex flex-wrap items-center justify-center lg:justify-start gap-2">
                    {isRegistering ? (
                        'Crie sua conta'
                    ) : (
                        <>
                            <span>ADBetel</span>
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none transform -rotate-12 mx-1">
                                <Wifi className="w-6 h-6" />
                            </div>
                            <span className="text-blue-600 dark:text-blue-400">Conectada</span>
                        </>
                    )}
                </h2>

                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    {isRegistering 
                        ? 'Preencha os dados para iniciar seu cadastro.' 
                        : <span className="italic">"Nós te recebemos de braços abertos"</span>}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {isRegistering && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Igreja</label>
                        <div className="relative">
                            <Church className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                            <input 
                                type="text" 
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
                                placeholder="Ex: AD Betel Central"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input 
                            type="email" 
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
                            placeholder="seu@email.com"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input 
                            type="password" 
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                {!isRegistering && (
                    <div className="flex justify-end">
                        <button type="button" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800">
                            Esqueceu a senha?
                        </button>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none"
                >
                    {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            {isRegistering ? 'Começar Agora' : 'Entrar na Plataforma'}
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">Ou continue com</span>
                </div>
            </div>

            <div className="flex gap-4 justify-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
                    <button 
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="ml-1 font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        {isRegistering ? 'Fazer Login' : 'Criar Cadastro'}
                    </button>
                </p>
            </div>
            
            {/* Quick Helper for Demo */}
            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg text-xs text-yellow-800 dark:text-yellow-200 text-center">
                <p className="font-bold mb-1">💡 Modo Demonstração Visual</p>
                <p>Clique em "Entrar" para acessar o painel administrativo.</p>
            </div>
        </div>
      </div>
    </div>
  );
};
