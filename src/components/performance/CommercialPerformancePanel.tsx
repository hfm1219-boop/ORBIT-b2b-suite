import React, { useState, useEffect } from "react";
import { 
  TrendingUp, BarChart3, ChevronDown, ChevronUp, 
  ShoppingCart, DollarSign, MessageSquare, AlertCircle,
  Filter, Calendar, RefreshCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CommercialPerformanceSummary } from "../../types";
import { commercialPerformanceService } from "../../services/commercialPerformanceService";
import StrategyPerformanceCard from "./StrategyPerformanceCard";
import AdvisorGoalAlignmentPanel from "./AdvisorGoalAlignmentPanel";

const CommercialPerformancePanel: React.FC = () => {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [performance, setPerformance] = useState<CommercialPerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  const loadPerformance = async () => {
    setLoading(true);
    const resp = await commercialPerformanceService.getCommercialPerformance(period);
    if (resp.ok && resp.performance) {
      setPerformance(resp.performance);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPerformance();

    const handleUpdate = () => loadPerformance();
    window.addEventListener("feedback:updated", handleUpdate);
    window.addEventListener("scoring:updated", handleUpdate);
    
    return () => {
      window.removeEventListener("feedback:updated", handleUpdate);
      window.removeEventListener("scoring:updated", handleUpdate);
    };
  }, [period]);

  if (loading && !performance) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-red/20 border-t-brand-red rounded-full animate-spin" />
        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Calculando rendimiento...</p>
      </div>
    );
  }

  if (!performance) return null;

  const totalSalesFormatted = new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(performance.total_sales_value);

  const totalCollectionFormatted = new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(performance.total_collection_value);

  return (
    <div className="mb-8">
      <div 
        className="flex items-center justify-between mb-4 px-1"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-red/10 rounded-xl text-brand-red">
            <BarChart3 size={18} />
          </div>
          <h2 className="text-xl font-black tracking-tight text-text-main">Rendimiento Comercial</h2>
        </div>
        <div className="flex items-center gap-4">
           {isExpanded ? <ChevronUp size={20} className="text-text-muted" /> : <ChevronDown size={20} className="text-text-muted" />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Period Selector */}
            <div className="flex gap-2 mb-6">
              {(["today", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 py-3 px-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                    period === p 
                      ? "bg-brand-red text-white border-brand-red shadow-lg shadow-brand-red/20" 
                      : "bg-white text-text-muted border-border-soft hover:bg-gray-50"
                  }`}
                >
                  {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>

            {performance.advisor_goal_alignment && (
              <AdvisorGoalAlignmentPanel alignment={performance.advisor_goal_alignment} />
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white rounded-3xl p-5 border border-border-soft shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart size={14} className="text-brand-red" />
                    <span className="text-[10px] font-black uppercase text-text-muted tracking-tight">Venta Proactiva</span>
                 </div>
                 <div className="text-xl font-black text-text-main">{totalSalesFormatted}</div>
                 <div className="mt-1 flex items-center gap-1">
                    <span className="text-[10px] font-bold text-emerald-500">{performance.total_orders_created} pedidos</span>
                 </div>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-border-soft shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={14} className="text-brand-red" />
                    <span className="text-[10px] font-black uppercase text-text-muted tracking-tight">Recaudo</span>
                 </div>
                 <div className="text-xl font-black text-text-main">{totalCollectionFormatted}</div>
                 <div className="mt-1 flex items-center gap-1">
                    <span className="text-[10px] font-bold text-emerald-500">{performance.total_payments_collected} recibos</span>
                 </div>
              </div>
            </div>

            {/* Strategy List */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-text-muted">Desempeño por Estrategia</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {performance.strategy_summaries
                  .filter(s => s.actions_executed > 0 || s.actions_suggested > 0)
                  .map(strategy => (
                    <StrategyPerformanceCard key={strategy.strategy_type} strategy={strategy} />
                  ))
                }
                {performance.total_actions_executed === 0 && (
                  <div className="col-span-full py-8 text-center bg-gray-50 rounded-[32px] border border-dashed border-border-soft">
                    <AlertCircle size={24} className="text-text-muted mx-auto mb-2 opacity-50" />
                    <p className="text-[10px] font-bold text-text-muted px-8">No hay acciones registradas para este periodo.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Objections */}
            {performance.top_objections.length > 0 && (
              <div className="mb-8 p-6 bg-white rounded-[40px] border border-border-soft shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                    <AlertCircle size={18} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-text-main">Principales Objeciones</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {performance.top_objections.map((obj) => (
                    <div 
                      key={obj.reason_code}
                      className="px-4 py-2 bg-gray-50 rounded-2xl border border-border-soft flex items-center gap-3 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-[11px] font-black text-text-main">{obj.label}</span>
                      <div className="px-2 py-0.5 bg-white rounded-lg border border-border-soft text-[10px] font-black text-text-muted">
                        {obj.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights & Recommendation */}
            <div className="p-6 bg-brand-red/5 rounded-[40px] border border-brand-red/10 flex items-start gap-4">
               <div className="p-2 bg-brand-red/20 rounded-xl">
                  <RefreshCcw className="text-brand-red" size={20} />
               </div>
               <div>
                  <h4 className="text-[10px] font-black uppercase text-brand-red tracking-widest mb-1">Foco de Hoy</h4>
                  <p className="text-xs font-bold text-text-main leading-relaxed">
                    {performance.advisor_goal_alignment?.recommended_focus || "No hay suficientes datos para dar una recomendación específica."}
                  </p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommercialPerformancePanel;
