import React from "react";
import { Target, TrendingUp, AlertCircle, ChevronRight, Zap } from "lucide-react";
import { AdvisorGoalAlignment } from "../../types";

interface AdvisorGoalAlignmentPanelProps {
  alignment: AdvisorGoalAlignment;
}

const AdvisorGoalAlignmentPanel: React.FC<AdvisorGoalAlignmentPanelProps> = ({ alignment }) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-[40px] p-6 text-white shadow-xl mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
          <Target className="text-brand-red" size={20} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white/50">Cierre de Brecha</h3>
          <p className="text-xs font-black text-white/80">Meta de Ventas Mensual</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Actual</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tighter">{formatCurrency(alignment.sales_actual)}</span>
            <span className="text-[10px] font-black text-emerald-400">+{Math.round(alignment.sales_progress_percentage * 100)}%</span>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Brecha</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tighter text-brand-red">{formatCurrency(alignment.sales_gap)}</span>
          </div>
        </div>
      </div>

      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-8">
        <div 
          className="absolute top-0 left-0 h-full bg-brand-red rounded-full shadow-[0_0_15px_rgba(238,29,35,0.6)]"
          style={{ width: `${Math.min(100, alignment.sales_progress_percentage * 100)}%` }}
        />
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3">
            <TrendingUp size={16} className="text-brand-red" />
            <span className="text-[10px] font-black uppercase tracking-tight">Venta Proactiva</span>
          </div>
          <span className="text-xs font-black">{formatCurrency(alignment.proactive_sales_value)}</span>
        </div>
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-tight">Efectividad Mensajes</span>
          </div>
          <span className="text-xs font-black">{Math.round(alignment.message_conversion_rate * 100)}%</span>
        </div>
      </div>

      <div className="p-5 bg-white/5 rounded-[32px] border border-white/5 flex items-start gap-4">
        <div className="p-2 bg-brand-red/20 rounded-xl">
           <AlertCircle className="text-brand-red" size={16} />
        </div>
        <div>
           <p className="text-[10px] font-black text-brand-red uppercase tracking-wider mb-1">Foco Recomendado</p>
           <p className="text-[11px] font-bold text-white/90 leading-snug">
             {alignment.recommended_focus}
           </p>
        </div>
      </div>
    </div>
  );
};

export default AdvisorGoalAlignmentPanel;
