import React, { useState } from "react";
import { Check, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { feedbackService } from "../../services/feedbackService";
import { scoringService } from "../../services/scoringService";
import { CommercialFeedbackEvent } from "../../types";

interface QuickFeedbackOption {
  label: string;
  value: string;
  code?: CommercialFeedbackEvent['reason_code'];
  outcome?: CommercialFeedbackEvent['outcome'];
  response?: CommercialFeedbackEvent['customer_response'];
}

interface QuickFeedbackPromptProps {
  title: string;
  customerId: string;
  customerName: string;
  relatedEntityType: CommercialFeedbackEvent['related_entity_type'];
  relatedEntityId?: string;
  strategyType?: CommercialFeedbackEvent['strategy_type'];
  baseEventId?: string;
  options: QuickFeedbackOption[];
  onComplete?: (option: QuickFeedbackOption) => void;
  onSkip?: () => void;
  onDismiss?: () => void;
}

export default function QuickFeedbackPrompt({
  title,
  customerId,
  customerName,
  relatedEntityType,
  relatedEntityId,
  strategyType,
  baseEventId,
  options,
  onComplete,
  onSkip,
  onDismiss
}: QuickFeedbackPromptProps) {
  const [selectedOption, setSelectedOption] = useState<QuickFeedbackOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");

  const handleSave = async (option: QuickFeedbackOption) => {
    setSaving(true);
    await feedbackService.captureQuickResponse({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
      strategy_type: strategyType,
      event_type: "customer_response_captured",
      outcome: option.outcome || "unknown",
      customer_response: option.response,
      reason_code: option.code,
      note: note || undefined,
      id: baseEventId // Using baseEventId if provided to link or just let service generate new
    });
    
    // Trigger scoring recalculation after feedback
    scoringService.recalculateScores();

    setSaving(false);
    if (onComplete) onComplete(option);
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
    if (onDismiss) onDismiss();
  };

  return (
    <div className="bg-white rounded-3xl border border-border-soft p-5 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-text-muted mb-1">{customerName}</p>
          <h4 className="text-[11px] font-black text-text-main uppercase tracking-tight leading-tight">{title}</h4>
        </div>
        {onSkip && (
           <button onClick={handleSkip} className="p-1 text-text-muted active:scale-95">
              <X size={14} />
           </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSave(opt)}
            disabled={saving}
            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${
              selectedOption?.value === opt.value
                ? 'bg-black text-white border-black'
                : 'bg-dismel-gray text-text-main border-transparent active:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-dashed border-border-soft flex items-center justify-between">
        {!showNote ? (
          <button 
            onClick={() => setShowNote(true)}
            className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1"
          >
            + Agregar nota
          </button>
        ) : (
          <div className="flex-1 mr-4">
            <input 
              type="text" 
              placeholder="Escribe algo corto..."
              className="w-full text-[10px] py-1 border-b border-gray-200 focus:outline-none focus:border-black"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoFocus
            />
          </div>
        )}
        
        <button 
          onClick={handleSkip}
          className="text-[9px] font-black text-text-muted uppercase tracking-widest"
        >
          Después
        </button>
      </div>
    </div>
  );
}
