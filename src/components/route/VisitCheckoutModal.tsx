import React, { useState } from "react";
import { X, CheckCircle2, AlertTriangle, Calendar, MessageSquare, DollarSign, Package, UserX, Clock, PhoneCall } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { VisitResult, SmartRouteVisit } from "../../types";
import { feedbackLogger } from "../../utils/feedbackLogger";
import QuickFeedbackPrompt from "../feedback/QuickFeedbackPrompt";

interface VisitCheckoutModalProps {
  visit: SmartRouteVisit;
  onClose: () => void;
  onConfirm: (result: Partial<VisitResult>) => Promise<void>;
}

export default function VisitCheckoutModal({ visit, onClose, onConfirm }: VisitCheckoutModalProps) {
  const [outcome, setOutcome] = useState<VisitResult["outcome"]>("order_created");
  const [notes, setNotes] = useState("");
  const [nextStep, setNextStep] = useState("Llamar");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [promiseDate, setPromiseDate] = useState("");
  const [issueType, setIssueType] = useState<VisitResult["issue_type"]>("logística");
  const [followUpDate, setFollowUpDate] = useState("");
  const [showNoPurchaseFeedback, setShowNoPurchaseFeedback] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outcomes: { value: VisitResult["outcome"]; label: string; icon: React.ReactNode; color: string }[] = [
    { value: "order_created", label: "Pedido creado", icon: <Package size={16} />, color: "bg-green-500" },
    { value: "payment_collected", label: "Pago recibido", icon: <DollarSign size={16} />, color: "bg-blue-500" },
    { value: "promise_to_pay", label: "Promesa de pago", icon: <Calendar size={16} />, color: "bg-orange-500" },
    { value: "no_purchase", label: "No compró", icon: <X size={16} />, color: "bg-gray-500" },
    { value: "customer_closed", label: "Cliente cerrado", icon: <UserX size={16} />, color: "bg-red-500" },
    { value: "not_available", label: "No disponible", icon: <Clock size={16} />, color: "bg-yellow-600" },
    { value: "issue_reported", label: "Novedad reportada", icon: <AlertTriangle size={16} />, color: "bg-red-600" },
    { value: "relationship_visit", label: "Visita relación", icon: <MessageSquare size={16} />, color: "bg-teal-500" },
    { value: "rescheduled", label: "Reprogramar", icon: <PhoneCall size={16} />, color: "bg-indigo-500" },
  ];

  const [lastEventId, setLastEventId] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const result: Partial<VisitResult> = {
        outcome,
        notes,
        next_step: nextStep,
        created_at: new Date().toISOString(),
      };

      if (outcome === "payment_collected") result.payment_amount = Number(paymentAmount);
      if (outcome === "promise_to_pay") result.promise_to_pay_date = promiseDate;
      if (outcome === "issue_reported") result.issue_type = issueType;
      if (outcome === "rescheduled") result.next_follow_up_date = followUpDate;

      // Log the visit completion and capture the event ID
      try {
        const eventId = await feedbackLogger.logVisitCompleted(visit.customer_id, visit.customer_name, visit.id, outcome as any);
        if (eventId) setLastEventId(eventId);
      } catch (logErr) {
        console.warn("Logging failed but continuing:", logErr);
      }
      
      // If no purchase and no payment, maybe ask more
      if (outcome === 'no_purchase' || outcome === 'customer_closed' || outcome === 'not_available') {
        setShowNoPurchaseFeedback(true);
        setSubmitting(false);
      } else {
        await onConfirm(result);
      }
    } catch (err: any) {
      console.error("Error confirming checkout:", err);
      setError(err.message || "Error al finalizar la visita. Por favor intenta de nuevo.");
      setSubmitting(false);
    }
  };

  const handleNoPurchaseComplete = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const result: Partial<VisitResult> = {
        outcome,
        notes,
        next_step: nextStep,
        created_at: new Date().toISOString(),
      };
      await onConfirm(result);
    } catch (err: any) {
      console.error("Error in no purchase feedback:", err);
      setError(err.message || "Error al guardar el feedback.");
      setShowNoPurchaseFeedback(false); // Go back to allow retry
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="p-8 border-b border-border-soft flex justify-between items-center bg-white flex-shrink-0">
          <div>
             <h3 className="text-xl font-black uppercase tracking-tight text-text-main">Finalizar Visita</h3>
             <p className="text-[10px] font-black text-dismel-red uppercase tracking-widest mt-0.5">{visit.customer_name}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-text-muted active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
          <AnimatePresence mode="wait">
            {showNoPurchaseFeedback ? (
              <motion.div 
                key="feedback"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8"
              >
                <div className="bg-red-50 p-6 rounded-[32px] border border-red-100 mb-6">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-dismel-red mb-4 shadow-sm">
                      <Package size={24} />
                   </div>
                   <h4 className="text-sm font-black uppercase tracking-tight text-text-main mb-1">¿Por qué no hubo pedido hoy?</h4>
                   <p className="text-[10px] font-bold text-text-muted">Tu respuesta ayuda a mejorar las recomendaciones de la IA.</p>
                </div>

                <QuickFeedbackPrompt
                  title=""
                  customerId={visit.customer_id}
                  customerName={visit.customer_name}
                  relatedEntityType="smart_route_visit"
                  relatedEntityId={visit.id}
                  baseEventId={lastEventId || undefined}
                  options={[
                    { label: "Precio", value: "price", code: "price" },
                    { label: "Competidor", value: "comp", code: "competitor" },
                    { label: "No Necesita", value: "noneed", code: "no_need" },
                    { label: "Sin Dinero", value: "nomoney", code: "no_money" },
                    { label: "Cerrado", value: "closed", code: "closed" },
                    { label: "Regresará", value: "later", code: "bad_timing" }
                  ]}
                  onComplete={handleNoPurchaseComplete}
                  onSkip={handleNoPurchaseComplete}
                />
              </motion.div>
            ) : (
              <motion.div
                key="main-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                    <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-red-700">{error}</p>
                  </div>
                )}

                {/* Outcomes Grid */}
                <div className="mb-8">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-text-muted mb-4 px-1">Resultado de la visita</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {outcomes.map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setOutcome(item.value)}
                        className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all gap-2 h-24 ${
                          outcome === item.value 
                            ? 'bg-dismel-red/5 border-dismel-red' 
                            : 'bg-white border-border-soft'
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${outcome === item.value ? 'bg-dismel-red text-white' : 'bg-gray-100 text-text-muted'}`}>
                          {item.icon}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tight text-center leading-tight ${outcome === item.value ? 'text-dismel-red' : 'text-text-muted'}`}>
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Fields */}
                <div className="space-y-4">
                  {outcome === 'payment_collected' && (
                    <div className="mb-8 overflow-hidden">
                      <label className="text-[11px] font-black uppercase tracking-widest text-text-muted mb-2 block px-1">Monto recibido</label>
                      <div className="relative">
                        <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input 
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-gray-50 border border-border-soft rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-dismel-red/30"
                        />
                      </div>
                    </div>
                  )}

                  {outcome === 'promise_to_pay' && (
                    <div className="mb-8 overflow-hidden">
                      <label className="text-[11px] font-black uppercase tracking-widest text-text-muted mb-2 block px-1">Fecha promesa de pago</label>
                      <input 
                        type="date"
                        value={promiseDate}
                        onChange={(e) => setPromiseDate(e.target.value)}
                        className="w-full bg-gray-50 border border-border-soft rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-dismel-red/30"
                      />
                    </div>
                  )}

                  {outcome === 'issue_reported' && (
                    <div className="mb-8 overflow-hidden">
                      <label className="text-[11px] font-black uppercase tracking-widest text-text-muted mb-4 block px-1">Tipo de novedad</label>
                      <div className="flex flex-wrap gap-2">
                        {["logística", "producto", "cartera", "precio", "servicio", "otro"].map((type) => (
                          <button
                            key={type}
                            onClick={() => setIssueType(type as any)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              issueType === type 
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                                : 'bg-gray-100 text-text-muted'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {outcome === 'rescheduled' && (
                    <div className="mb-8 overflow-hidden">
                      <label className="text-[11px] font-black uppercase tracking-widest text-text-muted mb-2 block px-1">Fecha de reprogramación</label>
                      <input 
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full bg-gray-50 border border-border-soft rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-dismel-red/30"
                      />
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="mb-8">
                  <label className="text-[11px] font-black uppercase tracking-widest text-text-muted mb-2 block px-1">Observaciones</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Detalles adicionales de la visita..."
                    className="w-full bg-gray-50 border border-border-soft rounded-[32px] py-5 px-6 text-sm font-bold outline-none focus:border-dismel-red/30 min-h-[120px] no-scrollbar"
                  />
                </div>

                {/* Next Steps */}
                <div className="mb-8">
                  <label className="text-[11px] font-black uppercase tracking-widest text-text-muted mb-4 block px-1">Próximo paso sugerido</label>
                  <div className="flex flex-wrap gap-2">
                    {["Llamar", "Enviar propuesta", "Crear pedido después", "Gestionar cartera", "Reprogramar visita", "Escalar"].map((step) => (
                      <button
                        key={step}
                        onClick={() => setNextStep(step)}
                        className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          nextStep === step 
                            ? 'bg-black text-white' 
                            : 'bg-gray-100 text-text-muted'
                        }`}
                      >
                        {step}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        {!showNoPurchaseFeedback && (
          <div className="p-8 bg-white border-t border-border-soft flex gap-4 flex-shrink-0">
            <button 
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-14 bg-gray-100 rounded-3xl text-[11px] font-black uppercase tracking-widest text-text-muted active:scale-95 transition-transform disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 h-14 bg-dismel-red text-white rounded-3xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-dismel-red/20 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Finalizar Visita
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
