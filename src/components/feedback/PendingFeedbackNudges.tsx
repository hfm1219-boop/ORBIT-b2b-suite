import React, { useState, useEffect } from "react";
import { MessageSquare, CheckCircle2, ChevronRight, X, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { feedbackService } from "../../services/feedbackService";
import QuickFeedbackPrompt from "./QuickFeedbackPrompt";

export default function PendingFeedbackNudges() {
  const [nudges, setNudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNudge, setActiveNudge] = useState<any | null>(null);

  useEffect(() => {
    loadNudges();
  }, []);

  const loadNudges = async () => {
    setLoading(true);
    const response = await feedbackService.getPendingFeedbackPrompts();
    if (response.ok) {
      setNudges(Array.isArray(response.data) ? response.data : []);
    }
    setLoading(false);
  };

  const handleComplete = (id: string) => {
    setNudges(prev => prev.filter(n => n.id !== id));
    setActiveNudge(null);
  };

  if (loading || nudges.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
               <Info size={10} />
            </div>
            <h4 className="text-[10px] font-black text-text-main uppercase tracking-widest">Pendientes de Feedback</h4>
         </div>
         <span className="text-[9px] font-bold text-text-muted">{nudges.length} items</span>
      </div>

      <div className="space-y-3">
        {Array.isArray(nudges) && nudges.map((nudge) => (
          <div key={nudge.id}>
            {activeNudge?.id === nudge.id ? (
              <QuickFeedbackPrompt
                title={nudge.label}
                customerId={nudge.customer_id}
                customerName={nudge.customer_name}
                relatedEntityType={nudge.event_type === 'whatsapp_opened' ? 'proactive_message' : 'smart_route_visit'}
                options={
                  nudge.event_type === 'whatsapp_opened' ? [
                    { label: "Compró", value: "won", outcome: "order_won", response: "accepted" },
                    { label: "Interesado", value: "interested", outcome: "opportunity_open", response: "interested" },
                    { label: "Después", value: "later", response: "asked_for_later" },
                    { label: "No respondió", value: "no_resp", response: "no_response" },
                    { label: "Rechazó", value: "rejected", outcome: "opportunity_lost", response: "rejected" }
                  ] : [
                    { label: "Precio", value: "price", code: "price" },
                    { label: "Competidor", value: "comp", code: "competitor" },
                    { label: "No Necesita", value: "noneed", code: "no_need" },
                    { label: "Sin Dinero", value: "nomoney", code: "no_money" },
                    { label: "Cerrado", value: "closed", code: "closed" }
                  ]
                }
                onComplete={() => handleComplete(nudge.id)}
                onSkip={() => setActiveNudge(null)}
              />
            ) : (
              <motion.button
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setActiveNudge(nudge)}
                className="w-full bg-white border border-border-soft rounded-2xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    nudge.event_type === 'whatsapp_opened' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {nudge.event_type === 'whatsapp_opened' ? <MessageSquare size={14} /> : <CheckCircle2 size={14} />}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-text-main uppercase tracking-tight leading-tight">{nudge.customer_name}</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-0.5">{nudge.label}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-text-muted" />
              </motion.button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
