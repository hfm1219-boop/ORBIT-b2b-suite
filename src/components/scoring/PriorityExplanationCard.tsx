import React from "react";
import { Zap, Info, ChevronRight, Target, AlertCircle } from "lucide-react";
import { PriorityScore } from "../../types";

interface PriorityExplanationCardProps {
  score: PriorityScore;
  onViewDetails?: () => void;
  compact?: boolean;
}

export default function PriorityExplanationCard({ score, onViewDetails, compact = false }: PriorityExplanationCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-100 bg-red-50/30';
      case 'high': return 'border-orange-100 bg-orange-50/30';
      case 'medium': return 'border-blue-100 bg-blue-50/30';
      default: return 'border-gray-100 bg-gray-50/30';
    }
  };

  if (compact) {
    return (
      <div className={`p-4 rounded-[28px] border-2 ${getPriorityBorder(score.priority)} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${getPriorityColor(score.priority)} shadow-lg`}>
                {score.total_score}
             </div>
             <div>
                <h4 className="text-[11px] font-black uppercase tracking-tight text-text-main">{score.recommended_action}</h4>
                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest leading-none mt-1">Recomendación Prioritaria</p>
             </div>
          </div>
          <button 
            onClick={onViewDetails}
            className="w-8 h-8 rounded-full bg-white border border-border-soft flex items-center justify-center text-text-muted"
          >
            <ChevronRight size={14} />
          </button>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-[40px] border-2 ${getPriorityBorder(score.priority)} relative overflow-hidden group`}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
         <Zap size={120} fill="currentColor" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
           <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getPriorityColor(score.priority)}`}>
                 Prioridad {score.priority}
              </div>
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Confianza {score.confidence}</span>
              </div>
           </div>
           <div className="text-right">
              <div className="text-2xl font-black text-text-main tracking-tighter leading-none">{score.total_score}</div>
              <div className="text-[8px] font-black text-text-muted uppercase tracking-widest mt-1">Score Dismel</div>
           </div>
        </div>

        <div className="mb-6">
           <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
              <Target size={12} className="text-dismel-red" />
              Acción Recomendada
           </p>
           <h3 className="text-lg font-black text-text-main uppercase tracking-tight leading-tight">
             {score.recommended_action}
           </h3>
           <p className="text-xs font-bold text-text-muted mt-2 leading-relaxed">
             {score.explanation}
           </p>
           
           {score.feedback_summary && (
             <div className="mt-3 p-3 bg-white/50 rounded-2xl border border-dashed border-border-soft flex items-start gap-3">
               <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
               <p className="text-[10px] font-bold text-text-main leading-snug">
                 {score.feedback_summary}
               </p>
             </div>
           )}

           {score.strategy_warnings && score.strategy_warnings.length > 0 && (
             <div className="mt-2 space-y-1.5">
               {score.strategy_warnings.map((warn, i) => (
                 <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                   <AlertCircle size={10} />
                   <span className="text-[9px] font-black uppercase tracking-wider">{warn}</span>
                 </div>
               ))}
             </div>
           )}
        </div>

        <div className="flex items-center gap-4 py-4 border-t border-b border-dashed border-border-soft mb-6 px-1">
           {score.recommended_channel && (
             <div>
               <p className="text-[7px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Canal Sugerido</p>
               <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded-lg text-[9px] font-black uppercase text-text-main">
                 {score.recommended_channel === 'whatsapp' ? 'WhatsApp' : score.recommended_channel === 'visit' ? 'Visita' : 'Llamada'}
               </div>
             </div>
           )}
           {score.feedback_adjustment_score !== undefined && score.feedback_adjustment_score !== 0 && (
             <div>
               <p className="text-[7px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Ajuste Feedback</p>
               <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${score.feedback_adjustment_score > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                 {score.feedback_adjustment_score > 0 ? '+' : ''}{score.feedback_adjustment_score}
               </div>
             </div>
           )}
        </div>

        <div className="space-y-3 mb-8">
           <p className="text-[9px] font-black text-text-muted uppercase tracking-widest px-1">Señales Activas ({score.signals.length})</p>
           {score.signals.slice(0, 2).map((sig, i) => (
             <div key={i} className="flex items-center gap-3 p-3 bg-white/60 rounded-2xl border border-white shadow-sm">
                <div className={`p-1.5 rounded-lg ${
                   sig.severity === 'critical' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                }`}>
                   {sig.severity === 'critical' ? <AlertCircle size={14} /> : <Zap size={14} fill="currentColor" />}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[10px] font-black text-text-main uppercase tracking-tight truncate">{sig.title}</p>
                   <p className="text-[9px] font-bold text-text-muted truncate">{sig.description}</p>
                </div>
             </div>
           ))}
        </div>

        <button 
           onClick={onViewDetails}
           className="w-full h-12 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-black/10"
        >
           <Info size={16} /> Ver por qué
        </button>
      </div>
    </div>
  );
}
