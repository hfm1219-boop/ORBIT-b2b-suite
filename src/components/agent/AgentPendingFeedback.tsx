import React, { useState, useEffect } from "react";
import { feedbackService } from "../../services/feedbackService";
import QuickFeedbackPrompt from "../feedback/QuickFeedbackPrompt";
import { MessageSquare, ChevronRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AgentPendingFeedback() {
  const [nudges, setNudges] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [activeNudge, setActiveNudge] = useState<any | null>(null);

  useEffect(() => {
    loadNudges();
    
    // Listen for updates
    window.addEventListener("feedback:updated", loadNudges);
    return () => window.removeEventListener("feedback:updated", loadNudges);
  }, []);

  const loadNudges = async () => {
    const response = await feedbackService.getPendingFeedbackPrompts();
    if (response.ok) {
      setNudges(response.data.slice(0, 3)); // Limit to top 3
    }
  };

  if (nudges.length === 0) return null;

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden mb-4">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-slate-700 active:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
            <MessageSquare size={12} className="text-slate-600" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-tight">Feedback Pendiente ({nudges.length})</span>
        </div>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {nudges.map((nudge) => (
                <div key={nudge.id} className="bg-white rounded-xl border border-slate-200 p-3">
                  {activeNudge?.id === nudge.id ? (
                    <QuickFeedbackPrompt
                      title="Actualizar Feedback"
                      customerId={nudge.customer_id}
                      customerName={nudge.customer_name}
                      relatedEntityType="customer_360" // Defaulting to 360 if not specified
                      options={[
                        { label: "Compró", value: "won", outcome: "order_won", response: "accepted" },
                        { label: "Interesado", value: "int", outcome: "opportunity_open", response: "interested" },
                        { label: "Pagó", value: "paid", outcome: "payment_received", response: "paid" },
                        { label: "Prometió", value: "prom", outcome: "promise_to_pay", response: "promise_to_pay" },
                        { label: "Rechazó", value: "rej", outcome: "opportunity_lost", response: "rejected" },
                        { label: "Después", value: "later", response: "asked_for_later" }
                      ]}
                      onComplete={() => {
                        setActiveNudge(null);
                        loadNudges();
                      }}
                      onSkip={() => setActiveNudge(null)}
                    />
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{nudge.customer_name}</p>
                        <p className="text-xs font-bold text-slate-800">{nudge.label}</p>
                      </div>
                      <button 
                        onClick={() => setActiveNudge(nudge)}
                        className="p-2 text-indigo-600 active:scale-95"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
