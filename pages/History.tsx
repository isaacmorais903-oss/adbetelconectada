import React from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';

interface HistoryProps {
  onBack?: () => void;
}

export const History: React.FC<HistoryProps> = ({ onBack }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nossa História</h1>
          <p className="text-slate-500 dark:text-slate-400">Conheça a trajetória da nossa igreja.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="h-48 sm:h-64 bg-slate-200 dark:bg-slate-700 relative">
            <img 
                src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop" 
                alt="Igreja Antiga" 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <h2 className="text-white text-2xl font-bold">Desde 1990</h2>
            </div>
        </div>
        
        <div className="p-6 sm:p-8 space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
                A <strong>Igreja AdBetel</strong> nasceu do sonho de levar o amor de Deus e a transformação de vidas para a nossa comunidade. 
                Fundada em 1990 por um pequeno grupo de famílias que se reuniam em uma garagem, nossa jornada sempre foi marcada pela fé e pela perseverança.
            </p>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-6">O Início</h3>
            <p>
                Nos primeiros anos, enfrentamos muitos desafios, mas vimos a mão de Deus agir poderosamente. 
                O que começou com apenas 12 pessoas logo se multiplicou, exigindo um espaço maior para acolher a todos que chegavam sedentos pela Palavra.
            </p>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-6">Crescimento e Expansão</h3>
            <p>
                Em 2005, inauguramos nosso templo atual, um marco de milagre e provisão. 
                Desde então, temos expandido nossa atuação com projetos sociais, missões e a abertura de novas congregações em bairros vizinhos, 
                sempre mantendo a essência de ser uma família acolhedora.
            </p>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-6">Nossa Missão Hoje</h3>
            <p>
                Hoje, continuamos firmes no propósito de <em>"Amar a Deus e Servir ao Próximo"</em>. 
                Acreditamos que cada membro é parte fundamental desta história que continua sendo escrita dia após dia.
            </p>
            
            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 mt-8 flex items-center gap-3 text-sm text-slate-500 italic">
                <BookOpen className="w-5 h-5" />
                <span>"Até aqui nos ajudou o Senhor." - 1 Samuel 7:12</span>
            </div>
        </div>
      </div>
    </div>
  );
};
