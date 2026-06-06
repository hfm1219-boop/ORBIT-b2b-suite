import React from "react";
import { Check, X, User, DollarSign, ShoppingCart, Calendar, Clock } from "lucide-react";

interface Option {
  label: string;
  value: string;
  icon?: React.ReactNode;
  color?: string;
}

interface AgentConfirmationChipsProps {
  options?: Option[];
  onSelect: (value: string) => void;
  onCancel: () => void;
}

export default function AgentConfirmationChips({ 
  options, 
  onSelect, 
  onCancel 
}: AgentConfirmationChipsProps) {
  const defaultOptions: Option[] = [
    { label: "Sí", value: "yes", icon: <Check size={14} />, color: "bg-green-500" },
    { label: "No", value: "no", icon: <X size={14} />, color: "bg-red-500" },
    { label: "Cambiar Cliente", value: "change_customer", icon: <User size={14} />, color: "bg-amber-500" },
    { label: "Pago", value: "payment", icon: <DollarSign size={14} />, color: "bg-blue-500" },
    { label: "Pedido", value: "order", icon: <ShoppingCart size={14} />, color: "bg-purple-500" },
    { label: "Seguimiento", value: "follow_up", icon: <Calendar size={14} />, color: "bg-indigo-500" },
    { label: "Después", value: "later", icon: <Clock size={14} />, color: "bg-slate-500" },
  ];

  const displayOptions = options || defaultOptions;

  return (
    <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {displayOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`h-8 px-3 rounded-full flex items-center gap-1.5 shadow-sm active:scale-95 transition-all text-white font-bold text-[10px] uppercase tracking-wider ${opt.color || "bg-slate-800"}`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
      {!options && (
        <button
          onClick={onCancel}
          className="h-8 px-3 rounded-full flex items-center gap-1.5 shadow-sm active:scale-95 transition-all bg-white border border-border-main text-text-muted font-bold text-[10px] uppercase tracking-wider"
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
