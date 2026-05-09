import React, { useEffect, useState } from "react";
import { Clock, AlertCircle, RefreshCw, ChevronRight } from "lucide-react";
import { repurchaseService } from "../../services/repurchaseService";
import { RepurchaseSuggestion } from "../../types";
import RepurchaseSuggestionCard from "./RepurchaseSuggestionCard";

interface RepurchaseSuggestionsSectionProps {
  customerId?: string;
  limit?: number;
  onAddToOrder: (suggestion: RepurchaseSuggestion) => void;
  onOpenCustomer?: (customerId: string) => void;
  showCustomer?: boolean;
  isCompact?: boolean;
  layout?: 'horizontal' | 'vertical';
  selectedItems?: Record<string, number>;
  onToggleItem?: (suggestion: RepurchaseSuggestion, selected: boolean) => void;
  onUpdateQty?: (productId: string, qty: number) => void;
}

export default function RepurchaseSuggestionsSection({
  customerId,
  limit = 5,
  onAddToOrder,
  onOpenCustomer,
  showCustomer = false,
  isCompact = false,
  layout = 'horizontal',
  selectedItems = {},
  onToggleItem,
  onUpdateQty
}: RepurchaseSuggestionsSectionProps) {
  const [suggestions, setSuggestions] = useState<RepurchaseSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, [customerId, limit]);

  async function loadSuggestions() {
    try {
      setLoading(true);
      setError(null);
      const response = await repurchaseService.getRepurchaseSuggestions({ 
        customer_id: customerId, 
        limit 
      });
      if (response.ok) {
        setSuggestions(response.items);
      } else {
        throw new Error(response.error || "Error al cargar sugerencias");
      }
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar las recompras sugeridas.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={`text-center space-y-3 ${isCompact ? 'py-4' : 'py-8'}`}>
        <div className="w-8 h-8 border-3 border-dismel-red border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Consultando oportunidades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 rounded-3xl border border-red-100 text-center space-y-3 ${isCompact ? 'p-4' : 'py-8 px-6'}`}>
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
        <p className="text-[10px] font-black text-red-700 uppercase tracking-widest leading-tight">{error}</p>
        <button 
          onClick={loadSuggestions}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-[9px] font-black uppercase text-gray-600 mx-auto border border-red-200"
        >
          <RefreshCw size={12} />
          Reintentar
        </button>
      </div>
    );
  }

  if (suggestions.length === 0) {
    if (isCompact) return null; // Don't show anything if no suggestions in compact mode
    return (
      <div className="py-8 text-center space-y-2 grayscale">
        <Clock className="w-10 h-10 text-gray-200 mx-auto" />
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sin recompras sugeridas</p>
      </div>
    );
  }

  if (isCompact) {
    if (layout === 'vertical') {
      return (
        <div className="space-y-3 pb-4">
          {suggestions.map((suggestion) => (
            <RepurchaseSuggestionCard 
              key={suggestion.id} 
              suggestion={suggestion} 
              onAddToOrder={onAddToOrder}
              onOpenCustomer={onOpenCustomer}
              showCustomer={false}
              isCompact={true}
              isSelected={!!selectedItems[suggestion.product_id]}
              quantity={selectedItems[suggestion.product_id] || suggestion.suggested_qty || 1}
              onToggleSelection={(selected) => onToggleItem?.(suggestion, selected)}
              onUpdateQuantity={(qty) => onUpdateQty?.(suggestion.product_id, qty)}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4 pt-2 pb-6">
        <div className="flex items-center gap-2 px-1 mb-1">
          <div className="w-6 h-6 bg-dismel-red/10 rounded-lg flex items-center justify-center text-dismel-red">
            <Clock size={12} strokeWidth={2.5} />
          </div>
          <h4 className="text-[10px] font-black text-text-main uppercase tracking-widest">
            Oportunidades de Recompra
          </h4>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1 -mx-1 snap-x">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="w-[210px] shrink-0 snap-start">
              <RepurchaseSuggestionCard 
                suggestion={suggestion} 
                onAddToOrder={onAddToOrder}
                onOpenCustomer={onOpenCustomer}
                showCustomer={false}
                isCompact={true}
                isSelected={!!selectedItems[suggestion.product_id]}
                quantity={selectedItems[suggestion.product_id] || suggestion.suggested_qty || 1}
                onToggleSelection={(selected) => onToggleItem?.(suggestion, selected)}
                onUpdateQuantity={(qty) => onUpdateQty?.(suggestion.product_id, qty)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-dismel-red-soft rounded-xl flex items-center justify-center text-dismel-red">
            <TrendingUp size={16} strokeWidth={2.5} />
          </div>
          <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest">
            {customerId ? "Recompras Sugeridas" : "Oportunidades de Recompra"}
          </h4>
        </div>
        {!customerId && (
          <button className="text-[9px] font-black text-dismel-red uppercase tracking-[0.2em] flex items-center gap-1 group">
            Ver todas <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 pt-1 snap-x -mx-1 px-1">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="min-w-[280px] max-w-[300px] snap-center">
            <RepurchaseSuggestionCard 
              suggestion={suggestion} 
              onAddToOrder={onAddToOrder}
              onOpenCustomer={onOpenCustomer}
              showCustomer={showCustomer}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
