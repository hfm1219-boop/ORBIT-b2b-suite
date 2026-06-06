import React from 'react';
import { ExternalLink, Calendar, HelpCircle, Share2, AlertOctagon } from 'lucide-react';

interface CreditActionsPanelProps {
  onGenerateLink: () => void;
  onRegisterPromise: () => void;
  onReportPayment: () => void;
  onEscalate: () => void;
}

export default function CreditActionsPanel({ 
  onGenerateLink, 
  onRegisterPromise, 
  onReportPayment, 
  onEscalate 
}: CreditActionsPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button 
        onClick={onGenerateLink}
        className="bg-white p-5 rounded-[28px] border border-border-soft flex flex-col items-center text-center group active:scale-95 transition-all shadow-sm"
      >
        <div className="w-10 h-10 bg-black text-white rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <Share2 size={20} />
        </div>
        <p className="text-[10px] font-black text-text-main uppercase tracking-widest leading-tight">Link de Pago</p>
      </button>

      <button 
        onClick={onRegisterPromise}
        className="bg-white p-5 rounded-[28px] border border-border-soft flex flex-col items-center text-center group active:scale-95 transition-all shadow-sm"
      >
        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <Calendar size={20} />
        </div>
        <p className="text-[10px] font-black text-text-main uppercase tracking-widest leading-tight">Registrar Promesa</p>
      </button>

      <button 
        onClick={onReportPayment}
        className="bg-white p-5 rounded-[28px] border border-border-soft flex flex-col items-center text-center group active:scale-95 transition-all shadow-sm"
      >
        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <ExternalLink size={20} />
        </div>
        <p className="text-[10px] font-black text-text-main uppercase tracking-widest leading-tight">Informar Pago</p>
      </button>

      <button 
        onClick={onEscalate}
        className="bg-white p-5 rounded-[28px] border border-border-soft flex flex-col items-center text-center group active:scale-95 transition-all shadow-sm"
      >
        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <AlertOctagon size={20} />
        </div>
        <p className="text-[10px] font-black text-text-main uppercase tracking-widest leading-tight">Escalar Caso</p>
      </button>
    </div>
  );
}
