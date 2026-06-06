import React from "react";
import { X, Zap, AlertCircle, Info, Database, BarChart3, TrendingUp, Calendar, ArrowRight, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PriorityScore, CustomerSignal } from "../../types";
import { formatCurrency } from "../../lib/utils";

interface SignalsDetailModalProps {
  score: PriorityScore;
  onClose: () => void;
}

export default function SignalsDetailModal({ score, onClose }: SignalsDetailModalProps) {
  return (
    <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-app-bg w-full max-w-lg rounded-t-[44px] sm:rounded-[44px] flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="p-8 border-b border-border-soft flex justify-between items-center bg-white flex-shrink-0">
          <div>
             <h3 className="text-xl font-black uppercase tracking-tight text-text-main">Detalle de Prioridad</h3>
             <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                   <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Confianza {score.confidence}</span>
                </div>
                <span className="text-[10px] font-bold text-text-muted">Calculado: {new Date(score.calculated_at).toLocaleTimeString()}</span>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-text-muted active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
           {/* Summary Header */}
           <div className="p-8 bg-gradient-to-br from-gray-900 to-black rounded-[40px] text-white shadow-xl flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Puntaje Total</p>
                 <div className="flex items-end gap-3">
                    <div className="text-5xl font-black tracking-tighter leading-none">{score.total_score}</div>
                    {score.feedback_adjustment_score !== undefined && score.feedback_adjustment_score !== 0 && (
                      <div className={`text-xs font-black mb-1 p-1 rounded-lg ${score.feedback_adjustment_score > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {score.feedback_adjustment_score > 0 ? '+' : ''}{score.feedback_adjustment_score} feedback
                      </div>
                    )}
                 </div>
                 <div className={`mt-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block ${
                   score.priority === 'critical' ? 'bg-red-500' : 
                   score.priority === 'high' ? 'bg-orange-500' :
                   'bg-blue-500'
                 }`}>
                   {score.priority}
                 </div>
              </div>
              <div className="text-right">
                 <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10 ml-auto">
                    <Zap size={40} className="text-dismel-red" fill="currentColor" />
                 </div>
              </div>
           </div>

           {/* Recommended Action */}
           <div className="p-6 bg-white rounded-[32px] border border-border-soft shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-dismel-red/10 text-dismel-red rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} />
                 </div>
                 <h4 className="text-sm font-black text-text-main uppercase tracking-tight">Acción Sugerida</h4>
              </div>
              <p className="text-lg font-black text-text-main leading-tight mb-2">{score.recommended_action}</p>
              <p className="text-xs font-bold text-text-muted leading-relaxed italic">"{score.explanation}"</p>
           </div>

           {/* Signals List */}
           <div className="space-y-4">
              <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest px-1">Señales Detectadas ({score.signals.length})</h4>
              {score.signals.map((sig, i) => (
                <div key={i} className="bg-white rounded-[32px] border border-border-soft overflow-hidden shadow-sm">
                   <div className="p-6 border-b border-gray-50 flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${
                        sig.severity === 'critical' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {sig.severity === 'critical' ? <AlertCircle size={24} /> : <Zap size={24} fill="currentColor" />}
                      </div>
                      <div className="flex-1">
                         <div className="flex items-center justify-between mb-1">
                            <h5 className="text-sm font-black text-text-main uppercase tracking-tight">{sig.title}</h5>
                            <div className="text-[13px] font-black text-text-main">+{sig.score}</div>
                         </div>
                         <p className="text-[11px] font-bold text-text-muted leading-relaxed">{sig.description}</p>
                      </div>
                   </div>

                   {/* Signal Evidence */}
                   <div className="bg-gray-50/50 p-6 grid grid-cols-2 gap-4">
                      {sig.evidence.map((ev, ei) => (
                        <div key={ei}>
                           <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">{ev.label}</p>
                           <p className="text-[11px] font-black text-text-main uppercase tracking-tight">
                             {typeof ev.value === 'number' && ev.unit === 'COP' ? formatCurrency(ev.value) : ev.value}
                             {ev.unit && ev.unit !== 'COP' ? ` ${ev.unit}` : ''}
                           </p>
                        </div>
                      ))}
                      <div className="col-span-2 mt-2 pt-4 border-t border-gray-100 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Database size={12} className="text-text-muted" />
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Fuente: {sig.source.replace('odoo_', '')}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <ShieldCheck size={12} className="text-green-500" />
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Validado</span>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="p-8 bg-white border-t border-border-soft flex-shrink-0">
           <button 
             onClick={onClose}
             className="w-full h-14 bg-black text-white rounded-3xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-black/10"
           >
             Entendido
           </button>
        </div>
      </motion.div>
    </div>
  );
}
