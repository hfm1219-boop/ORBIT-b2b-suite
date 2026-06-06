import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, DollarSign, Wallet, AlertOctagon, Share2, MessageSquare, Copy, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface RegisterPromiseModalProps {
  customerId: string;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function RegisterPromiseModal({ customerId, onClose, onSave }: RegisterPromiseModalProps) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                <Calendar size={20} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight">Registrar Promesa</h3>
            </div>
            <button onClick={onClose} className="text-text-muted"><X size={20} /></button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-2">Valor Prometido</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-gray-50 border border-border-soft h-14 pl-12 pr-4 rounded-2xl text-sm font-bold outline-none focus:border-orange-500/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-2">Fecha de Pago</label>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-50 border border-border-soft h-14 px-4 rounded-2xl text-sm font-bold outline-none focus:border-orange-500/30 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-2">Comentarios / Notas</label>
              <textarea 
                placeholder="Ej: El cliente dice que consigna el viernes por la mañana..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50 border border-border-soft h-32 p-4 rounded-2xl text-sm font-bold outline-none focus:border-orange-500/30 transition-all no-scrollbar resize-none"
              />
            </div>
          </div>

          <button 
            disabled={!amount || !date}
            onClick={() => onSave({ amount: Number(amount), promise_date: date, notes, customer_id: customerId })}
            className="w-full mt-8 h-14 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            Guardar Promesa de Pago
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface GenerateLinkModalProps {
  amount: number;
  onClose: () => void;
}

export function GenerateLinkModal({ amount, onClose }: GenerateLinkModalProps) {
  const [generatedLink] = useState(`https://pagos.dismel.com/link/${Math.random().toString(36).substring(7)}`);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsapp = () => {
    const msg = `Hola, te comparto el link para realizar el pago de las facturas vencidas por valor de ${formatCurrency(amount)}: ${generatedLink}. Cuando lo realices, me confirmas por favor para validar con cartera.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden"
      >
        <div className="p-8 text-center text-center">
          <div className="w-16 h-16 bg-black text-white rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Share2 size={32} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">Link de Pago Generado</h3>
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-8">Por valor de {formatCurrency(amount)}</p>

          <div className="bg-gray-50 border border-border-soft p-4 rounded-2xl flex items-center justify-between mb-8">
            <p className="text-[11px] font-mono text-text-main overflow-hidden text-ellipsis whitespace-nowrap pr-4">{generatedLink}</p>
            <button 
              onClick={handleCopy}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white text-text-muted border border-border-soft'}`}
            >
              {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button 
               onClick={onClose}
               className="h-14 bg-gray-100 text-text-main rounded-2xl font-black uppercase tracking-widest text-[11px]"
             >
                Cerrar
             </button>
             <button 
               onClick={handleSendWhatsapp}
               className="h-14 bg-green-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-green-500/20"
             >
                <MessageSquare size={18} /> Enviar WhatsApp
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface ReportPaymentModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

export function ReportPaymentModal({ onClose, onSave }: ReportPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("transf");
  const [reference, setReference] = useState("");

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                <Wallet size={20} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight">Informar Pago</h3>
            </div>
            <button onClick={onClose} className="text-text-muted"><X size={20} /></button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-2">Valor Pagado por Cliente</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-gray-50 border border-border-soft h-14 pl-12 pr-4 rounded-2xl text-sm font-bold outline-none focus:border-green-500/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-2">Medio de Pago</label>
              <select 
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-gray-50 border border-border-soft h-14 px-4 rounded-2xl text-sm font-bold outline-none focus:border-green-500/30 transition-all appearance-none"
              >
                <option value="transf">Transferencia Bancaria</option>
                <option value="consign">Consignación</option>
                <option value="cheque">Cheque</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-2">Referencia / Comprobante</label>
              <input 
                type="text"
                placeholder="Número de referencia o transacción"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-gray-50 border border-border-soft h-14 px-4 rounded-2xl text-sm font-bold outline-none focus:border-green-500/30 transition-all"
              />
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-[10px] font-bold text-blue-800 leading-relaxed italic">
               El registro de pago quedará como "Pendiente de Validación" hasta que el equipo de cartera confirme el ingreso.
            </div>
          </div>

          <button 
            disabled={!amount}
            onClick={() => onSave({ amount: Number(amount), payment_method: method, reference })}
            className="w-full mt-8 h-14 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            Informar Pago a Cartera
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface EscalateModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

export function EscalateModal({ onClose, onSave }: EscalateModalProps) {
  const [reason, setReason] = useState("block_removal");
  const [priority, setPriority] = useState("medium");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                <AlertOctagon size={20} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight">Escalar a Cartera</h3>
            </div>
            <button onClick={onClose} className="text-text-muted"><X size={20} /></button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-2">Motivo del Escalado</label>
              <select 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-gray-50 border border-border-soft h-14 px-4 rounded-2xl text-sm font-bold outline-none focus:border-red-500/30 transition-all appearance-none"
              >
                <option value="block_removal">Solicitar Desbloqueo</option>
                <option value="limit_increase">Solicitud de Cupo</option>
                <option value="reported_payment">Validación de Pago Reportado</option>
                <option value="dispute">Error en Factura / Disputa</option>
                <option value="special_negotiation">Negociación Especial</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-2">Prioridad</label>
              <div className="grid grid-cols-3 gap-2">
                 {['low', 'medium', 'high'].map(p => (
                   <button
                     key={p}
                     onClick={() => setPriority(p)}
                     className={`h-11 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                       priority === p ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-gray-50 border-border-soft text-text-muted'
                     }`}
                   >
                     {p === 'low' ? 'Baja' : p === 'medium' ? 'Media' : 'Alta'}
                   </button>
                 ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-2">Detalles / Explicación</label>
              <textarea 
                placeholder="Explica brevemente por qué necesitas escalar este caso..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50 border border-border-soft h-32 p-4 rounded-2xl text-sm font-bold outline-none focus:border-red-500/30 transition-all no-scrollbar resize-none"
              />
            </div>
          </div>

          <button 
            disabled={!notes}
            onClick={() => onSave({ reason, priority, notes })}
            className="w-full mt-8 h-14 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            Enviar Solicitud a Cartera
          </button>
        </div>
      </motion.div>
    </div>
  );
}
