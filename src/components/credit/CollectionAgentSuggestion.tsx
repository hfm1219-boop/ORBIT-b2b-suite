import React from 'react';
import { Send, Zap, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface CollectionAgentSuggestionProps {
  suggestion: string;
  onPrepareMessage: () => void;
}

export default function CollectionAgentSuggestion({ suggestion, onPrepareMessage }: CollectionAgentSuggestionProps) {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden group">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-dismel-red/20 blur-3xl group-hover:bg-dismel-red/40 transition-all duration-700" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-dismel-red rounded-2xl flex items-center justify-center">
          <Zap size={20} className="text-white" fill="currentColor" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-dismel-red">Sugerencia del Agente</p>
          <h4 className="text-sm font-black uppercase tracking-tight">Estrategia de Recaudo</h4>
        </div>
      </div>

      <p className="text-[11px] font-bold text-gray-300 leading-relaxed mb-6">
        {suggestion}
      </p>

      <button 
        onClick={onPrepareMessage}
        className="w-full h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
      >
        <MessageSquare size={16} /> Preparar Mensaje de Cobro
      </button>
    </div>
  );
}
