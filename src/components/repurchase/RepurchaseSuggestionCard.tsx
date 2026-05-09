import React from "react";
import { Clock, ShoppingBag, User, Plus, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { RepurchaseSuggestion } from "../../types";

interface RepurchaseSuggestionCardProps {
  key?: React.Key;
  suggestion: RepurchaseSuggestion;
  onAddToOrder: (suggestion: RepurchaseSuggestion) => void;
  onOpenCustomer?: (customerId: string) => void;
  showCustomer?: boolean;
  isCompact?: boolean;
  isSelected?: boolean;
  quantity?: number;
  onToggleSelection?: (selected: boolean) => void;
  onUpdateQuantity?: (newQty: number) => void;
}

export default function RepurchaseSuggestionCard({ 
  suggestion, 
  onAddToOrder, 
  onOpenCustomer,
  showCustomer = false,
  isCompact = false,
  isSelected = false,
  quantity = suggestion.suggested_qty || 1,
  onToggleSelection,
  onUpdateQuantity
}: RepurchaseSuggestionCardProps) {
  
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-yellow-400';
      default: return 'bg-gray-400';
    }
  };

  const getUrgencyBg = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-50 border-red-100';
      case 'medium': return 'bg-orange-50 border-orange-100';
      case 'low': return 'bg-yellow-50 border-yellow-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  if (isCompact) {
    return (
      <div className={`p-3 rounded-2xl border flex items-center gap-3 transition-all active:scale-[0.98] min-h-[70px] ${isSelected ? 'border-dismel-red bg-dismel-red-soft' : 'bg-white border-border-soft'}`}>
        {/* Checkbox indicator */}
        <button 
          onClick={() => onToggleSelection?.(!isSelected)}
          className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors shrink-0 ${isSelected ? 'bg-dismel-red border-dismel-red text-white' : 'border-dismel-gray bg-dismel-gray shadow-inner'}`}
        >
          {isSelected && <CheckCircle2 size={14} strokeWidth={3} />}
        </button>
        
        <div className="flex-1 min-w-0">
          <h5 className="text-[11px] font-black text-text-main leading-snug mb-1 uppercase tracking-tight">
            {suggestion.product_name}
          </h5>
          <div className="flex items-center gap-2">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest truncate">REF: {suggestion.sku}</p>
            <span className="w-1 h-1 rounded-full bg-text-muted/20" />
            <p className="text-[10px] font-black text-dismel-red">{formatCurrency(suggestion.current_price || 0)}</p>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center bg-dismel-gray rounded-xl border border-border-soft p-1">
          <button 
            disabled={!isSelected}
            onClick={() => onUpdateQuantity?.(Math.max(1, quantity - 1))}
            className="w-6 h-6 flex items-center justify-center text-text-muted active:bg-white rounded-lg transition-colors disabled:opacity-20"
          >
            <span className="text-sm font-black">-</span>
          </button>
          <span className="w-6 text-center text-[11px] font-black text-text-main">{quantity}</span>
          <button 
            disabled={!isSelected}
            onClick={() => onUpdateQuantity?.(quantity + 1)}
            className="w-6 h-6 flex items-center justify-center text-text-muted active:bg-white rounded-lg transition-colors disabled:opacity-20"
          >
            <span className="text-sm font-black">+</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-5 rounded-[28px] border shadow-sm relative overflow-hidden flex flex-col h-full bg-white transition-all active:shadow-md ${getUrgencyBg(suggestion.urgency)}`}>
      {/* Urgency Badge */}
      <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[9px] font-black uppercase text-white shadow-sm flex items-center gap-1.5 ${getUrgencyColor(suggestion.urgency)}`}>
        {suggestion.urgency === 'high' ? <AlertTriangle size={10} /> : suggestion.urgency === 'medium' ? <Clock size={10} /> : <CheckCircle2 size={10} />}
        {suggestion.urgency_label}
      </div>

      {/* Customer Header (if enabled) */}
      {showCustomer && (
        <button 
          onClick={() => onOpenCustomer?.(suggestion.customer_id)}
          className="flex items-center gap-2 mb-4 text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-text-muted border border-border-soft shadow-sm">
            <User size={14} />
          </div>
          <span className="text-[10px] font-black text-text-main uppercase tracking-tight truncate flex-1">
            {suggestion.customer_name}
          </span>
        </button>
      )}

      {/* Product Info */}
      <div className="flex-1">
        <h5 className="text-[13px] font-black text-text-main leading-tight mb-1 cursor-pointer uppercase tracking-tight">
          {suggestion.product_name}
        </h5>
        {suggestion.sku && (
          <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4 opacity-60">REF: {suggestion.sku}</p>
        )}

        <div className="space-y-4">
           <div className="flex items-start gap-3 bg-white/40 p-3 rounded-2xl border border-white/60">
              <Info size={14} className="mt-0.5 text-dismel-red shrink-0" />
              <p className="text-[10px] text-text-main font-bold leading-relaxed uppercase tracking-tight">
                {suggestion.reason}
              </p>
           </div>
           
           <div className="flex justify-between items-center bg-dismel-gray p-2.5 rounded-2xl border border-border-soft">
              <div className="text-center grow border-r border-border-soft">
                 <p className="text-[7px] font-black text-text-muted uppercase leading-none mb-1.5 opacity-60">Última</p>
                 <p className="text-[10px] font-black text-text-main leading-none uppercase">{suggestion.last_purchase_date.split(' ')[0]}</p>
              </div>
              <div className="text-center grow border-r border-border-soft">
                 <p className="text-[7px] font-black text-text-muted uppercase leading-none mb-1.5 opacity-60">Frecu.</p>
                 <p className="text-[10px] font-black text-text-main leading-none uppercase">{suggestion.avg_frequency_days}d</p>
              </div>
              <div className="text-center grow">
                 <p className="text-[7px] font-black text-text-muted uppercase leading-none mb-1.5 opacity-60">Pasaron</p>
                 <p className={`text-[10px] font-black leading-none uppercase ${suggestion.urgency === 'high' ? 'text-dismel-red' : 'text-text-main'}`}>{suggestion.days_since_last_purchase}d</p>
              </div>
           </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="mt-6 pt-4 border-t border-border-soft/50 flex items-center justify-between">
        <div className="flex flex-col">
           <span className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none mb-1.5 opacity-60">Precio Sugerido</span>
           <p className="text-sm font-black text-dismel-red leading-none">{formatCurrency(suggestion.current_price || 0)}</p>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onAddToOrder(suggestion);
          }}
          className={`h-11 px-5 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest gap-2 ${getUrgencyColor(suggestion.urgency)}`}
        >
          <Plus size={16} />
          <span>Añadir</span>
        </button>
      </div>
    </div>
  );
}
