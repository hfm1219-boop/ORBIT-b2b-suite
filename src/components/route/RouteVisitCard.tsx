import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Phone, User, Clock, ShoppingCart, 
  ChevronRight, ExternalLink, AlertTriangle, 
  CreditCard, MapPinned, Navigation, CheckCircle2,
  PackageCheck, X, Sparkles
} from 'lucide-react';
import { RouteVisit } from '../../types';
import VisitStatusBadge from './VisitStatusBadge';
import RepurchaseSuggestionsSection from '../repurchase/RepurchaseSuggestionsSection';

interface RouteVisitCardProps {
  key?: React.Key;
  visit: RouteVisit;
  onStartVisit: (visit: RouteVisit) => void | Promise<void>;
  onFinishVisit: (visit: RouteVisit) => void | Promise<void>;
  onStartOrder: (visit: RouteVisit, selectedSuggestions?: any[]) => void | Promise<void>;
  onOpenCustomer: (customerId: string) => void | Promise<void>;
  onAddToOrder?: (item: any) => void;
}

export default function RouteVisitCard({ 
  visit, 
  onStartVisit, 
  onFinishVisit, 
  onStartOrder, 
  onOpenCustomer,
  onAddToOrder
}: RouteVisitCardProps) {
  
  const [selectedRepurchases, setSelectedRepurchases] = useState<Record<string, { qty: number, name: string, product: any }>>({});
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  
  const isPlanned = visit.status === 'planned';
  const isInProgress = visit.status === 'in_progress';
  const isCompleted = visit.status === 'completed';

  const handleToggleRepurchase = (suggestion: any, selected: boolean) => {
    setSelectedRepurchases(prev => {
      const next = { ...prev };
      if (selected) {
        next[suggestion.product_id] = { 
          qty: suggestion.suggested_qty || 1, 
          name: suggestion.product_name,
          product: suggestion
        };
      } else {
        delete next[suggestion.product_id];
      }
      return next;
    });
  };

  const handleUpdateQty = (productId: string, qty: number) => {
    setSelectedRepurchases(prev => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: { ...prev[productId], qty }
      };
    });
  };

  const selectedCount = Object.keys(selectedRepurchases).length;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const getCreditBadgeStyle = (status: string) => {
    switch (status) {
      case 'can_order': return 'bg-green-50 text-green-600 border-green-100';
      case 'review': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'blocked': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-400 border-gray-100';
    }
  };

  return (
    <div className={`bg-white rounded-[28px] border transition-all overflow-hidden relative shadow-sm ${
      isInProgress ? "border-dismel-red/30 ring-4 ring-dismel-red/5" : "border-border-soft"
    }`}>
      {/* Suggestions Modal */}
      <AnimatePresence>
        {showSuggestionsModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-app-bg w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
            >
              <div className="p-6 pb-6 flex items-center justify-between border-b border-border-soft bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-dismel-red-soft rounded-2xl flex items-center justify-center text-dismel-red">
                    <Sparkles size={24} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-text-main uppercase tracking-tight leading-none mb-1.5">Artículos Sugeridos</h3>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest truncate max-w-[200px]">{visit.customer_name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSuggestionsModal(false)}
                  className="w-10 h-10 bg-dismel-gray rounded-full flex items-center justify-center text-text-muted active:scale-90 transition-transform"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto no-scrollbar flex-1">
                <div className="mb-6 bg-dismel-red/5 p-4 rounded-2xl border border-dismel-red/10">
                  <p className="text-[10px] font-bold text-text-main uppercase tracking-tight leading-relaxed">
                    Basado en inteligencia de recompra para <span className="text-dismel-red font-black">{visit.customer_name}</span>. Marca los que desees incluir.
                  </p>
                </div>
                
                <RepurchaseSuggestionsSection 
                  customerId={visit.customer_id}
                  onAddToOrder={(item) => onAddToOrder?.(item)}
                  showCustomer={false}
                  limit={10}
                  isCompact={true}
                  layout="vertical"
                  selectedItems={Object.fromEntries(Object.entries(selectedRepurchases).map(([id, val]) => [id, (val as { qty: number }).qty]))}
                  onToggleItem={handleToggleRepurchase}
                  onUpdateQty={handleUpdateQty}
                />
              </div>

              <div className="p-6 pb-10 border-t border-border-soft bg-white">
                <button 
                  onClick={() => {
                    setShowSuggestionsModal(false);
                    onStartOrder(visit, Object.values(selectedRepurchases));
                  }}
                  className="w-full h-14 bg-dismel-red text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-dismel-red/30 active:scale-95 transition-transform"
                >
                  <ShoppingCart size={20} />
                  Iniciar Pedido {selectedCount > 0 && `(${selectedCount})`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Sequence Badge */}
      <div className="absolute top-0 left-0 w-8 h-8 bg-dismel-gray flex items-center justify-center text-[10px] font-black text-text-muted rounded-br-2xl">
        {visit.planned_sequence}
      </div>

      <div className="p-5">
        {/* Header - Customer Name & Status */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0 pt-1">
            <button 
              onClick={() => onOpenCustomer(visit.customer_id)}
              className="text-sm font-black text-text-main uppercase leading-tight tracking-tight hover:text-dismel-red transition-colors text-left group"
            >
              <span className="line-clamp-2">{visit.customer_name}</span>
            </button>
            <div className="flex items-center gap-2 mt-2">
               <VisitStatusBadge status={visit.status} />
               {visit.credit_status && (
                 <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${getCreditBadgeStyle(visit.credit_status.status)}`}>
                   {visit.credit_status.label}
                 </span>
               )}
            </div>
          </div>
          <div className="w-10 h-10 bg-dismel-gray rounded-2xl flex items-center justify-center text-text-muted/40">
            <User size={18} />
          </div>
        </div>

        {/* Address & Info */}
        <div className="space-y-4 mb-5">
          <div className="flex items-start gap-3">
             <MapPin size={14} className="mt-0.5 text-text-muted/30 shrink-0" />
             <div className="flex-1">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight line-clamp-1">{visit.address}</p>
             </div>
             {visit.latitude && visit.longitude && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${visit.latitude},${visit.longitude}`, '_blank');
                  }}
                  className="w-8 h-8 bg-dismel-gray rounded-xl flex items-center justify-center text-text-main active:scale-90 transition-transform shadow-sm"
                >
                  <Navigation size={14} strokeWidth={2.5} />
                </button>
             )}
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="p-3 bg-dismel-gray/50 rounded-2xl border border-border-soft/50">
                <p className="text-[7px] font-black text-text-muted uppercase tracking-widest leading-none mb-1.5 opacity-60">Sin Orden</p>
                <p className="text-[11px] font-black text-text-main leading-none">{visit.days_without_order || '0'} <span className="text-[8px] opacity-40 uppercase ml-0.5">Días</span></p>
             </div>
             <div className="p-3 bg-dismel-gray/50 rounded-2xl border border-border-soft/50">
                <p className="text-[7px] font-black text-text-muted uppercase tracking-widest leading-none mb-1.5 opacity-60">Mora</p>
                <p className={`text-[11px] font-black leading-none ${visit.credit_status?.overdue_total ? 'text-dismel-red' : 'text-text-main'}`}>
                  {formatCurrency(visit.credit_status?.overdue_total || 0)}
                </p>
             </div>
          </div>
        </div>

        {/* Commercial Alerts */}
        {visit.commercial_alerts && visit.commercial_alerts.length > 0 && (
          <div className="mb-4">
             <div className="flex flex-wrap gap-1.5">
                {visit.commercial_alerts.map((alert, idx) => (
                  <div key={idx} className={`px-2.5 py-1 rounded-lg border flex items-center gap-2 ${
                    alert.severity === 'high' ? 'bg-red-50 border-red-100 text-red-700' : 
                    alert.severity === 'medium' ? 'bg-orange-50 border-orange-100 text-orange-700' : 
                    'bg-dismel-gray border-border-soft text-text-muted'
                  }`}>
                    <AlertTriangle size={10} strokeWidth={2.5} />
                    <span className="text-[8px] font-black uppercase tracking-tight truncate max-w-[140px]">{alert.title}</span>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Repurchase Summary - Minimal indicator instead of full section */}
        {isInProgress && (
          <div className="mb-4 flex items-center justify-between p-3 bg-dismel-red-soft rounded-2xl border border-dismel-red/10">
            <div className="flex items-center gap-3">
              <Sparkles size={16} className="text-dismel-red animate-pulse" strokeWidth={2.5} />
              <span className="text-[10px] font-black text-text-main uppercase tracking-widest">Recompra Recomendada</span>
            </div>
            <div className="w-6 h-6 bg-dismel-red rounded-lg flex items-center justify-center text-white text-[10px] font-black underline decoration-2 underline-offset-2">IA</div>
          </div>
        )}

        {/* Visit Details if completed */}
        {isCompleted && (
           <div className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-100">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={16} className="text-green-600" strokeWidth={2.5} />
                <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Visita Finalizada</span>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-green-100/50">
                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest opacity-60">Gestión:</span>
                    <span className="text-[10px] font-black text-text-main uppercase">{visit.result_type?.replace('_', ' ')}</span>
                 </div>
                 {visit.result_note && (
                   <p className="text-[11px] text-text-main font-bold italic leading-relaxed px-1">
                     "{visit.result_note}"
                   </p>
                 )}
              </div>
           </div>
        )}

        {/* Distance Indicator if available */}
        {visit.distance_meters !== undefined && visit.distance_meters !== null && (
          <div className="mb-4 flex items-center gap-2.5 px-1 pb-1">
             <div className={`w-2 h-2 rounded-full ${visit.location_validated ? "bg-green-500 animate-pulse" : "bg-orange-500"}`} />
             <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${visit.location_validated ? "text-green-600" : "text-text-muted opacity-60"}`}>
               GPS: {visit.distance_meters < 1000 ? `${visit.distance_meters} m` : `${(visit.distance_meters / 1000).toFixed(1)} km`}
               {visit.location_validated ? " • Validado" : " • Fuera de rango"}
             </span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-5 pb-5 pt-1">
        {isPlanned && (
          <button 
            onClick={() => onStartVisit(visit)}
            className="w-full h-14 bg-dismel-red text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-dismel-red/30 active:scale-95 transition-all"
          >
            <Navigation size={20} strokeWidth={2.5} />
            <span className="text-sm">Iniciar Visita</span>
          </button>
        )}

        {isInProgress && (
          <div className="flex flex-col gap-3">
             <button 
              onClick={() => setShowSuggestionsModal(true)}
              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 bg-white text-dismel-red border border-dismel-red shadow-lg shadow-dismel-red/10 active:scale-95 transition-all"
            >
              <ShoppingCart size={20} strokeWidth={2.5} />
              <span className="text-sm">Iniciar Pedido</span>
            </button>
             <button 
              onClick={() => onFinishVisit(visit)}
              className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-black/20 active:scale-95 transition-all"
            >
              <CheckCircle2 size={20} strokeWidth={2.5} />
              <span className="text-sm">Finalizar</span>
            </button>
          </div>
        )}

        {isCompleted && (
          <button 
            onClick={() => onOpenCustomer(visit.customer_id)}
            className="w-full h-13 bg-white text-text-muted rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all border border-border-soft"
          >
            <ExternalLink size={18} />
            <span className="text-[11px]">Ver Ficha Cliente</span>
          </button>
        )}
      </div>

    </div>
  );
}
