import React, { useState, useEffect } from "react";
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  MoreHorizontal, 
  Navigation, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle, 
  ArrowRight,
  TrendingDown,
  Info,
  MessageSquare,
  Play,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { SmartRoute, SmartRouteVisit, VisitResult, ProactiveMessage, PriorityScore } from "../../types";
import { smartRouteService } from "../../services/smartRouteService";
import { proactiveMessageService } from "../../services/proactiveMessageService";
import { scoringService } from "../../services/scoringService";
import { feedbackLogger } from "../../utils/feedbackLogger";
import { formatCurrency } from "../../lib/utils";
import VisitCheckoutModal from "./VisitCheckoutModal";
import Customer360Modal from "../customers/Customer360Modal";
import ProactiveMessageReviewModal from "../proactive/ProactiveMessageReviewModal";
import SignalsDetailModal from "../scoring/SignalsDetailModal";

interface SmartRouteSectionProps {
  onOpenCustomer?: (customerId: string) => void;
}

export default function SmartRouteSection({ onOpenCustomer }: SmartRouteSectionProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<SmartRoute | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<SmartRouteVisit | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedProactiveMessage, setSelectedProactiveMessage] = useState<ProactiveMessage | null>(null);
  const [scores, setScores] = useState<PriorityScore[]>([]);
  const [selectedScoreDetails, setSelectedScoreDetails] = useState<PriorityScore | null>(null);

  useEffect(() => {
    loadRoute();
    loadScores();
  }, []);

  const loadScores = async () => {
    try {
      const response = await scoringService.getAdvisorPriorityScores();
      if (response.ok && response.scores) {
        setScores(response.scores);
      }
    } catch (error) {
      console.error("Error loading scores:", error);
    }
  };

  const getScoreForVisit = (visit: SmartRouteVisit) => {
    return scores.find(s => s.customer_id === visit.customer_id);
  };

  const sortedVisits = route?.visits ? [...route.visits].sort((a, b) => {
    const scoreA = getScoreForVisit(a)?.total_score || 0;
    const scoreB = getScoreForVisit(b)?.total_score || 0;
    return scoreB - scoreA;
  }) : [];

  const totalVisits = route?.visits.length || 0;
  const completedVisits = route?.visits.filter(v => v.status === 'completed').length || 0;
  const pendingVisits = route?.visits.filter(v => v.status === 'pending' || v.status === 'in_progress').length || 0;

  const loadRoute = async () => {
    try {
      setLoading(true);
      const response = await smartRouteService.getTodaySmartRoute();
      if (response.ok && response.route) {
        setRoute(response.route);
      } else if (response.ok && !response.route) {
        // Auto-generate if no route exists yet (Lazy 4 AM Generation)
        console.log("No route found for today, auto-generating...");
        await handleGenerateRoute();
      }
    } catch (error) {
      console.error("Error loading route:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoute = async () => {
    try {
      setGenerating(true);
      const response = await smartRouteService.generateSmartRoute();
      if (response.ok && response.route) {
        setRoute(response.route);
      }
    } catch (error) {
      console.error("Error generating route:", error);
      alert("No se pudo generar la ruta inteligente. Por favor intenta de nuevo.");
    } finally {
      setGenerating(false);
    }
  };

  const handleStartVisit = async (visit: SmartRouteVisit) => {
    // Try to get geolocation
    let geoPayload = {};
    try {
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        geoPayload = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      }
    } catch (e) {
      console.warn("Geolocation failed", e);
    }

    const response = await smartRouteService.startVisit(visit.id, geoPayload);
    if (response.ok) {
       // Log visit start
       feedbackLogger.logVisitStarted(visit.customer_id, visit.customer_name, visit.id);
       
       // Update local state
       if (route) {
         setRoute({
           ...route,
           visits: route.visits.map(v => v.id === visit.id ? { ...v, status: 'in_progress' as const } : v)
         });
       }
    }
  };

  const handleFinishVisit = (visit: SmartRouteVisit) => {
    setSelectedVisit(visit);
    setShowCheckout(true);
  };

  const handleConfirmCheckout = async (result: Partial<VisitResult>): Promise<void> => {
    if (!selectedVisit) return;

    try {
      const response = await smartRouteService.completeVisit(selectedVisit.id, result as any);
      if (response.ok) {
        // Optimistic update
        if (route) {
          setRoute({
            ...route,
            visits: route.visits.map(v => v.id === selectedVisit.id ? { 
              ...v, 
              status: 'completed' as const,
              visit_result: {
                id: Date.now().toString(),
                visit_id: selectedVisit.id,
                outcome: result.outcome as any,
                notes: result.notes || '',
                next_step: result.next_step || '',
                created_at: new Date().toISOString()
              }
            } : v)
          });
        }
        setShowCheckout(false);
        setSelectedVisit(null);
        loadRoute(); // Still refresh to be sure
      } else {
        throw new Error("No se pudo completar la visita en el servidor.");
      }
    } catch (error: any) {
      console.error("Error completing visit:", error);
      throw error; // Let the modal handle showing the error
    }
  };

  const handleReorder = async (visit: SmartRouteVisit, direction: 'up' | 'down') => {
    if (!route) return;
    const visits = [...route.visits];
    const index = visits.findIndex(v => v.id === visit.id);
    if (direction === 'up' && index > 0) {
      [visits[index], visits[index - 1]] = [visits[index - 1], visits[index]];
    } else if (direction === 'down' && index < visits.length - 1) {
      [visits[index], visits[index + 1]] = [visits[index + 1], visits[index]];
    }

    // Update sequences
    const updatedVisits = visits.map((v, i) => ({ ...v, sequence: i + 1 }));
    setRoute({ ...route, visits: updatedVisits });
    await smartRouteService.reorderRouteVisits(route.id, updatedVisits);
  };

  const handlePrepareMessage = (visit: SmartRouteVisit) => {
    const text = `Hola ${visit.customer_name}, buenos días! 👋 Estoy programando mi ruta de hoy y quería confirmarte que estaré visitándote para ${visit.reason.toLowerCase()}. ¿Te queda bien que pase en un momento?`;
    
    const proactiveMsg: ProactiveMessage = {
      id: `VISIT-${visit.id}`,
      customer_id: visit.customer_id,
      customer_name: visit.customer_name,
      advisor_id: route?.advisor_id || "A-01",
      phone: visit.phone,
      channel: "whatsapp",
      trigger_type: "visit_reminder",
      status: "pending_review",
      priority: visit.priority,
      title: "Recordatorio de Visita",
      reason: `Programado en ruta inteligente: ${visit.reason}`,
      message_body: text,
      source: "smart_route",
      related_entity_type: "visit",
      related_entity_id: visit.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setSelectedProactiveMessage(proactiveMsg);
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[40px] border border-border-soft shadow-sm mx-1">
        <div className="w-12 h-12 border-4 border-dismel-red/20 border-t-dismel-red rounded-full animate-spin mb-4" />
        <p className="text-[11px] font-black text-text-muted uppercase tracking-widest">Calculando ruta inteligente...</p>
        <p className="text-[9px] font-bold text-text-muted/60 mt-2">Optimizando paradas y prioridades</p>
        <button 
          onClick={() => {
            loadRoute();
            loadScores();
          }}
          className="mt-6 text-[9px] font-black text-dismel-red uppercase tracking-widest px-4 py-2 border border-dismel-red/20 rounded-full active:scale-95 transition-all"
        >
          Si tarda demasiado, haz clic aquí
        </button>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="p-8 bg-white rounded-[40px] border border-border-soft border-dashed text-center mx-1">
        <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-text-muted">
           <MapPin size={32} />
        </div>
        <h3 className="text-lg font-black uppercase tracking-tight mb-2">No hay ruta generada</h3>
        <p className="text-[11px] text-text-muted font-bold mb-8">Genera tu ruta inteligente para optimizar tus visitas de hoy.</p>
        <button 
           onClick={handleGenerateRoute}
           className="w-full py-4 bg-dismel-red text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-dismel-red/20 active:scale-95 transition-all"
        >
           Generar Ruta de Hoy
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Route Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
            Ruta Inteligente
            <span className="bg-dismel-red/10 text-dismel-red text-[8px] px-1.5 py-0.5 rounded-full animate-pulse">PRO</span>
          </h2>
          <p className="text-[10px] font-bold text-text-muted mt-0.5">Orden sugerido por IA • {route.date}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleGenerateRoute}
            disabled={generating}
            className="w-10 h-10 bg-white border border-border-soft rounded-xl flex items-center justify-center text-text-muted hover:border-dismel-red-soft hover:text-dismel-red transition-all active:scale-95 disabled:opacity-50"
          >
            <RotateCcw size={18} className={generating ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
         <div className="bg-white p-4 rounded-3xl border border-border-soft shadow-sm">
            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Visitas</p>
            <div className="flex items-end gap-1.5">
               <span className="text-xl font-black text-text-main leading-none">{completedVisits}</span>
               <span className="text-[11px] font-black text-text-muted leading-none">/ {totalVisits}</span>
            </div>
         </div>
         <div className="bg-white p-4 rounded-3xl border border-border-soft shadow-sm">
            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Pendientes</p>
            <div className="flex items-center gap-2">
               <span className="text-xl font-black text-dismel-red leading-none">{pendingVisits}</span>
            </div>
         </div>
         <div className="bg-white p-4 rounded-3xl border border-border-soft shadow-sm">
            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Venta Est.</p>
            <p className="text-xs font-black text-green-600 truncate">{formatCurrency(route.estimated_sales_value)}</p>
         </div>
         <div className="bg-white p-4 rounded-3xl border border-border-soft shadow-sm">
            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Recaudo Est.</p>
            <p className="text-xs font-black text-blue-600 truncate">{formatCurrency(route.estimated_collection_value)}</p>
         </div>
      </div>

      {/* Visits Slider */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x -mx-5 px-5 pt-2">
        {sortedVisits.length > 0 ? sortedVisits.map((visit, index) => {
          const visitScore = getScoreForVisit(visit);
          return (
            <motion.div 
              key={visit.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`min-w-[280px] max-w-[300px] bg-white rounded-[32px] border shadow-sm overflow-hidden relative snap-start flex flex-col ${
                visit.status === 'in_progress' ? 'border-dismel-red ring-2 ring-dismel-red/5' : 'border-border-soft'
              } ${visit.status === 'completed' ? 'opacity-80' : ''}`}
            >
              {/* Score Badge */}
              {visitScore && (
                 <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedScoreDetails(visitScore);
                  }}
                  className="absolute top-4 right-14 bg-black text-white text-[7px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 z-10 active:scale-90 transition-transform"
                 >
                    <Zap size={6} fill="currentColor" />
                    {visitScore.total_score}
                 </button>
              )}

              {/* Top Info Bar */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-border-soft/50 bg-white">
               <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                    visit.status === 'completed' ? 'bg-green-100 text-green-600 border border-green-200' : 
                    visit.status === 'in_progress' ? 'bg-dismel-red text-white' : 
                    'bg-gray-100 text-text-muted border border-border-soft'
                  }`}>
                    {visit.status === 'completed' ? <CheckCircle2 size={14} /> : visit.sequence}
                  </div>
                  <div className="min-w-0">
                     <div className="flex items-center gap-2">
                        <h3 className="text-[11px] font-black text-text-main uppercase tracking-tight truncate">
                          {visit.customer_name}
                        </h3>
                        {visit.next_best_action_id && (
                          <div className="bg-black text-white text-[6px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                             <Zap size={6} fill="currentColor" />
                             NBA
                          </div>
                        )}
                     </div>
                     <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                          visit.priority === 'high' ? 'bg-red-50 text-red-600' : 
                          visit.priority === 'medium' ? 'bg-orange-50 text-orange-600' : 
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {visit.priority}
                        </span>
                        <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest truncate">{visit.status}</span>
                     </div>
                  </div>
               </div>
               
               <div className="flex gap-1">
                 <button 
                  onClick={() => handleReorder(visit, 'up')} 
                  disabled={index === 0}
                  className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center text-text-muted disabled:opacity-30 active:scale-90"
                 >
                   <ArrowUp size={12} />
                 </button>
                 <button 
                  onClick={() => handleReorder(visit, 'down')} 
                  disabled={index === route.visits.length - 1}
                  className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center text-text-muted disabled:opacity-30 active:scale-90"
                 >
                   <ArrowDown size={12} />
                 </button>
               </div>
            </div>

            {/* Visit Details */}
            <div className="p-5 flex-1 flex flex-col">
              {/* Context / Why visit */}
              <div className="mb-4 bg-gray-50/50 p-3 rounded-2xl border border-dashed border-border-soft flex gap-3 min-h-[64px]">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                   visit.visit_type === 'collection' ? 'bg-blue-500' :
                   visit.visit_type === 'retention' ? 'bg-orange-500' :
                   visit.visit_type === 'sales' ? 'bg-green-500' :
                   visit.visit_type === 'delivery_issue' ? 'bg-red-600' :
                   'bg-teal-500'
                 }`}>
                    {visit.visit_type === 'collection' ? <DollarSign size={18} /> :
                     visit.visit_type === 'sales' ? <ShoppingCart size={18} /> :
                     visit.visit_type === 'retention' ? <TrendingDown size={18} /> :
                     <Info size={18} />}
                 </div>
                 <div className="min-w-0">
                    <p className="text-[10px] font-black text-text-main uppercase tracking-tight truncate">{visit.reason}</p>
                    <p className="text-[9px] font-bold text-text-muted leading-snug mt-0.5 line-clamp-2">{visit.recommended_action}</p>
                 </div>
              </div>

              {/* Signals */}
              <div className="flex flex-wrap gap-2 mb-4 min-h-[22px]">
                 {visit.has_repurchase_opportunity && (
                   <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-lg border border-green-100">
                      <ShoppingCart size={10} />
                      <span className="text-[7px] font-black uppercase">Recompra</span>
                   </div>
                 )}
                 {visit.has_credit_issue && (
                   <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-lg border border-red-100">
                      <AlertTriangle size={10} />
                      <span className="text-[7px] font-black uppercase">Cartera</span>
                   </div>
                 )}
                 {visit.has_sales_drop && (
                   <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-1 rounded-lg border border-orange-100">
                      <TrendingDown size={10} />
                      <span className="text-[7px] font-black uppercase">Caída Venta</span>
                   </div>
                 )}
              </div>

              {/* Primary Actions */}
              <div className="flex flex-col gap-2 mt-auto">
                 {visit.status === 'pending' && (
                   <button 
                     onClick={() => handleStartVisit(visit)}
                     className="w-full h-11 bg-dismel-red text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-dismel-red/20 active:scale-95 transition-all"
                   >
                     <Play size={14} /> Iniciar Visita
                   </button>
                 )}

                 {visit.status === 'in_progress' && (
                   <button 
                     onClick={() => handleFinishVisit(visit)}
                     className="w-full h-11 bg-black text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-black/20 active:scale-95 transition-all"
                   >
                     <CheckCircle2 size={14} /> Finalizar Visita
                   </button>
                 )}

                 {visit.status === 'completed' && (
                    <div className="flex flex-col gap-2">
                       <div className="w-full h-11 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest border border-green-100">
                          <CheckCircle2 size={14} /> Visitado
                       </div>
                       {visit.visit_result && (
                         <p className="text-[8px] font-bold text-green-600/60 uppercase text-center px-2 truncate">
                           {(visit.visit_result.outcome || '').replace('_', ' ')}
                         </p>
                       )}
                    </div>
                 )}
              </div>

              {/* Quick Options */}
              {visit.status !== 'completed' && (
                 <div className="grid grid-cols-2 gap-2 mt-2">
                    <button 
                      onClick={() => onOpenCustomer?.(visit.customer_id)}
                      className="h-9 bg-gray-50 text-text-muted rounded-xl flex items-center justify-center gap-2 font-black text-[8px] uppercase tracking-widest border border-border-soft active:scale-95 transition-all"
                    >
                      Ver 360
                    </button>
                    <button 
                      onClick={() => handlePrepareMessage(visit)}
                      className="h-9 bg-dismel-red-soft text-dismel-red rounded-xl flex items-center justify-center gap-2 font-black text-[8px] uppercase tracking-widest border border-dismel-red/10 active:scale-95 transition-all"
                    >
                      <MessageSquare size={10} /> Mensaje
                    </button>
                 </div>
              )}
              
              {visit.visit_type === 'sales' && visit.status === 'in_progress' && (
                <button 
                  onClick={() => navigate(`/dashboard/suggested-order?customer_id=${visit.customer_id}&source=route`)}
                  className="w-full h-9 mt-2 bg-green-50 text-green-600 rounded-xl flex items-center justify-center gap-2 font-black text-[8px] uppercase tracking-widest border border-green-100 active:scale-95 transition-all"
                >
                  <ShoppingCart size={10} /> Pedido Sugerido
                </button>
              )}
            </div>

            {/* Visit Footer / Location */}
            <div className="px-5 py-3 bg-gray-50/30 flex items-center justify-between border-t border-border-soft/30">
               <div className="flex items-center gap-2 text-text-muted min-w-0">
                  <MapPin size={10} className="shrink-0" />
                  <span className="text-[8px] font-bold uppercase truncate">{visit.address}</span>
               </div>
            </div>
          </motion.div>
          );
        }) : (
          <div className="w-full py-16 flex flex-col items-center justify-center text-center opacity-30 grayscale px-10">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MapPin size={32} className="text-gray-400" />
             </div>
             <p className="text-sm font-black text-gray-800 uppercase">Sin resultados</p>
             <p className="text-xs font-medium mt-1">No se encontraron visitas que coincidan con tu búsqueda o filtro.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCheckout && selectedVisit && (
          <VisitCheckoutModal 
            visit={selectedVisit} 
            onClose={() => {
              setShowCheckout(false);
              setSelectedVisit(null);
            }} 
            onConfirm={handleConfirmCheckout} 
          />
        )}

        {selectedProactiveMessage && (
          <ProactiveMessageReviewModal 
            message={selectedProactiveMessage}
            onClose={() => setSelectedProactiveMessage(null)}
            onAction={(action) => {
              // Mark as sent or whatever
              setSelectedProactiveMessage(null);
            }}
          />
        )}

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
