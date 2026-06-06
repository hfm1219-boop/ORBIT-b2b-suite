import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Package, Truck, CheckCircle2, ChevronRight, Filter, Search, Users, X, MapPin, Trash2, Calendar } from "lucide-react";
import NewOrder from "./NewOrder";

const MOCK_ORDERS = [
  { 
    id: "S86342", 
    invoice: "FVTB43489",
    customer: "ANILLO PEREIRA HECTOR-REST.LA CASA DE SOCORRO", 
    status: "Despacho", 
    subStatus: "Ruta",
    total: 248475, 
    date: "2026-05-07 13:48",
    observation: "N/D",
    deliveryDate: "2026-05-08",
    items: [
      { name: "U.L.C. AV00274 GFA X 20 LTS", p: 1, f: 1 },
      { name: "BOLSA DE PAPELERA BLANCA 50 X 55 CMS X 20 UNDS RF_1017007/1017208", p: 5, f: 5 },
      { name: "BONAIRE SPRAY 400 ML VAINILLA AMBAR UNIDAD", p: 1, f: 1 },
      { name: "BONAIRE SPRAY 400 ML BAMBÚ UNIDAD", p: 1, f: 1 },
    ]
  },
  { 
    id: "S86455", 
    invoice: "FVTB43541",
    customer: "CENTRO DE RECREACION DE OFICIALES CLUB NAVAL", 
    status: "Despacho", 
    subStatus: "Ruta",
    total: 363566, 
    date: "2026-05-08 09:12",
    observation: "N/D",
    deliveryDate: "2026-05-09",
    items: [
      { name: "U.L.C. AV00274 GFA X 20 LTS", p: 2, f: 2 },
      { name: "SUMA GRILL AV00771 GAL X 5 LTS", p: 1, f: 1 }
    ]
  },
];

export default function Pedidos() {
  const navigate = useNavigate();
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  React.useEffect(() => {
    const pendingCustomer = localStorage.getItem('pendingOrderCustomer');
    const pendingItems = localStorage.getItem('pending_order_items');
    if (pendingCustomer || pendingItems) {
      setShowNewOrder(true);
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden font-sans">
      <AnimatePresence>
        {showNewOrder && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute inset-0 z-50 overflow-hidden"
          >
            <NewOrder onBack={() => setShowNewOrder(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-white w-full max-w-[340px] rounded-[32px] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-5 border-b border-border-soft flex justify-between items-center bg-dismel-gray">
                <div>
                  <h3 className="font-black text-text-main text-[11px] uppercase tracking-widest leading-none mb-1">Pedido ID</h3>
                  <p className="text-[10px] font-black text-dismel-red uppercase tracking-widest">{selectedOrder.id} • {selectedOrder.invoice}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-text-muted shadow-sm active:scale-90 transition-transform"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dismel-gray/50 p-3 rounded-2xl border border-border-soft">
                    <h4 className="text-[8px] font-black text-text-muted uppercase tracking-[0.1em] mb-1.5 opacity-60">Entrega</h4>
                    <p className="text-[10px] font-black text-text-main uppercase">{selectedOrder.deliveryDate}</p>
                  </div>
                  <div className="bg-dismel-gray/50 p-3 rounded-2xl border border-border-soft">
                    <h4 className="text-[8px] font-black text-text-muted uppercase tracking-[0.1em] mb-1.5 opacity-60">Estado</h4>
                    <p className="text-[10px] font-black text-dismel-red uppercase">{selectedOrder.status}</p>
                  </div>
                </div>

                <div>
                   <h4 className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 px-1">Artículos en Pedido</h4>
                   <div className="bg-dismel-gray p-4 rounded-2xl border border-border-soft space-y-4">
                      {selectedOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-start gap-4 border-b border-white/50 pb-3 last:border-0 last:pb-0">
                          <div className="flex-1">
                             <p className="text-[10px] font-black text-text-main leading-tight uppercase tracking-tight line-clamp-2">{item.name}</p>
                             <p className="text-[8px] font-bold text-text-muted mt-1 uppercase tracking-widest">Cant: {item.f} ud</p>
                          </div>
                          <div className="bg-white w-8 h-8 rounded-lg flex items-center justify-center border border-border-soft shadow-sm shrink-0">
                             <span className="text-[11px] font-black text-text-main">{item.f}</span>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-dismel-red/5 p-4 rounded-2xl border border-dismel-red/10">
                  <h4 className="text-[9px] font-black text-dismel-red uppercase tracking-widest mb-1.5">Observación Comercial</h4>
                  <p className="text-[10px] text-text-main font-bold italic leading-relaxed">"{selectedOrder.observation}"</p>
                </div>
              </div>

              <div className="p-6 pt-2 pb-8 border-t border-border-soft bg-white">
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-full h-13 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all shadow-xl shadow-black/20"
                >
                  Cerrar Resumen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Buttons */}
      <div className="bg-dismel-red px-5 h-[82px] flex items-center gap-3 flex-shrink-0">
        <button 
          onClick={() => setShowNewOrder(true)}
          className="flex-1 h-10 bg-dismel-red-dark text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Package size={14} />
          <span>Nuevo pedido</span>
        </button>
        <button className="flex-1 h-10 bg-black text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-transform flex items-center justify-center gap-2">
          <Trash2 size={14} />
          Devoluciones
        </button>
      </div>

      {/* Filters Area */}
      <div className="p-5 bg-white space-y-4 border-b border-border-soft flex-shrink-0">
        {/* Suggested Orders / IA Drafts Section */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-3">
             <div className="w-6 h-6 bg-dismel-red/10 rounded-lg flex items-center justify-center text-dismel-red">
                <CheckCircle2 size={12} />
             </div>
             <h4 className="text-[10px] font-black text-text-main uppercase tracking-widest">Borradores Inteligentes</h4>
             <span className="ml-auto bg-dismel-red text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse">NUEVO</span>
          </div>
          
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1">
             {[
               { id: '1', customer: 'LICORERA DON PEPE', reason: 'Recompra Sugerida', items: 3 },
               { id: '2', customer: 'HOTEL CARIBE', reason: 'Acción Preventiva', items: 5 }
             ].map((draft, i) => (
               <motion.div 
                 key={i}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => navigate(`/dashboard/suggested-order?customer_id=${draft.id}&source=draft`)}
                 className="flex-shrink-0 w-44 p-3 bg-dismel-gray/40 border border-border-soft rounded-2xl cursor-pointer hover:border-dismel-red/30 transition-all border-dashed"
               >
                  <p className="text-[10px] font-black text-text-main uppercase truncate mb-1">{draft.customer}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-tight">{draft.reason}</span>
                    <span className="text-[9px] font-black text-dismel-red">{draft.items} SKUs</span>
                  </div>
               </motion.div>
             ))}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/40" />
          <input
            type="text"
            placeholder="Buscar por pedido o producto..."
            className="w-full bg-dismel-gray/50 border border-transparent rounded-2xl py-3 pl-11 pr-4 text-[11px] font-bold uppercase tracking-widest outline-none focus:bg-white focus:border-dismel-red/30 focus:ring-4 focus:ring-dismel-red/5 transition-all"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em] ml-1">Desde</label>
            <div className="bg-white border border-border-soft rounded-xl px-3 py-2.5 text-[11px] font-bold text-text-main flex items-center justify-between">
              <span>2026-05-07</span>
              <Calendar size={12} className="opacity-30" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em] ml-1">Hasta</label>
            <div className="bg-white border border-border-soft rounded-xl px-3 py-2.5 text-[11px] font-bold text-text-main flex items-center justify-between">
              <span>2026-05-07</span>
              <Calendar size={12} className="opacity-30" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 bg-dismel-gray/30 border border-border-soft rounded-2xl">
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-text-muted/40 shadow-sm">
            <Users size={16} />
          </div>
          <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">Filtrar por cliente</span>
          <ChevronRight className="ml-auto w-4 h-4 opacity-20" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 bg-app-bg pb-24 no-scrollbar">
        {MOCK_ORDERS.map((order) => (
          <motion.div
            key={order.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedOrder(order)}
            className="mb-5 bg-white rounded-[28px] border border-border-soft shadow-sm relative overflow-hidden active:shadow-md transition-all"
          >
            <div className="p-5">
               <div className="flex justify-between items-start mb-3">
                 <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-black text-sm text-text-main leading-tight uppercase tracking-tight line-clamp-2">{order.customer}</h3>
                 </div>
                 <div className="w-10 h-10 bg-dismel-red-soft rounded-2xl flex items-center justify-center text-dismel-red shadow-sm border border-dismel-red/5">
                    <Truck size={18} />
                 </div>
               </div>
               
               <div className="flex justify-between items-center bg-dismel-gray/50 p-2.5 px-3 rounded-xl mb-4">
                 <div className="flex flex-col">
                   <span className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Referencia</span>
                   <span className="text-[10px] font-black text-text-main leading-none">{order.id} • {order.invoice}</span>
                 </div>
                 <div className="flex flex-col items-end">
                   <span className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Fecha</span>
                   <span className="text-[10px] font-black text-text-main leading-none">{order.date ? order.date.split(' ')[0] : 'N/A'}</span>
                 </div>
               </div>

               <div className="flex justify-between items-center">
                 <div className="flex flex-col">
                   <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-0.5">Total Pedido</span>
                   <span className="text-sm font-black text-text-main">${order.total.toLocaleString()}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="flex flex-col items-end text-[9px] font-black uppercase tracking-widest">
                     <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">{order.status}</span>
                   </div>
                 </div>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
