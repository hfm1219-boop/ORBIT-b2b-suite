import React, { useState, useEffect } from "react";
import { MessageSquare, CheckCircle2, Trash2, Send, ExternalLink, ChevronRight, Zap, Smartphone as Mobile, Star, Smartphone, Copy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProactiveMessage, PriorityScore } from "../../types";
import { proactiveMessageService } from "../../services/proactiveMessageService";
import { scoringService } from "../../services/scoringService";
import { feedbackLogger } from "../../utils/feedbackLogger";
import ProactiveMessageReviewModal from "./ProactiveMessageReviewModal";
import SignalsDetailModal from "../scoring/SignalsDetailModal";

export default function ProactiveMessagesInbox() {
  const [messages, setMessages] = useState<ProactiveMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ProactiveMessage | null>(null);
  const [scores, setScores] = useState<PriorityScore[]>([]);
  const [selectedScore, setSelectedScore] = useState<PriorityScore | null>(null);

  useEffect(() => {
    loadMessages();
    loadScores();
  }, []);

  const loadScores = async () => {
    const response = await scoringService.getAdvisorPriorityScores();
    if (response.ok && response.scores) {
      setScores(response.scores);
    }
  };

  const getScoreForMsg = (msg: ProactiveMessage) => {
    return scores.find(s => s.customer_id === msg.customer_id);
  };

  const loadMessages = async () => {
    setLoading(true);
    const response = await proactiveMessageService.getPendingMessages();
    if (response.ok && response.messages) {
      setMessages(response.messages);
    }
    setLoading(false);
  };

  const handleMessageAction = (action: string) => {
     // Remove from list or refresh
     if (selectedMessage) {
        setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
     }
     setSelectedMessage(null);
  };

  if (loading) {
    return (
      <div className="py-10 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-dismel-red/20 border-t-dismel-red rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Buscando sugerencias comerciales...</p>
      </div>
    );
  }

  if (messages.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
            Mensajes Recomendados
            <div className="bg-black text-white text-[8px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
               <Zap size={6} fill="currentColor" />
               {messages.length}
            </div>
          </h2>
          <p className="text-[10px] font-bold text-text-muted mt-0.5">Acciones proactivas por aprobar</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-[280px] bg-white rounded-[32px] border border-border-soft shadow-sm p-5 relative overflow-hidden"
          >
            {/* Priority Badge */}
            <div className="absolute top-0 right-0 flex items-center">
              {getScoreForMsg(msg) && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedScore(getScoreForMsg(msg)!);
                  }}
                  className="px-2 py-1 bg-black text-white text-[8px] font-black uppercase tracking-widest border-r border-white/10"
                >
                  <Zap size={8} fill="currentColor" className="inline mr-1" />
                  {getScoreForMsg(msg)!.total_score}
                </button>
              )}
              <div className={`px-4 py-1 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest ${
                msg.priority === 'high' ? 'bg-red-600 text-white' : 'bg-blue-500 text-white'
              }`}>
                {msg.priority === 'high' ? 'Crítico' : 'Recurrente'}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-dismel-gray rounded-xl flex items-center justify-center text-dismel-red">
                <MessageSquare size={18} />
              </div>
              <div className="min-w-0 pr-10">
                <h3 className="text-[11px] font-black text-text-main uppercase tracking-tight truncate">
                  {msg.customer_name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <Smartphone size={10} className="text-text-muted" />
                   <span className="text-[9px] font-bold text-text-muted truncate">{msg.phone || 'Sin número'}</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
               <p className="text-[9px] font-black text-dismel-red uppercase tracking-widest mb-1.5">{msg.title}</p>
               <p className="text-[10px] font-bold text-text-main line-clamp-2 leading-relaxed bg-gray-50 p-3 rounded-2xl border border-dashed border-border-soft">
                 "{msg.message_body}"
               </p>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedMessage(msg)}
                className="flex-[2] h-10 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
              >
                Revisar
              </button>
              <button 
                onClick={() => {
                   const cleanPhone = msg.phone?.replace(/\+/g, '').replace(/\s/g, '');
                   const encoded = encodeURIComponent(msg.message_body);
                   window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
                   feedbackLogger.logWhatsAppOpened(msg.customer_id, msg.customer_name, "proactive_message", msg.id);
                }}
                className="flex-1 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedMessage && (
          <ProactiveMessageReviewModal 
            message={selectedMessage}
            onClose={() => setSelectedMessage(null)}
            onAction={handleMessageAction}
          />
        )}

        {selectedScore && (
          <SignalsDetailModal 
            score={selectedScore}
            onClose={() => setSelectedScore(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
