import React from 'react';
import { PaymentPromise } from '../../types/credit';
import { formatCurrency } from '../../lib/utils';
import { Calendar, CheckCircle2, AlertCircle, Clock, Plus } from 'lucide-react';

interface PaymentPromisePanelProps {
  promises: PaymentPromise[];
  onRegisterNew: () => void;
  onUpdateStatus: (id: string, status: PaymentPromise['status']) => void;
}

export default function PaymentPromisePanel({ promises, onRegisterNew, onUpdateStatus }: PaymentPromisePanelProps) {
  const activePromise = promises.find(p => p.status === 'pending' || p.status === 'overdue');
  const history = promises.filter(p => p.status === 'fulfilled' || p.status === 'broken');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest">Promesas de Pago</h4>
        <button 
          onClick={onRegisterNew}
          className="flex items-center gap-2 text-[9px] font-black text-dismel-red uppercase tracking-widest"
        >
          <Plus size={14} /> Registrar
        </button>
      </div>

      {activePromise ? (
        <div className={`p-6 rounded-[32px] border ${activePromise.status === 'overdue' ? 'bg-red-50 border-red-200' : 'bg-white border-border-soft'} shadow-sm relative overflow-hidden`}>
          {activePromise.status === 'overdue' && (
            <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
              Incumplida
            </div>
          )}
          
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${activePromise.status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-0.5">Promesa Activa</p>
              <h5 className="text-sm font-black text-text-main uppercase">{new Date(activePromise.promise_date).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}</h5>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
             <div className="bg-app-bg p-4 rounded-2xl">
                <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Monto Prometido</p>
                <p className="text-sm font-black text-text-main">{formatCurrency(activePromise.amount)}</p>
             </div>
             <div className="bg-app-bg p-4 rounded-2xl">
                <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Medio</p>
                <p className="text-[10px] font-black text-text-main uppercase">{activePromise.payment_method || 'Sin definir'}</p>
             </div>
          </div>

          {activePromise.notes && (
             <div className="bg-orange-50 p-4 rounded-2xl mb-6">
                <p className="text-[10px] font-bold text-orange-800 italic">"{activePromise.notes}"</p>
             </div>
          )}

          <div className="flex gap-2">
             <button 
               onClick={() => onUpdateStatus(activePromise.id, 'fulfilled')}
               className="flex-1 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20"
             >
                <CheckCircle2 size={16} /> Cumplida
             </button>
             <button 
               onClick={() => onUpdateStatus(activePromise.id, 'broken')}
               className="flex-1 h-12 bg-white border border-border-soft text-text-main rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest"
             >
                <AlertCircle size={16} /> Incumplida
             </button>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center bg-white rounded-[36px] border border-border-soft border-dashed">
          <Calendar size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted px-10 leading-relaxed">No hay promesas activas. Registra una si el cliente confirma pago futuro.</p>
          <button 
            onClick={onRegisterNew}
            className="mt-6 px-6 py-3 bg-dismel-red text-white rounded-xl text-[9px] font-black uppercase tracking-widest"
          >
            Nueva Promesa
          </button>
        </div>
      )}

      {history.length > 0 && (
         <div className="pt-4">
            <h5 className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-4 px-1">Historial Reciente</h5>
            <div className="space-y-3">
               {history.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-border-soft rounded-2xl">
                     <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${p.status === 'fulfilled' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                           {p.status === 'fulfilled' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-text-main uppercase">{new Date(p.promise_date).toLocaleDateString()}</p>
                           <p className="text-[8px] font-bold text-text-muted uppercase">{p.status === 'fulfilled' ? 'Cumplida' : 'Incumplida'}</p>
                        </div>
                     </div>
                     <p className="text-[10px] font-black text-text-main">{formatCurrency(p.amount)}</p>
                  </div>
               ))}
            </div>
         </div>
      )}
    </div>
  );
}
