import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Phone, MessageSquare, ShoppingCart, 
  TrendingUp, DollarSign, Clock, AlertTriangle, 
  MapPin, ChevronRight, User, Package, 
  CreditCard, Calendar, ArrowUpRight, CheckCircle2,
  Copy, ExternalLink, RefreshCw, Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { customer360Service } from "../../services/customer360Service";
import { proactiveMessageService } from "../../services/proactiveMessageService";
import { scoringService } from "../../services/scoringService";
import { creditService } from "../../services/creditService";
import { Customer360Data, SuggestedRepurchaseItem, CrossSellOpportunity, ProactiveMessage, PriorityScore } from "../../types";
import { CustomerCreditData, Invoice, PaymentPromise } from "../../types/credit";
import { formatCurrency } from "../../lib/utils";
import { feedbackLogger } from "../../utils/feedbackLogger";
import ProactiveMessageReviewModal from "../proactive/ProactiveMessageReviewModal";
import PriorityExplanationCard from "../scoring/PriorityExplanationCard";
import SignalsDetailModal from "../scoring/SignalsDetailModal";
import CustomerLearningSection from "../feedback/CustomerLearningSection";

// Credit Components
import CreditSummaryCard from "../credit/CreditSummaryCard";
import InvoiceList from "../credit/InvoiceList";
import PaymentPromisePanel from "../credit/PaymentPromisePanel";
import CreditActionsPanel from "../credit/CreditActionsPanel";
import CollectionAgentSuggestion from "../credit/CollectionAgentSuggestion";
import CustomerCreditBehaviorCard from "../credit/CustomerCreditBehaviorCard";
import { RegisterPromiseModal, GenerateLinkModal, ReportPaymentModal, EscalateModal } from "../credit/CreditActionModals";

interface Customer360ModalProps {
  customerId: string;
  onClose: () => void;
  initialTab?: 'overview' | 'credit' | 'orders' | 'repurchase';
}

export default function Customer360Modal({ customerId, onClose, initialTab = 'overview' }: Customer360ModalProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<Customer360Data | null>(null);
  const [creditData, setCreditData] = useState<CustomerCreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'credit' | 'orders' | 'repurchase'>(initialTab);
  const [pendingMessages, setPendingMessages] = useState<ProactiveMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ProactiveMessage | null>(null);
  const [priorityScore, setPriorityScore] = useState<PriorityScore | null>(null);
  const [showSignalsModal, setShowSignalsModal] = useState(false);

  // Modal states for Credit
  const [activeCreditModal, setActiveCreditModal] = useState<'promise' | 'link' | 'report' | 'escalate' | null>(null);
  const [selectedInvoiceForAction, setSelectedInvoiceForAction] = useState<Invoice | null>(null);

  useEffect(() => {
    loadData();
    loadMessages();
    loadScore();
    loadCreditData();

    const handleUpdate = () => {
      loadScore();
    };

    window.addEventListener("scoring:updated", handleUpdate);
    return () => window.removeEventListener("scoring:updated", handleUpdate);
  }, [customerId]);

  async function loadScore() {
    const response = await scoringService.getCustomerScore(customerId);
    if (response.ok && response.score) {
      setPriorityScore(response.score);
    }
  }

  async function loadMessages() {
    const response = await proactiveMessageService.getMessagesForCustomer(customerId);
    if (response.ok && response.messages) {
      setPendingMessages(response.messages);
    }
  }

  async function loadCreditData() {
    const response = await creditService.getCustomerCreditData(customerId);
    if (response.ok && response.data) {
      setCreditData(response.data);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const result = await customer360Service.getCustomer360(customerId);
      
      if (!result || !result.customer) {
        throw new Error("No se encontró la información del cliente.");
      }

      setData(result);
      
      // Log Action Viewed
      if (result.proactive_recommendation) {
        feedbackLogger.logActionViewed(
          customerId, 
          result.customer.commercial_name || result.customer.customer_name || "Cliente", 
          result.proactive_recommendation.action_type === 'collect_payment' ? 'credit_collection' : 'suggested_order',
          '360_modal'
        );
      }
    } catch (err: any) {
      console.error("Error loading 360 data:", err);
      setError(err.message || "No se pudieron cargar los detalles del cliente");
    } finally {
      setLoading(false);
    }
  }

  const handlePrepareWhatsapp = () => {
    if (pendingMessages.length > 0) {
      setSelectedMessage(pendingMessages[0]);
    } else {
      setShowWhatsappModal(true);
    }
  };

  const handleSendWhatsapp = () => {
    if (!data || !data.customer || !data.proactive_recommendation) return;
    const message = encodeURIComponent(data.proactive_recommendation.suggested_message || '');
    const phone = (data.customer.phone || '').replace(/\D/g, '');
    if (!phone) {
      alert("No hay número de contacto disponible");
      return;
    }
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    feedbackLogger.logWhatsAppOpened(customerId, data.customer.commercial_name, "customer_360", customerId);
    setShowWhatsappModal(false);
  };

  const handleCreateSuggestedOrder = (source: string = 'customer_360') => {
    if (!data) return;
    feedbackLogger.logActionStarted(customerId, data.customer.commercial_name, "suggested_order", source);
    navigate(`/dashboard/suggested-order?customer_id=${customerId}&source=${source}`);
    onClose();
  };

  const handleRepeatLastOrder = () => {
    if (!data) return;
    navigate(`/dashboard/suggested-order?customer_id=${customerId}&source=last_order`);
    onClose();
  };

  const handleCreditAction = async (type: string, payload: any) => {
    let res;
    if (type === 'promise') {
      res = await creditService.registerPaymentPromise(payload);
    } else if (type === 'report') {
      res = await creditService.reportPayment({ ...payload, customer_id: customerId });
    } else if (type === 'escalate') {
      res = await creditService.escalateToCredit({ ...payload, customer_id: customerId });
    }

    if (res?.ok) {
       loadCreditData(); // Refresh
       setActiveCreditModal(null);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-[40px] w-full max-w-lg aspect-square flex flex-col items-center justify-center space-y-4">
        <RefreshCw size={40} className="text-dismel-red animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Analizando Cliente 360...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-[40px] p-8 w-full max-w-lg text-center">
        <AlertTriangle size={48} className="text-dismel-red mx-auto mb-4" />
        <h3 className="text-lg font-black uppercase tracking-tight mb-2 uppercase">Información no disponible</h3>
        <p className="text-[11px] text-text-muted font-bold mb-6">{error || 'No se pudieron cargar los detalles del cliente'}</p>
        <button 
          onClick={onClose}
          className="w-full py-4 bg-dismel-red text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform"
        >
          Regresar
        </button>
      </div>
    </div>
  );

  const { 
    customer = {} as any, 
    commercial_status = {} as any, 
    credit = {} as any, 
    proactive_recommendation = {} as any, 
    suggested_repurchase_items = [], 
    cross_sell_opportunities = [], 
    orders = { last_orders: [], open_orders_count: 0, pending_delivery_count: 0 } as any 
  } = data || {};

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-6">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-app-bg w-full max-w-xl mx-auto h-[92vh] sm:h-[85vh] rounded-t-[44px] sm:rounded-b-[44px] overflow-hidden flex flex-col relative shadow-2xl"
      >
        {/* Header Section */}
        <div className="bg-dismel-red p-6 pb-14 text-white relative flex-shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center"
          >
            <X size={20} />
          </button>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5 opacity-60">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">{customer.nit}</p>
              <span className="w-1 h-1 bg-white rounded-full" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">{customer.channel}</p>
            </div>
            <h2 className="text-xl font-black uppercase leading-tight tracking-tight mb-1">{customer.commercial_name}</h2>
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/20 rounded-lg">
                  <MapPin size={10} />
                  <p className="text-[9px] font-bold uppercase">{customer.city}</p>
               </div>
               <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                 customer.customer_status === 'active' ? 'bg-green-400 text-green-950' : 
                 customer.customer_status === 'at_risk' ? 'bg-orange-400 text-orange-950' : 
                 'bg-red-400 text-white'
               }`}>
                 {customer.customer_status === 'active' ? 'Activo' : customer.customer_status === 'at_risk' ? 'En Riesgo' : 'Bloqueado'}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
             <button 
               onClick={() => window.location.href = `tel:${customer.phone}`}
               className="flex-1 h-11 bg-white/15 hover:bg-white/20 transition-colors backdrop-blur-md rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest"
             >
                <Phone size={14} /> Llamar
             </button>
             <button 
               onClick={handlePrepareWhatsapp}
               className="flex-1 h-11 bg-white/15 hover:bg-white/20 transition-colors backdrop-blur-md rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest"
             >
                <MessageSquare size={14} /> WhatsApp
             </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-soft px-5 bg-white relative z-10">
           {[
             { id: 'overview', label: '360' },
             { id: 'credit', label: 'Cartera', badge: creditData?.summary.overdue_amount ? '!' : undefined },
             { id: 'orders', label: 'Pedidos' },
             { id: 'repurchase', label: 'Recompras' }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest relative ${
                 activeTab === tab.id ? 'text-dismel-red' : 'text-text-muted'
               }`}
             >
               {tab.label}
               {tab.badge && (
                 <span className="absolute top-3 right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] border-2 border-white">
                    {tab.badge}
                 </span>
               )}
               {activeTab === tab.id && (
                 <motion.div 
                   layoutId="activeTabIndicator"
                   className="absolute bottom-0 left-0 right-0 h-1 bg-dismel-red rounded-t-full" 
                 />
               )}
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-app-bg px-5 pt-8 pb-32 space-y-8">
            
            {activeTab === 'overview' && (
              <>
                {/* Priority Explanation */}
                {priorityScore && (
                  <section>
                      <PriorityExplanationCard 
                        score={priorityScore} 
                        onViewDetails={() => setShowSignalsModal(true)} 
                      />
                  </section>
                )}

                {/* IA RECOMMENDATION CARD */}
                <section>
                   <div className="bg-gradient-to-br from-gray-900 to-black rounded-[36px] p-6 text-white shadow-xl relative overflow-hidden group">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-dismel-red/20 blur-3xl group-hover:bg-dismel-red/40 transition-all duration-700" />
                      
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-dismel-red rounded-2xl flex items-center justify-center">
                               <TrendingUp size={20} className="text-white" />
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-dismel-red">Sugerencia IA</p>
                               <h4 className="text-sm font-black uppercase tracking-tight">{proactive_recommendation?.title || 'Análisis Proactivo'}</h4>
                            </div>
                         </div>
                         <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                           proactive_recommendation?.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                         }`}>
                           Prioridad {proactive_recommendation?.priority === 'high' ? 'Alta' : 'Media'}
                         </div>
                      </div>

                      <p className="text-[11px] font-bold text-gray-300 leading-relaxed mb-6">
                         {proactive_recommendation?.reason || 'Sin detalles adicionales'}
                      </p>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                         <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Acción Recomendada</p>
                         <p className="text-[11px] font-black leading-tight text-white">{proactive_recommendation?.recommended_action || 'Contactar cliente'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <button 
                           onClick={handlePrepareWhatsapp}
                           className="h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
                         >
                            <MessageSquare size={14} /> Preparar Chat
                         </button>
                         <button 
                           onClick={() => handleCreateSuggestedOrder('customer_360')}
                           className="h-12 bg-dismel-red hover:bg-dismel-red-dark text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-dismel-red/20"
                         >
                            <ShoppingCart size={14} /> Pedido Sugerido
                         </button>
                      </div>
                   </div>
                </section>

                {/* MESSAGES SECTION */}
                {pendingMessages.length > 0 && (
                  <section>
                     <div className="flex items-center justify-between mb-4 px-1">
                        <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest">Mensajes Sugeridos</h4>
                        <div className="bg-black text-white text-[8px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                           <Zap size={6} fill="currentColor" />
                           {pendingMessages.length}
                        </div>
                     </div>
                     <div className="space-y-3">
                        {pendingMessages.map((msg, i) => (
                           <div key={i} className="bg-white p-4 rounded-[28px] border border-border-soft flex items-center justify-between group">
                              <div className="flex-1 pr-4">
                                 <p className="text-[9px] font-black text-dismel-red uppercase tracking-widest mb-1">{(msg.trigger_type || '').replace('_', ' ')}</p>
                                 <p className="text-[11px] font-bold text-text-main line-clamp-1 italic">"{msg.message_body}"</p>
                              </div>
                              <button 
                                onClick={() => setSelectedMessage(msg)}
                                className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-sm"
                              >
                                 <MessageSquare size={16} />
                              </button>
                           </div>
                        ))}
                     </div>
                  </section>
                )}

                <CustomerLearningSection customerId={customerId} />

                <section>
                  <div className="flex items-center justify-between mb-4 px-1">
                     <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest">Desempeño Comercial</h4>
                     <TrendingUp size={16} className="text-text-muted opacity-40" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="bg-white p-5 rounded-[28px] border border-border-soft">
                        <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Venta Mes Actual</p>
                        <div className="flex items-end gap-2">
                           <p className="text-base font-black text-text-main">{formatCurrency(commercial_status?.monthly_sales_current || 0)}</p>
                           <span className={`text-[8px] font-black flex items-center ${(commercial_status?.sales_drop_percentage || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                              {(commercial_status?.sales_drop_percentage || 0) > 0 ? '↓' : '↑'}{Math.abs(commercial_status?.sales_drop_percentage || 0)}%
                           </span>
                        </div>
                     </div>
                     <div className="bg-white p-5 rounded-[28px] border border-border-soft">
                        <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Ubicación</p>
                        <div className="flex items-center gap-2">
                           <MapPin size={12} className="text-dismel-red" />
                           <p className="text-[10px] font-black text-text-main uppercase truncate">{customer.address}</p>
                        </div>
                     </div>
                  </div>
                </section>
              </>
            )}

            {activeTab === 'credit' && creditData && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CreditSummaryCard summary={creditData.summary} />
                
                <section>
                   <CollectionAgentSuggestion 
                     suggestion={creditData.summary.next_action_suggestion} 
                     onPrepareMessage={handlePrepareWhatsapp}
                   />
                </section>

                <CreditActionsPanel 
                  onGenerateLink={() => {
                    setSelectedInvoiceForAction(creditData.invoices.find(i => i.status === 'overdue' || i.status === 'critical') || creditData.invoices[0]);
                    setActiveCreditModal('link');
                  }}
                  onRegisterPromise={() => setActiveCreditModal('promise')}
                  onReportPayment={() => setActiveCreditModal('report')}
                  onEscalate={() => setActiveCreditModal('escalate')}
                />

                <section>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest">Facturas del Cliente</h4>
                    <span className="text-[9px] font-bold text-text-muted uppercase">{creditData.invoices.length} Items</span>
                  </div>
                  <InvoiceList 
                    invoices={creditData.invoices} 
                    onGenerateLink={(inv) => {
                      setSelectedInvoiceForAction(inv);
                      setActiveCreditModal('link');
                    }}
                    onPrepareMessage={(inv) => {
                      const msg = `Hola ${customer.commercial_name}, te escribo por la factura ${inv.invoice_number} que tiene un saldo de ${formatCurrency(inv.remaining_balance)} y ya se encuentra vencida. ¿Me podrías confirmar si ya realizaste el pago o para cuándo lo tendrías listo? Gracias.`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                  />
                </section>

                <PaymentPromisePanel 
                  promises={creditData.promises}
                  onRegisterNew={() => setActiveCreditModal('promise')}
                  onUpdateStatus={async (id, status) => {
                    // Update locally for demo
                    setCreditData(prev => prev ? {
                      ...prev,
                      promises: prev.promises.map(p => p.id === id ? { ...p, status } : p)
                    } : null);
                  }}
                />

                <CustomerCreditBehaviorCard behavior={creditData.behavior} />
              </div>
            )}

            {activeTab === 'orders' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-4 px-1">
                   <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest">Últimos Pedidos</h4>
                   <div className="bg-gray-100 px-2 py-0.5 rounded-lg text-[8px] font-black text-text-muted uppercase tracking-widest">
                      {orders.open_orders_count} Abierto
                   </div>
                </div>
                <div className="bg-white rounded-[32px] border border-border-soft overflow-hidden">
                   <div className="divide-y divide-border-soft">
                      {(orders?.last_orders || []).map((order: any, i: number) => (
                         <div key={i} className="p-4 flex items-center justify-between">
                            <div>
                               <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-[10px] font-black text-text-main uppercase">{order.id}</p>
                                  <span className={`px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase text-white ${
                                    order.status === 'Entregado' ? 'bg-green-500' : 'bg-orange-500'
                                  }`}>
                                     {order.status}
                                  </span>
                               </div>
                               <p className="text-[9px] font-bold text-text-muted uppercase">{order.date ? new Date(order.date).toLocaleDateString() : '—'}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[11px] font-black text-text-main">{formatCurrency(order.amount || 0)}</p>
                               <button className="text-[9px] font-black text-dismel-red uppercase tracking-widest flex items-center gap-1 justify-end mt-1">
                                  Ver <ChevronRight size={10} />
                               </button>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              </section>
            )}

            {activeTab === 'repurchase' && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest">Recompras Sugeridas</h4>
                  <Package size={16} className="text-text-muted opacity-40" />
                </div>
                <div className="space-y-3">
                  {(suggested_repurchase_items || []).map((item, i) => (
                    <div key={i} className="bg-white p-4 rounded-[28px] border border-border-soft flex items-center justify-between group active:scale-[0.98] transition-all">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${item.confidence === 'high' ? 'bg-green-500' : 'bg-orange-500'}`} />
                          <p className="text-[10px] font-black text-text-main uppercase truncate pr-4">{item.product_name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-[9px] font-bold text-text-muted uppercase">Sugerido: <span className="text-text-main font-black">{item.suggested_quantity} u.</span></p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleCreateSuggestedOrder('repurchase')}
                        className="w-10 h-10 bg-dismel-red-soft text-dismel-red rounded-xl flex items-center justify-center"
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
        </div>

        {/* Global Modals for Credit */}
        <AnimatePresence>
          {activeCreditModal === 'promise' && (
            <RegisterPromiseModal 
              customerId={customerId} 
              onClose={() => setActiveCreditModal(null)} 
              onSave={(p) => handleCreditAction('promise', p)}
            />
          )}
          {activeCreditModal === 'link' && (
            <GenerateLinkModal 
              amount={selectedInvoiceForAction?.remaining_balance || creditData?.summary.overdue_amount || 0} 
              onClose={() => {
                setActiveCreditModal(null);
                setSelectedInvoiceForAction(null);
              }}
            />
          )}
          {activeCreditModal === 'report' && (
            <ReportPaymentModal 
              onClose={() => setActiveCreditModal(null)} 
              onSave={(p) => handleCreditAction('report', p)}
            />
          )}
          {activeCreditModal === 'escalate' && (
            <EscalateModal 
               onClose={() => setActiveCreditModal(null)} 
               onSave={(p) => handleCreditAction('escalate', p)}
            />
          )}
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-border-soft shadow-[0_-10px_30px_rgba(0,0,0,0.05)] relative z-[40]">
           <button 
             onClick={() => handleCreateSuggestedOrder('modal_footer')}
             className="w-full h-14 bg-black text-white rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-black/20 active:scale-[0.98] transition-all"
           >
              <ShoppingCart size={18} /> Iniciar Nuevo Pedido
           </button>
        </div>

        {/* Whatsapp Modal */}
        <AnimatePresence>
           {selectedMessage && (
             <ProactiveMessageReviewModal 
               message={selectedMessage}
               onClose={() => setSelectedMessage(null)}
               onAction={(action) => {
                 if (action === 'discard' || action === 'sent') {
                   setPendingMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
                 }
                 setSelectedMessage(null);
               }}
             />
           )}
           {showWhatsappModal && (
              <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6">
                 <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl"
                 >
                    <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500 text-white rounded-2xl flex items-center justify-center">
                             <MessageSquare size={20} />
                          </div>
                          <div>
                             <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest">Preparar Mensaje</h4>
                             <p className="text-[9px] font-black text-green-600 uppercase">Consultoría Proactiva</p>
                          </div>
                       </div>
                       <button onClick={() => setShowWhatsappModal(false)} className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center">
                          <X size={20} />
                       </button>
                    </div>

                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 mb-8">
                       <p className="text-[13px] font-bold text-text-main leading-relaxed italic">
                          "{proactive_recommendation?.suggested_message || 'Hola, ¿cómo estás?'}"
                       </p>
                    </div>

                    <div className="flex gap-3">
                       <button className="flex-1 h-12 bg-gray-100 text-text-main rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                          <Copy size={16} /> Copiar
                       </button>
                       <button 
                         onClick={handleSendWhatsapp}
                         className="flex-[2] h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20"
                       >
                          <ExternalLink size={16} /> Abrir WhatsApp
                       </button>
                    </div>
                 </motion.div>
              </div>
           )}
           {priorityScore && showSignalsModal && (
              <SignalsDetailModal 
                score={priorityScore} 
                onClose={() => setShowSignalsModal(false)} 
              />
           )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
