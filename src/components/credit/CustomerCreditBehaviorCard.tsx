import React from 'react';
import { CustomerCreditBehavior } from '../../types/credit';
import { BrainCircuit, Star, Clock, Wallet, MessageSquare } from 'lucide-react';

interface CustomerCreditBehaviorCardProps {
  behavior: CustomerCreditBehavior;
}

export default function CustomerCreditBehaviorCard({ behavior }: CustomerCreditBehaviorCardProps) {
  return (
    <div className="bg-white rounded-[32px] border border-border-soft p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
          <BrainCircuit size={20} />
        </div>
        <div>
          <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest">Perfil de Comportamiento</h4>
          <p className="text-[9px] font-black text-purple-600 uppercase">Aprendizaje IA de Cartera</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
         <div className="space-y-1">
            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Cumplimiento</p>
            <div className="flex items-center gap-2">
               <Star size={12} className="text-orange-400" fill="currentColor" />
               <p className="text-[11px] font-black text-text-main">{(behavior.pays_on_time_ratio * 100).toFixed(0)}% O.T.I.F</p>
            </div>
         </div>
         <div className="space-y-1">
            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Día de Pago</p>
            <div className="flex items-center gap-2">
               <Clock size={12} className="text-text-muted" />
               <p className="text-[11px] font-black text-text-main">{behavior.usual_payment_day}</p>
            </div>
         </div>
         <div className="space-y-1">
            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Medio Habitual</p>
            <div className="flex items-center gap-2">
               <Wallet size={12} className="text-text-muted" />
               <p className="text-[11px] font-black text-text-main uppercase truncate">{behavior.most_used_payment_method}</p>
            </div>
         </div>
         <div className="space-y-1">
            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Sensibilidad Bloqueo</p>
            <div className="flex items-center gap-2">
               <div className={`w-1.5 h-1.5 rounded-full ${behavior.sensitivity_to_blocking === 'high' ? 'bg-red-500' : 'bg-green-500'}`} />
               <p className="text-[11px] font-black text-text-main uppercase">{behavior.sensitivity_to_blocking}</p>
            </div>
         </div>
      </div>

      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 italic">
        <p className="text-[10px] font-bold text-purple-900 leading-relaxed">
          "{behavior.collection_notes}"
        </p>
      </div>
    </div>
  );
}
