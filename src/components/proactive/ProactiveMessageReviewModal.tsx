import React, { useState, useEffect } from "react";
import { X, CheckCircle2, MessageSquare, Copy, ExternalLink, Trash2, Send, AlertCircle, Edit3, User, Info, Smartphone, Zap } from "lucide-react";
import { motion } from "motion/react";
import { ProactiveMessage, PriorityScore } from "../../types";
import { proactiveMessageService } from "../../services/proactiveMessageService";
import { scoringService } from "../../services/scoringService";
import { feedbackLogger } from "../../utils/feedbackLogger";
import QuickFeedbackPrompt from "../feedback/QuickFeedbackPrompt";

interface ProactiveMessageReviewModalProps {
  message: ProactiveMessage;
  onClose: () => void;
  onAction: (action: "approve" | "discard" | "sent") => void;
}

export default function ProactiveMessageReviewModal({ message, onClose, onAction }: ProactiveMessageReviewModalProps) {
  const [editedBody, setEditedBody] = useState(message.message_body);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [customerScore, setCustomerScore] = useState<PriorityScore | null>(null);

  useEffect(() => {
    const loadScore = async () => {
      const response = await scoringService.getCustomerScore(message.customer_id);
      if (response.ok && response.score) {
        setCustomerScore(response.score);
      }
    };
    loadScore();
  }, [message.customer_id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedBody);
  };

  const handleOpenWhatsApp = () => {
    if (!message.phone) return;
    const cleanPhone = message.phone.replace(/\+/g, '').replace(/\s/g, '');
    const encoded = encodeURIComponent(editedBody);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    feedbackLogger.logWhatsAppOpened(message.customer_id, message.customer_name, "proactive_message", message.id);
  };

  const handleApprove = async () => {
    setLoading(true);
    const response = await proactiveMessageService.approveMessage(message.id);
    if (response.ok) {
      feedbackLogger.logMessageApproved(message.customer_id, message.customer_name, "proactive_message", message.id);
      onAction("approve");
    }
    setLoading(false);
  };

  const handleDiscard = async () => {
    setShowFeedback(true);
    setFeedbackMode("discard");
  };

  const handleConfirmDiscard = async (option: any) => {
    setLoading(true);
    const response = await proactiveMessageService.discardMessage(message.id, option.label);
    if (response.ok) {
      feedbackLogger.logMessageDiscarded(message.customer_id, message.customer_name, "proactive_message", message.id, option.code);
      onAction("discard");
    }
    setLoading(false);
  };

  const handleMarkAsSent = async () => {
    setLoading(true);
    const response = await proactiveMessageService.markAsSent(message.id);
    if (response.ok) {
      feedbackLogger.logMessageSent(message.customer_id, message.customer_name, "proactive_message", message.id);
      setShowFeedback(true);
      setFeedbackMode("sent");
    }
    setLoading(false);
  };

  const [feedbackMode, setFeedbackMode] = useState<"sent" | "discard" | null>(null);

  const handleFeedbackComplete = () => {
    if (feedbackMode === "sent") {
      onAction("sent");
    } else {
      onAction("discard");
    }
  };

  const hasPhone = !!message.phone;
  const isTooLong = editedBody.length > 900;

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="p-8 border-b border-border-soft flex justify-between items-center bg-white flex-shrink-0">
          <div>
             <h3 className="text-xl font-black uppercase tracking-tight text-text-main">Revisar Mensaje</h3>
             <div className="flex items-center gap-2 mt-1">
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                  message.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {message.trigger_type}
                </span>
                <span className="text-[10px] font-bold text-text-muted">ID: {message.id}</span>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-text-muted active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
          {showFeedback && (
            <div className="mb-8">
              {feedbackMode === "sent" ? (
                <QuickFeedbackPrompt
                  title="¿Ya respondió el cliente?"
                  customerId={message.customer_id}
                  customerName={message.customer_name}
                  relatedEntityType="proactive_message"
                  relatedEntityId={message.id}
                  strategyType={message.trigger_type as any}
                  options={[
                    { label: "Compró", value: "won", outcome: "order_won", response: "accepted" },
                    { label: "Interesado", value: "interested", outcome: "opportunity_open", response: "interested" },
                    { label: "Después", value: "later", response: "asked_for_later" },
                    { label: "No respondió", value: "no_resp", response: "no_response" },
                    { label: "Rechazó", value: "rejected", outcome: "opportunity_lost", response: "rejected" },
                    { label: "Pagó", value: "paid", outcome: "payment_received", response: "paid" }
                  ]}
                  onComplete={() => handleFeedbackComplete()}
                  onSkip={handleFeedbackComplete}
                />
              ) : (
                <QuickFeedbackPrompt
                  title="¿Por qué descartas este mensaje?"
                  customerId={message.customer_id}
                  customerName={message.customer_name}
                  relatedEntityType="proactive_message"
                  relatedEntityId={message.id}
                  strategyType={message.trigger_type as any}
                  options={[
                    { label: "No aplica", value: "none", code: "no_need" },
                    { label: "Ya contactado", value: "contacted", code: "bad_timing" },
                    { label: "Cartera", value: "credit", code: "credit_block" },
                    { label: "Precio", value: "price", code: "price" },
                    { label: "Repetido", value: "dupe", code: "other" },
                    { label: "Otro", value: "other", code: "other" }
                  ]}
                  onComplete={(opt) => handleConfirmDiscard(opt)}
                  onSkip={() => setShowFeedback(false)}
                />
              )}
            </div>
          )}

          {/* Customer Context */}
          <div className="mb-8 p-6 bg-gray-50 rounded-[32px] border border-border-soft">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-dismel-red border border-border-soft shadow-sm">
                   <User size={24} />
                </div>
                <div>
                   <h4 className="text-sm font-black text-text-main uppercase tracking-tight">{message.customer_name}</h4>
                   <div className="flex items-center gap-2">
                      <Smartphone size={12} className="text-text-muted" />
                      <span className={`text-[10px] font-bold ${hasPhone ? 'text-text-muted' : 'text-red-500'}`}>
                        {hasPhone ? message.phone : "Sin teléfono registrado"}
                      </span>
                   </div>
                </div>
             </div>
             
             <div className="space-y-3">
                <div className="flex gap-3">
                   <Info size={14} className="text-dismel-red shrink-0 mt-0.5" />
                   <div>
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Motivo de la sugerencia</p>
                      <p className="text-[11px] font-bold text-text-main leading-relaxed">{message.reason}</p>
                   </div>
                </div>
                <div className="flex gap-3">
                   <Edit3 size={14} className="text-text-muted shrink-0 mt-0.5" />
                   <div>
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Fuente</p>
                      <p className="text-[11px] font-bold text-text-main uppercase tracking-tight">{(message.source || '').replace('_', ' ')}</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Warning Messages */}
          <div className="space-y-2 mb-8">
             {customerScore?.strategy_warnings && customerScore.strategy_warnings.map((warn, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700">
                   <AlertCircle size={18} />
                   <span className="text-[10px] font-black uppercase tracking-tight">{warn}</span>
                </div>
             ))}
             {customerScore?.recommended_channel && customerScore.recommended_channel !== 'whatsapp' && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-border-soft text-text-muted">
                   <Info size={18} className="text-blue-500" />
                   <span className="text-[10px] font-black uppercase tracking-tight">Canal preferido sugerido: {customerScore.recommended_channel}</span>
                </div>
             )}
             {!hasPhone && (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600">
                   <AlertCircle size={18} />
                   <span className="text-[10px] font-black uppercase tracking-tight">No se puede enviar vía WhatsApp sin teléfono</span>
                </div>
             )}
             {isTooLong && (
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100 text-orange-600">
                   <AlertCircle size={18} />
                   <span className="text-[10px] font-black uppercase tracking-tight">El mensaje excede los 900 caracteres recomendados</span>
                </div>
             )}
             {(message.trigger_type === 'credit_overdue' || message.trigger_type === 'credit_due') && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 text-cyan-700">
                   <AlertCircle size={18} />
                   <span className="text-[10px] font-black uppercase tracking-tight">Mensaje relacionado con Cartera. Sea cordial.</span>
                </div>
             )}
          </div>

          {/* Message Editor */}
          <div className="mb-8">
             <div className="flex items-center justify-between mb-4 px-1">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-text-muted">Cuerpo del Mensaje</h4>
                <div className="flex gap-2">
                   <button 
                     onClick={handleCopy}
                     className="p-2 text-text-muted hover:text-dismel-red transition-all active:scale-90"
                   >
                     <Copy size={16} />
                   </button>
                   <button 
                     onClick={() => setIsEditing(!isEditing)}
                     className={`p-2 transition-all active:scale-90 ${isEditing ? 'text-dismel-red' : 'text-text-muted'}`}
                   >
                     <Edit3 size={16} />
                   </button>
                </div>
             </div>
             
             <div className="relative">
                <textarea 
                   disabled={!isEditing}
                   value={editedBody}
                   onChange={(e) => setEditedBody(e.target.value)}
                   className={`w-full p-6 pb-12 rounded-[32px] text-sm font-bold leading-relaxed border-2 transition-all outline-none min-h-[200px] no-scrollbar ${
                     isEditing 
                      ? 'bg-white border-dismel-red shadow-lg shadow-dismel-red/5' 
                      : 'bg-gray-50 border-border-soft text-text-main'
                   }`}
                />
                <div className="absolute bottom-6 right-8 text-[10px] font-black text-text-muted uppercase tracking-widest">
                   {editedBody.length} / 900
                </div>
                {isEditing && (
                  <div className="absolute top-4 right-4 animate-pulse">
                     <div className="bg-dismel-red text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Editando</div>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-white border-t border-border-soft flex flex-col gap-4 flex-shrink-0">
          <div className="flex gap-3">
             <button 
               onClick={handleDiscard}
               disabled={loading}
               className="flex-1 h-14 bg-gray-100 rounded-3xl text-[11px] font-black uppercase tracking-widest text-red-600 active:scale-95 transition-transform flex items-center justify-center gap-2"
             >
               <Trash2 size={18} /> Descartar
             </button>
             <button 
               onClick={handleApprove}
               disabled={loading}
               className="flex-1 h-14 bg-black text-white rounded-3xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2"
             >
               <CheckCircle2 size={18} /> Aprobar
             </button>
          </div>
          
          <div className="h-px bg-border-soft" />
          
          <div className="flex gap-3">
             <button 
               onClick={handleOpenWhatsApp}
               disabled={!hasPhone || loading}
               className="flex-[2] h-14 bg-green-500 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-green-500/20 active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
             >
               <Send size={18} /> Abrir WhatsApp
             </button>
             <button 
               onClick={handleMarkAsSent}
               disabled={loading}
               className="flex-1 h-14 bg-white border-2 border-green-500 text-green-600 rounded-3xl text-[9px] font-black uppercase tracking-tight text-center px-2 active:scale-95 transition-transform disabled:opacity-50"
             >
               Marcar Enviado
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
