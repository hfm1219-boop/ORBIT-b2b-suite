import React, { useState } from 'react';
import { X, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import { VisitResultType } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface VisitResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (resultType: VisitResultType, note: string) => void;
  isLoading?: boolean;
}

const RESULTS: { value: VisitResultType; label: string; icon: any }[] = [
  { value: 'order_created', label: 'Pedido creado', icon: CheckCircle2 },
  { value: 'no_order', label: 'No compró', icon: X },
  { value: 'payment_followup', label: 'Seguimiento cartera', icon: MessageSquare },
  { value: 'buyer_absent', label: 'Comprador ausente', icon: AlertCircle },
  { value: 'customer_closed', label: 'Cliente cerrado', icon: X },
  { value: 'claim', label: 'Reclamo / PQR', icon: AlertCircle },
  { value: 'data_update', label: 'Actualización datos', icon: CheckCircle2 },
  { value: 'other', label: 'Otro / Gestión', icon: MessageSquare },
];

export default function VisitResultModal({ isOpen, onClose, onConfirm, isLoading }: VisitResultModalProps) {
  const [selectedType, setSelectedType] = useState<VisitResultType | null>(null);
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Finalizar Visita</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Registra el resultado de la gestión</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {RESULTS.map((res) => {
              const Icon = res.icon;
              const isSelected = selectedType === res.value;
              return (
                <button
                  key={res.value}
                  onClick={() => setSelectedType(res.value)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                    isSelected 
                      ? "bg-dismel-red/5 border-dismel-red text-dismel-red shadow-sm" 
                      : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={18} className={isSelected ? "text-dismel-red" : "text-gray-300"} />
                  <span className={`text-[10px] font-black uppercase tracking-widest leading-tight ${isSelected ? "text-dismel-red" : "text-gray-500"}`}>
                    {res.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Notas adicionales (Opcional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Escribe detalles relevantes de la visita..."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-dismel-red/20 focus:border-dismel-red/30 transition-all no-scrollbar"
              rows={3}
            />
          </div>
        </div>

        <div className="p-6 pt-2">
          <button
            disabled={!selectedType || isLoading}
            onClick={() => selectedType && onConfirm(selectedType, note)}
            className="w-full h-14 bg-dismel-red text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-dismel-red/20 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={20} />
                Confirmar Finalización
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
