import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, User, Phone, MapPin, CreditCard, AlertCircle, ShoppingBag, 
  History, TrendingUp, Info, ChevronRight, Plus, Calendar, Clock,
  CheckCircle2, AlertTriangle, Lock
} from "lucide-react";
import RepurchaseSuggestionsSection from "../repurchase/RepurchaseSuggestionsSection";
import { customerService } from "../../services/customerService";
import { CustomerDashboardData } from "../../types";

interface CustomerDashboardModalProps {
  customerId: string;
  onClose: () => void;
  onStartOrder: (customerId: string, customerName: string, initialProduct?: any) => void;
}

export default function CustomerDashboardModal({ customerId, onClose, onStartOrder }: CustomerDashboardModalProps) {
  const [data, setData] = useState<CustomerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'commercial' | 'wallet' | 'products'>('info');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const dashboard = await customerService.getCustomerDashboard(customerId);
        setData(dashboard);
      } catch (err: any) {
        setError(err.message || "Error al cargar el dashboard del cliente");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [customerId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'can_order': return 'bg-green-500';
      case 'review': return 'bg-orange-500';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'can_order': return 'bg-green-50';
      case 'review': return 'bg-orange-50';
      case 'blocked': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'can_order': return 'text-green-700';
      case 'review': return 'text-orange-700';
      case 'blocked': return 'text-red-700';
      default: return 'text-gray-700';
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-3xl p-10 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-dismel-red border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Cargando Cliente 360...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Error de Conexión</h3>
            <p className="text-sm font-medium text-gray-500">{error || "No se pudo obtener la información"}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-full bg-dismel-red text-white py-4 rounded-2xl font-black text-sm active:scale-95 transition-transform"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  const { customer, credit, purchase_summary, alerts, frequent_products, repurchase_suggestions, recent_orders } = data;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex flex-col no-scrollbar overflow-hidden">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />
      
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-[#f8f9fa] w-full h-[92vh] rounded-t-[32px] flex flex-col shadow-2xl overflow-hidden font-sans relative"
      >
        {/* Drag Handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full z-10" />

        {/* Header Section */}
        <div className="bg-dismel-red px-6 pt-10 pb-6 relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/20 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform z-20"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4 mb-6 pr-10">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shrink-0 border border-white/10">
              <User size={28} />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-lg font-black text-white leading-none uppercase tracking-tight truncate mb-1.5">{customer.name}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">NIT: {customer.vat}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[9px] font-black text-white/60 uppercase tracking-widest truncate max-w-[150px]">{customer.commercial_name || 'Sin nombre comercial'}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-3 gap-2.5">
             <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-center border border-white/10">
                <p className="text-[7px] font-black text-white/50 uppercase tracking-widest leading-none mb-1.5">Ventas </p>
                <p className="text-[11px] font-black text-white truncate">{formatCurrency(purchase_summary.sales_90d)}</p>
             </div>
             <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-center border border-white/10">
                <p className="text-[7px] font-black text-white/50 uppercase tracking-widest leading-none mb-1.5">Ticket</p>
                <p className="text-[11px] font-black text-white truncate">{formatCurrency(purchase_summary.avg_ticket_90d)}</p>
             </div>
             <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-center border border-white/10">
                <p className="text-[7px] font-black text-white/50 uppercase tracking-widest leading-none mb-1.5">Pedidos</p>
                <p className="text-[11px] font-black text-white">{purchase_summary.orders_90d}</p>
             </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white px-3 overflow-x-auto no-scrollbar gap-0 border-b border-border-soft shrink-0">
          {[
            { id: 'products', label: 'Recompra', icon: ShoppingBag },
            { id: 'info', label: 'Info', icon: Info },
            { id: 'wallet', label: 'Cartera', icon: CreditCard },
            { id: 'commercial', label: 'Historial', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center gap-1.5 px-4 py-4 shrink-0 transition-all border-b-2 grow relative ${
                  isActive ? "text-dismel-red" : "text-text-muted"
                }`}
              >
                <Icon size={18} className={isActive ? "text-dismel-red" : "text-text-muted/40"} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[8px] uppercase tracking-widest font-black ${isActive ? "opacity-100" : "opacity-40"}`}>{tab.label}</span>
                {isActive && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-4 right-4 h-0.5 bg-dismel-red rounded-full" />}
              </button>
            )
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-6">
          
          {/* Status Badge (Always relevant) */}
          <div className={`p-4 rounded-2xl border ${getStatusBg(credit.status)} flex items-center gap-4 ${
            credit.status === 'can_order' ? 'border-green-100' : credit.status === 'review' ? 'border-orange-100' : 'border-red-100'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getStatusColor(credit.status)}`}>
               {credit.status === 'can_order' ? <CheckCircle2 size={24} /> : credit.status === 'review' ? <AlertTriangle size={24} /> : <Lock size={24} />}
            </div>
            <div>
               <p className={`text-xs font-black uppercase tracking-widest ${getStatusText(credit.status)}`}>{credit.label}</p>
               <p className="text-[10px] font-bold text-gray-500 opacity-80">{credit.reason || 'Estado comercial normal'}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'info' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                         <Phone size={16} />
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Contacto</p>
                         <p className="text-xs font-black text-gray-800">{customer.phone} / {customer.mobile || 'N/A'}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                         <MapPin size={16} />
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Dirección</p>
                         <p className="text-xs font-black text-gray-800">{customer.street}, {customer.city}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                         <User size={16} />
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Asesor Asignado</p>
                         <p className="text-xs font-black text-gray-800">{customer.advisor_name}</p>
                      </div>
                   </div>
                </div>

                {alerts.length > 0 && (
                   <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Alertas Comerciales</h4>
                      {alerts.map(alert => (
                        <div key={alert.id} className={`p-4 rounded-2xl border flex gap-3 ${
                          alert.type === 'danger' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
                        }`}>
                           <div className={`mt-0.5 ${alert.type === 'danger' ? 'text-red-500' : 'text-blue-500'}`}>
                              <Info size={16} />
                           </div>
                           <div>
                              <p className="text-xs font-black text-gray-800">{alert.title}</p>
                              <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">{alert.message}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                )}
              </motion.div>
            )}

            {activeTab === 'wallet' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="bg-white rounded-3xl p-6 border border-gray-100">
                   <div className="space-y-4">
                      <div className="flex justify-between items-end">
                         <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Cartera</p>
                            <p className="text-2xl font-black text-gray-800">{formatCurrency(credit.total_due)}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Días Mora</p>
                            <p className={`text-xl font-black ${credit.max_days_overdue > 0 ? 'text-red-500' : 'text-green-500'}`}>{credit.max_days_overdue}</p>
                         </div>
                      </div>
                      
                      <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden flex">
                         <div 
                           className="h-full bg-red-400" 
                           style={{ width: `${(credit.overdue_total / credit.total_due) * 100}%` }} 
                         />
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                         <div className="p-3 bg-red-50/50 rounded-xl border border-red-100">
                            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Vencido</p>
                            <p className="text-sm font-black text-red-600">{formatCurrency(credit.overdue_total)}</p>
                         </div>
                         <div className="p-3 bg-green-50/50 rounded-xl border border-green-100">
                            <p className="text-[9px] font-black text-green-400 uppercase tracking-widest leading-none mb-1">Por Vencer</p>
                            <p className="text-sm font-black text-green-600">{formatCurrency(credit.not_due_total)}</p>
                         </div>
                      </div>
                   </div>
                </div>
                {/* Could add detailed invoices here */}
              </motion.div>
            )}

            {activeTab === 'commercial' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                
                {/* Recent Orders List */}
                <div className="space-y-3">
                   <div className="flex items-center justify-between px-1">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pedidos Recientes</h4>
                      <History size={14} className="text-gray-300" />
                   </div>
                   <div className="space-y-3">
                      {recent_orders.map(order => (
                        <div key={order.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group active:bg-gray-50 transition-colors">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                 <Plus size={18} />
                              </div>
                              <div>
                                 <p className="text-xs font-black text-gray-800">{order.id} {order.invoice_number && `- ${order.invoice_number}`}</p>
                                 <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold text-gray-400">{order.date}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-200" />
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{order.status}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-black text-gray-800">{formatCurrency(order.amount)}</p>
                              <ChevronRight size={16} className="ml-auto text-gray-200 mt-0.5" />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Performance Summary */}
                <div className="space-y-3">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Evolución Venta</h4>
                   <div className="bg-white rounded-3xl p-5 border border-gray-100 grid grid-cols-2 gap-y-6 gap-x-4">
                      <div>
                         <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 leading-none">Venta 30d</p>
                         <p className="text-sm font-black text-gray-800">{formatCurrency(purchase_summary.sales_30d)}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 leading-none">Venta 60d</p>
                         <p className="text-sm font-black text-gray-700 opacity-60">{formatCurrency(purchase_summary.sales_60d)}</p>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-gray-50 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                            <TrendingUp size={16} />
                         </div>
                         <p className="text-[10px] font-bold text-gray-400 leading-tight">
                           El ticket promedio del cliente es de <span className="text-gray-800 font-black">{formatCurrency(purchase_summary.avg_ticket_90d)}</span>
                         </p>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                
                {/* Repurchase Suggestions */}
                <RepurchaseSuggestionsSection 
                  customerId={customer.id}
                  onAddToOrder={(s) => onStartOrder(customer.id, customer.name, {
                    id: s.product_id,
                    name: s.product_name,
                    price: s.current_price,
                    stock: s.available_qty,
                    category: s.category || 'Recompra',
                    brand: 'Dismel',
                    tax: 19
                  })}
                />

                {/* Frequent Products */}
                <div className="space-y-3">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Infaltables (Más Comprados)</h4>
                   <div className="grid grid-cols-1 gap-3">
                      {frequent_products.map(product => (
                        <div key={product.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                           <div className="flex-1 min-w-0 pr-4">
                              <h5 className="text-xs font-black text-gray-800 leading-tight truncate">{product.name}</h5>
                              <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                                Comprado {product.purchase_count_90d} veces en 90 días (Prom: {product.avg_qty} uni)
                              </p>
                              <p className="text-[10px] font-black text-dismel-red mt-1">{formatCurrency(product.price)}</p>
                           </div>
                           <button 
                             onClick={() => onStartOrder(customer.id, customer.name, product)}
                             className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-800 active:scale-90 transition-transform"
                           >
                              <Plus size={18} />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-24" />
        </div>

        {/* Global Action Bar */}
        <div className="p-6 bg-white border-t border-gray-100 flex gap-4 mt-auto">
           <button 
             onClick={() => customer.phone && (window.location.href = `tel:${customer.phone}`)}
             className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 active:scale-90 transition-transform"
           >
              <Phone size={20} />
           </button>
           <button 
             disabled={credit.status === 'blocked'}
             onClick={() => onStartOrder(customer.id, customer.name)}
             className={`flex-1 ${credit.status === 'blocked' ? "bg-gray-200 cursor-not-allowed" : "bg-dismel-red shadow-xl shadow-red-200"} text-white h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform`}
           >
              <ShoppingBag size={20} />
              Iniciar Pedido
           </button>
        </div>
      </motion.div>
    </div>
  );
}
