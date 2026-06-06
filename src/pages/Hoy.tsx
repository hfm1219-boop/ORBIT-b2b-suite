import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, TrendingUp, DollarSign, 
  Target, Users, Clock, Bell,
  Settings, UserCircle, ShoppingCart, RefreshCw,
  AlertTriangle, ChevronRight
} from "lucide-react";
import NextBestActionsSection from "../components/proactive/NextBestActionsSection";
import SmartRouteSection from "../components/route/SmartRouteSection";
import ProactiveMessagesInbox from "../components/proactive/ProactiveMessagesInbox";
import RepurchaseSuggestionsSection from "../components/repurchase/RepurchaseSuggestionsSection";
import Customer360Modal from "../components/customers/Customer360Modal";
import PendingFeedbackNudges from "../components/feedback/PendingFeedbackNudges";
import CommercialPerformancePanel from "../components/performance/CommercialPerformancePanel";
import { smartRouteService } from "../services/smartRouteService";
import { formatCurrency } from "../lib/utils";

export default function Hoy() {
  const navigate = useNavigate();
  const [userName] = useState("Asesor Comercial");
  const [summary, setSummary] = useState({
    quota_reached: 68,
    daily_sales: 12450000,
    monthly_quota: 156000000,
    visits_completed: 4,
    pending_alerts: 12
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [initialModalTab, setInitialModalTab] = useState<'overview' | 'credit' | 'orders' | 'repurchase'>('overview');

  const handleOpenCustomer = (id: string, tab: 'overview' | 'credit' | 'orders' | 'repurchase' = 'overview') => {
    setInitialModalTab(tab);
    setSelectedCustomerId(id);
  };
  
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await smartRouteService.getTodaySmartRoute();
      if (response.ok && response.route) {
        setSummary(prev => ({
          ...prev,
          daily_sales: (response.route?.completed_visits || 0) * 1250000, // Simulated scale
          visits_completed: response.route?.completed_visits || 0,
        }));
      }
    } catch (error) {
      console.error("Dashboard data load error", error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <div className="flex flex-col h-full bg-app-bg font-sans">
      {/* 82px Header */}
      <div className="bg-dismel-red px-6 h-[82px] text-white relative flex-shrink-0 flex items-center justify-between shadow-lg z-20">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-70 leading-none">{getGreeting()}</p>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/90 leading-none">Meta: {formatCurrency(summary.monthly_quota)}</p>
          </div>
          <h1 className="text-sm font-black uppercase tracking-tight mt-1.5">{userName}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-[7px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Cuota Mes</p>
            <p className="text-[10px] font-black leading-none">{formatCurrency(summary.monthly_quota)}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => alert("No tienes notificaciones pendientes.")}
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center relative active:scale-95 transition-transform"
            >
              <Bell size={18} />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-white rounded-full ring-2 ring-dismel-red" />
            </button>
            <button 
              onClick={() => {
                if (window.confirm("¿Deseas cerrar sesión?")) {
                  localStorage.clear();
                  window.location.href = "/#/login";
                }
              }}
              className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            >
              <UserCircle size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {/* Summary Overlay Cards */}
        <div className="px-5 pt-4 pb-2">
           <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="bg-white rounded-[24px] p-3 border border-border-soft shadow-sm flex flex-col items-center text-center">
                 <div className="w-8 h-8 bg-dismel-red/10 rounded-xl flex items-center justify-center text-dismel-red mb-2">
                    <DollarSign size={14} />
                 </div>
                 <p className="text-[7px] font-black uppercase tracking-widest text-text-muted mb-1 leading-none">Venta Hoy</p>
                 <p className="text-[11px] font-black text-text-main leading-tight truncate w-full">{formatCurrency(summary.daily_sales)}</p>
              </div>

              <div className="bg-white rounded-[24px] p-3 border border-border-soft shadow-sm flex flex-col items-center text-center">
                 <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-2">
                    <TrendingUp size={14} />
                 </div>
                 <p className="text-[7px] font-black uppercase tracking-widest text-text-muted mb-1 leading-none">Faltante</p>
                 <p className="text-[11px] font-black text-text-main leading-tight truncate w-full">{formatCurrency(summary.monthly_quota - (summary.monthly_quota * summary.quota_reached / 100))}</p>
              </div>
              
              <div className="bg-white rounded-[24px] p-3 border border-border-soft shadow-sm flex flex-col items-center text-center">
                 <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-2">
                    <Target size={14} />
                 </div>
                 <p className="text-[7px] font-black uppercase tracking-widest text-text-muted mb-1 leading-none">Logro Meta</p>
                 <div className="flex flex-col items-center gap-1 w-full">
                    <p className="text-xs font-black text-text-main leading-none">{summary.quota_reached}%</p>
                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-green-500 transition-all duration-1000" 
                         style={{ width: `${summary.quota_reached}%` }} 
                       />
                    </div>
                 </div>
              </div>
           </div>

           {/* Proactive Actions (Moved Up) */}
           <div className="pt-2 px-1 mb-2">
              <NextBestActionsSection onOpenCustomer={setSelectedCustomerId} />
           </div>

           <div className="mt-0 mb-0">
              <SmartRouteSection onOpenCustomer={(id) => handleOpenCustomer(id)} />
           </div>
        </div>

        {/* Cartera por Cobrar Section */}
        <section className="px-5 mb-8">
           <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest px-1">Cartera Crítica</h4>
              <button 
                onClick={() => handleOpenCustomer("3", 'credit')}
                className="text-[9px] font-black text-dismel-red uppercase tracking-widest px-1"
              >
                Ver Todo
              </button>
           </div>
           
           <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
              {[
                { id: "3", name: "Bar Seven Nights", amount: 1250000, days: 34, status: 'blocked' },
                { id: "5", name: "Restaurante El Faro", amount: 4500000, days: 20, status: 'at_risk' },
                { id: "2", name: "Licorera Central", amount: 850000, days: 12, status: 'at_risk' }
              ].map((item, i) => (
                <button 
                  key={i}
                  onClick={() => handleOpenCustomer(item.id, 'credit')}
                  className="min-w-[220px] bg-white p-5 rounded-[32px] border border-border-soft snap-center shadow-sm text-left active:scale-[0.98] transition-all"
                >
                   <div className="flex items-center justify-between mb-4">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.status === 'blocked' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                         <AlertTriangle size={16} />
                      </div>
                      <div className="bg-red-600 text-white text-[7px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest">
                         {item.days} Días
                      </div>
                   </div>
                   <h5 className="text-[10px] font-black text-text-main uppercase mb-1 truncate">{item.name}</h5>
                   <p className="text-base font-black text-red-600 mb-4">{formatCurrency(item.amount)}</p>
                   <div className="flex items-center gap-2 text-[8px] font-black text-text-muted uppercase tracking-widest">
                      <span>Gestionar Cobro</span>
                      <ChevronRight size={10} className="text-dismel-red" />
                   </div>
                </button>
              ))}
           </div>
        </section>

        <div className="space-y-3 px-1 pb-24">
            {/* Feedback Nudges */}
            <section className="px-5">
               <PendingFeedbackNudges />
            </section>

            {/* Commercial Performance Dashboard */}
            <section className="px-5 mt-4">
               <CommercialPerformancePanel />
            </section>

            {/* Proactive Messages Inbox */}
            <section className="px-5 pt-4">
               <ProactiveMessagesInbox />
            </section>

            {/* Critical Debt Section */}
            <section className="px-5">
               <div 
                 onClick={() => setSelectedCustomerId("3")} // Bar Seven is the blocked/debt demo
                 className="bg-white rounded-[32px] border border-border-soft p-5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
               >
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                           <DollarSign size={16} />
                        </div>
                        <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest">Cartera por Cobrar</h4>
                     </div>
                     <div className="px-2 py-1 bg-orange-50 rounded-lg">
                        <span className="text-[9px] font-black text-orange-600">3 Pendientes</span>
                     </div>
                  </div>
                  
                  <div className="space-y-3">
                     {[
                        { name: "Tienda Don Jose", amount: "$1.240.000", days: "15d" },
                        { name: "Minimercado central", amount: "$450.000", days: "8d" }
                     ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-dismel-gray rounded-2xl">
                           <div className="flex-1">
                              <p className="text-[10px] font-black text-text-main uppercase">{item.name}</p>
                              <p className="text-[9px] font-bold text-text-muted">Vence en {item.days}</p>
                           </div>
                           <p className="text-[11px] font-black text-orange-600">{item.amount}</p>
                        </div>
                     ))}
                  </div>
                  
                  <button className="w-full mt-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-widest border-t border-dashed border-border-soft pt-4">
                     Ver toda la cartera
                  </button>
               </div>
            </section>

            {/* Smart Repurchase Suggestions */}
            <section className="px-5">
               <RepurchaseSuggestionsSection 
                 showCustomer={true}
                 onAddToOrder={(suggestion) => {
                   if (suggestion.product_id) {
                     localStorage.setItem('pending_order_items', JSON.stringify([{
                       id: suggestion.product_id,
                       name: suggestion.product_name,
                       suggested_quantity: suggestion.suggested_qty || 12,
                       price: suggestion.current_price || 0,
                       sku: suggestion.sku
                     }]));
                   }
                   navigate(`/dashboard/suggested-order?customer_id=${suggestion.customer_id}&source=repurchase`);
                 }}
                 onOpenCustomer={setSelectedCustomerId}
               />
            </section>

            {/* Recent Activity Section */}
            <section className="px-5 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center text-white">
                      <Clock size={16} />
                    </div>
                    <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest">
                      Actividad Reciente
                    </h4>
                  </div>
                </div>
                
                <div className="space-y-4">
                   {[
                      { type: 'order', title: 'Pedido #8821 Guardado', time: 'hace 15 min', customer: 'Tienda La Economy' },
                      { type: 'visit', title: 'Visita Finalizada', time: 'hace 45 min', customer: 'Almacenes Éxito' }
                   ].map((item, i) => (
                      <div key={i} className="flex gap-4 items-start">
                         <div className="relative mt-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-dismel-red" />
                            {i === 0 && <div className="absolute top-2.5 left-1 w-0.5 h-10 bg-gray-100" />}
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-start mb-0.5">
                               <p className="text-[10px] font-black text-text-main uppercase tracking-tight">{item.title}</p>
                               <span className="text-[8px] font-bold text-text-muted uppercase">{item.time}</span>
                            </div>
                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{item.customer}</p>
                         </div>
                      </div>
                   ))}
                </div>
            </section>

            {/* Daily Quote / Tip */}
            <section className="px-5 pb-10">
               <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-[32px] text-white shadow-xl">
                  <Clock size={24} className="text-dismel-red mb-4" />
                  <p className="text-[13px] font-bold italic leading-relaxed text-gray-300">
                    "Tu ruta de hoy se ha optimizado automáticamente a las 4:00 AM para asegurar que visites a los clientes con mayor potencial de recaudo y venta."
                  </p>
                  <p className="text-[9px] font-black uppercase tracking-widest mt-4 text-dismel-red">Ruta Inteligente Generada • 4:00 AM</p>
               </div>
            </section>
         </div>
      </div>

      <AnimatePresence>
        {selectedCustomerId && (
          <Customer360Modal 
            customerId={selectedCustomerId} 
            initialTab={initialModalTab}
            onClose={() => {
              setSelectedCustomerId(null);
              setInitialModalTab('overview');
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
