import React, { useState } from "react";
import { 
  Zap, AlertTriangle, Phone, 
  ShoppingCart, MessageSquare, 
  ChevronRight, Calendar, ArrowUpRight, UserCircle, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { useNavigate } from "react-router-dom";
import { ProactiveMessage, PriorityScore } from "../../types";
import { scoringService } from "../../services/scoringService";
import { feedbackLogger } from "../../utils/feedbackLogger";
import ProactiveMessageReviewModal from "./ProactiveMessageReviewModal";
import SignalsDetailModal from "../scoring/SignalsDetailModal";

interface ActionItem {
  id: string;
  customer_id: string;
  type: 'debt' | 'reminder' | 'opportunity' | 'alert' | 'repurchase' | 'sales_drop' | 'cross_sell';
  title: string;
  description: string;
  customer: string;
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
  color: string;
}

const ACTIONS: ActionItem[] = [
  {
    id: '1',
    customer_id: '3', // Bar Seven (Debt)
    type: 'debt',
    title: 'Cobro Crítico',
    description: 'Factura vencida hace 15 días. Riesgo de bloqueo.',
    customer: 'BAR SEVEN NIGHTS',
    priority: 'high',
    icon: <AlertTriangle size={16} />,
    color: 'bg-error-red/10 text-error-red border-error-red/20'
  },
  {
    id: '2',
    customer_id: '1', // Don Pepe
    type: 'repurchase',
    title: 'Recompra Sugerida',
    description: 'Baja en stock detectada. Sugerencia de 12 ud. Ron Medellín.',
    customer: 'LICORERA DON PEPE SAS',
    priority: 'medium',
    icon: <ShoppingCart size={16} />,
    color: 'bg-green-50 text-green-600 border-green-100'
  },
  {
    id: '3',
    customer_id: '2', // Hotel Caribe (Sales Drop)
    type: 'sales_drop',
    title: 'Caída de Ventas',
    description: '-25% en ventas este mes. Requiere visita de reactivación.',
    customer: 'HOTEL CARIBE INTERNACIONAL',
    priority: 'high',
    icon: <ArrowUpRight size={16} />,
    color: 'bg-orange-50 text-orange-600 border-orange-100'
  }
];

interface NextBestActionsSectionProps {
  onOpenCustomer?: (customerId: string) => void;
}

export default function NextBestActionsSection({ onOpenCustomer }: NextBestActionsSectionProps) {
  const navigate = useNavigate();
  const [selectedProactiveMessage, setSelectedProactiveMessage] = useState<ProactiveMessage | null>(null);
  const [scores, setScores] = useState<PriorityScore[]>([]);
  const [selectedScoreDetails, setSelectedScoreDetails] = useState<PriorityScore | null>(null);

  React.useEffect(() => {
    loadScores();
    
    const handleUpdate = () => loadScores();
    window.addEventListener("scoring:updated", handleUpdate);
    return () => window.removeEventListener("scoring:updated", handleUpdate);
  }, []);

  const loadScores = async () => {
    const response = await scoringService.getAdvisorPriorityScores();
    if (response.ok && response.scores) {
      setScores([...response.scores]);
    }
  };

  const getScoreForAction = (action: ActionItem) => {
    return scores.find(s => s.customer_id === action.customer_id);
  };

  const resolvedActions = ACTIONS.map(action => {
    const score = getScoreForAction(action);
    if (!score) return action;

    // Dynamically adjust action based on score recommendation
    let finalType = action.type;
    let finalTitle = action.title;
    let finalDesc = action.description;

    if (score.recommended_action_type === 'resolve_issue') {
      finalType = 'alert';
      finalTitle = 'Resolver Novedad';
      finalDesc = 'Tiene un problema de servicio activo bloqueando la venta.';
    } else if (score.recommended_action_type === 'collect_payment') {
      finalType = 'debt';
      finalTitle = 'Cobro Urgente';
      finalDesc = 'Factura vencida requiere gestión inmediata.';
    }

    return {
      ...action,
      type: finalType as any,
      title: finalTitle,
      description: finalDesc,
      priority: score.priority === 'critical' ? 'high' : score.priority === 'high' ? 'high' : 'medium'
    } as ActionItem;
  });

  const sortedActions = [...resolvedActions].sort((a, b) => {
    const scoreA = getScoreForAction(a)?.total_score || 0;
    const scoreB = getScoreForAction(b)?.total_score || 0;
    return scoreB - scoreA;
  });

  const handleAction = (action: ActionItem) => {
    // Log action started
    feedbackLogger.logActionStarted(
      action.customer_id, 
      action.customer, 
      action.type as any,
      action.id
    );

    if (action.type === 'debt') {
      onOpenCustomer?.(action.customer_id);
      return;
    }

    if (['repurchase', 'sales_drop', 'opportunity', 'cross_sell'].includes(action.type)) {
      navigate(`/dashboard/suggested-order?customer_id=${action.customer_id}&source=${action.type}`);
    } else {
      onOpenCustomer?.(action.customer_id);
    }
  };

  const handlePrepareMessage = (action: ActionItem) => {
    let title = "Gestión Comercial";
    let body = `Hola equipo de ${action.customer}, ¿cómo van? 👋 Quería contactarlos porque vi que ${action.description.toLowerCase()}. ¿Podemos revisarlo hoy?`;
    
    if (action.type === 'debt') {
      title = "Gestión de Cartera";
      body = `Hola ${action.customer}, espero que estén bien. 👋 Les escribo porque tenemos una factura pendiente por reportar. ¿Me podrían confirmar si ya realizaron el pago para evitar bloqueos en sus próximos pedidos?`;
    } else if (action.type === 'repurchase') {
      title = "Sugerencia de Recompra";
      body = `Hola ${action.customer}, 👋 analizando su historial de ventas veo que podrían estar bajitos de stock en algunos productos clave. Les preparé un pedido sugerido, ¡quedo atento si desean que se los envíe!`;
    }

    const proactiveMsg: ProactiveMessage = {
      id: `NBA-${action.id}`,
      customer_id: action.customer_id,
      customer_name: action.customer,
      advisor_id: "A-01",
      channel: "whatsapp",
      trigger_type: action.type as any,
      status: "pending_review",
      priority: action.priority,
      title: title,
      reason: `Generado desde Acción Prioritaria #${action.id}: ${action.title}`,
      message_body: body,
      source: "manual",
      related_entity_type: "customer",
      related_entity_id: action.customer_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setSelectedProactiveMessage(proactiveMsg);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center text-white">
            <Zap size={16} fill="currentColor" />
          </div>
          <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest">
            Acciones Prioritarias
          </h4>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 pt-1 snap-x -mx-1 px-1">
        {sortedActions.map((action) => {
          const customerScore = getScoreForAction(action);
          return (
            <motion.div 
              key={action.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAction(action)}
              className={`min-w-[260px] max-w-[280px] p-5 rounded-[28px] border shadow-sm relative overflow-hidden flex flex-col bg-white snap-center cursor-pointer`}
            >
              {/* Score Badge */}
              {customerScore && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedScoreDetails(customerScore);
                  }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-black px-3 py-1 rounded-full flex items-center gap-1 active:scale-90 transition-transform"
                >
                   <Zap size={8} fill="currentColor" />
                   SCORE {customerScore.total_score}
                </button>
              )}

              <div className="flex items-start justify-between mb-4">
               <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${action.color}`}>
                  {action.icon}
               </div>
               <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                 action.priority === 'high' ? 'bg-red-50 text-red-600' : 
                 action.priority === 'medium' ? 'bg-orange-50 text-orange-600' : 
                 'bg-gray-50 text-gray-400'
               }`}>
                 {action.priority === 'high' ? 'Crítico' : action.priority === 'medium' ? 'Importante' : 'Normal'}
               </div>
            </div>

            <div className="flex-1 mb-5">
               <div className="flex items-center gap-1.5 mb-1 opacity-50">
                  <UserCircle size={10} strokeWidth={3} />
                  <h5 className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none">
                    {action.customer}
                  </h5>
               </div>
               <h4 className="text-[13px] font-black text-text-main leading-tight mb-2">
                 {action.title}
               </h4>
               <p className="text-[10px] text-text-muted font-bold leading-relaxed line-clamp-2">
                 {action.description}
               </p>

               {customerScore?.strategy_warnings && customerScore.strategy_warnings.length > 0 && (
                 <div className="mt-3 flex flex-wrap gap-1">
                   {customerScore.strategy_warnings.slice(0, 1).map((warn, i) => (
                     <div key={i} className="px-2 py-0.5 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-1">
                       <AlertCircle size={8} className="text-amber-600" />
                       <span className="text-[7px] font-black uppercase text-amber-700 tracking-tight">{warn}</span>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            <div className="flex gap-2">
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   handleAction(action);
                 }}
                 className="flex-1 h-9 bg-dismel-red text-white flex items-center justify-center gap-2 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
               >
                  Gestionar
               </button>
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   handlePrepareMessage(action);
                 }}
                 className="w-12 h-9 bg-green-50 text-green-600 flex items-center justify-center rounded-xl border border-green-100 active:scale-95 transition-all"
               >
                  <MessageSquare size={14} />
               </button>
            </div>
          </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedProactiveMessage && (
          <ProactiveMessageReviewModal 
            message={selectedProactiveMessage}
            onClose={() => setSelectedProactiveMessage(null)}
            onAction={(action) => {
               // Logic for marking as managed
               setSelectedProactiveMessage(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedScoreDetails && (
          <SignalsDetailModal 
            score={selectedScoreDetails}
            onClose={() => setSelectedScoreDetails(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
