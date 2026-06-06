import React from "react";
import { TrendingUp, TrendingDown, Minus, ShoppingCart, MessageSquare, Phone, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { StrategyPerformanceSummary } from "../../types";

interface StrategyPerformanceCardProps {
  strategy: StrategyPerformanceSummary;
}

const StrategyPerformanceCard: React.FC<StrategyPerformanceCardProps> = ({ strategy }) => {
  const getStatusColor = () => {
    if (strategy.actions_executed < 2) return "bg-gray-100 text-gray-500 border-gray-200";
    if (strategy.order_conversion_rate > 0.4 || strategy.positive_response_rate > 0.6) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (strategy.loss_rate > 0.5) return "bg-red-50 text-red-700 border-red-100";
    return "bg-amber-50 text-amber-700 border-amber-100";
  };

  const getStatusLabel = () => {
    if (strategy.actions_executed < 2) return "Sin datos";
    if (strategy.order_conversion_rate > 0.4 || strategy.positive_response_rate > 0.6) return "Funciona bien";
    if (strategy.loss_rate > 0.5) return "Revisar";
    return "En observación";
  };

  const getIcon = () => {
    switch (strategy.strategy_type) {
      case "repurchase": return <ShoppingCart size={14} />;
      case "suggested_order": return <ShoppingCart size={14} />;
      case "visit": return <MapPin size={14} />;
      case "credit_collection": return <AlertCircle size={14} />;
      default: return <MessageSquare size={14} />;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 border border-border-soft shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gray-50 rounded-xl text-text-main border border-border-soft">
            {getIcon()}
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-tight text-text-main line-clamp-1">{strategy.label}</h4>
            <div className={`mt-1 px-1.5 py-0.5 rounded-lg border text-[7px] font-black uppercase tracking-wider inline-block ${getStatusColor()}`}>
              {getStatusLabel()}
            </div>
          </div>
        </div>
        <div className="text-right">
          {strategy.trend === "up" && <TrendingUp size={14} className="text-emerald-500" />}
          {strategy.trend === "down" && <TrendingDown size={14} className="text-red-500" />}
          {strategy.trend === "stable" && <Minus size={14} className="text-amber-500" />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="p-2 bg-gray-50/50 rounded-2xl border border-border-soft/50">
          <p className="text-[7px] font-black text-text-muted uppercase tracking-wider mb-0.5">Ejecutado</p>
          <p className="text-xs font-black text-text-main">{strategy.actions_executed}</p>
        </div>
        <div className="p-2 bg-gray-50/50 rounded-2xl border border-border-soft/50">
          <p className="text-[7px] font-black text-text-muted uppercase tracking-wider mb-0.5">Conversión</p>
          <p className="text-xs font-black text-text-main">{Math.round(strategy.order_conversion_rate * 100)}%</p>
        </div>
      </div>

      <div className="flex items-center justify-between py-2 border-t border-dashed border-border-soft">
        <div className="flex flex-col">
          <p className="text-[7px] font-black text-text-muted uppercase tracking-wider">Impacto</p>
          <p className="text-[10px] font-black text-brand-red">
            {strategy.sales_value > 0 
              ? `$${(strategy.sales_value / 1000000).toFixed(1)}M` 
              : strategy.collection_value > 0 
                ? `$${(strategy.collection_value / 1000000).toFixed(1)}M`
                : "---"}
          </p>
        </div>
        {strategy.top_objections.length > 0 && (
          <div className="flex flex-col items-end">
            <p className="text-[7px] font-black text-text-muted uppercase tracking-wider">Top Objeción</p>
            <p className="text-[9px] font-bold text-text-main line-clamp-1">{strategy.top_objections[0].label}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyPerformanceCard;
