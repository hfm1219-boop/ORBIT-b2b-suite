import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  ChevronLeft, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Plus, 
  Minus, 
  Trash2, 
  Wallet, 
  MessageCircle, 
  Send, 
  Search,
  ShoppingCart,
  Zap,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { suggestedOrderService } from "../services/suggestedOrderService";
import { proactiveMessageService } from "../services/proactiveMessageService";
import { scoringService } from "../services/scoringService";
import { feedbackService } from "../services/feedbackService";
import { creditService } from "../services/creditService";
import { SuggestedOrder, SuggestedOrderLine, SuggestedOrderValidation, ProactiveMessage, PriorityScore, CommercialFeedbackEvent } from "../types";
import { CustomerCreditData } from "../types/credit";
import { formatCurrency } from "../lib/utils";
import { feedbackLogger } from "../utils/feedbackLogger";
import ProactiveMessageReviewModal from "../components/proactive/ProactiveMessageReviewModal";
import PriorityExplanationCard from "../components/scoring/PriorityExplanationCard";
import QuickFeedbackPrompt from "../components/feedback/QuickFeedbackPrompt";
import Customer360Modal from "../components/customers/Customer360Modal";

export default function SuggestedOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get("customer_id") || "";
  const source = (searchParams.get("source") || "manual") as SuggestedOrder['source'];
  
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [order, setOrder] = useState<SuggestedOrder | null>(null);
  const [creditData, setCreditData] = useState<CustomerCreditData | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [selectedProactiveMessage, setSelectedProactiveMessage] = useState<ProactiveMessage | null>(null);
  const [priorityScore, setPriorityScore] = useState<PriorityScore | null>(null);
  const [showDiscardFeedback, setShowDiscardFeedback] = useState(false);

  const MOCK_PRODUCTS = [
    { id: "101", sku: "RON-MED-750", name: "RON MEDELLIN AÑEJO 750ml", price: 45000, category: "Licores", stock: 120 },
    { id: "102", sku: "AGU-ANT-750", name: "AGUARDIENTE ANTIOQUEÑO 750ml", price: 38000, category: "Licores", stock: 240 },
    { id: "103", sku: "CER-CLUB-330", name: "CERVEZA CLUB COLOMBIA 330ml x6", price: 21000, category: "Cervezas", stock: 500 },
    { id: "104", sku: "VIN-GATO-750", name: "VINO GATO NEGRO CABERNET 750ml", price: 32000, category: "Vinos", stock: 45 },
    { id: "105", sku: "WHI-BUC-750", name: "WHISKY BUCHANANS DELUXE 750ml", price: 145000, category: "Licores", stock: 32 }
  ];

  const filteredProducts = MOCK_PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = (product: any) => {
    if (!order) return;
    
    const existingLine = order.lines.find(l => l.product_id === product.id);
    let newLines;
    
    if (existingLine) {
      newLines = order.lines.map(l => l.product_id === product.id ? {
        ...l,
        quantity: l.quantity + 1,
        subtotal: (l.quantity + 1) * l.unit_price
      } : l);
    } else {
      newLines = [...order.lines, {
        product_id: product.id,
        product_code: product.sku,
        product_name: product.name,
        category: product.category,
        quantity: 1,
        unit_price: product.price,
        subtotal: product.price,
        available_stock: product.stock,
        stock_status: 'available',
        reason: 'Manual',
        source: 'manual',
        confidence: 'high',
        editable: true,
        suggested_quantity: 1
      }];
    }
    
    updateOrderTotals(newLines);
    setShowProductSearch(false);
    setSearchQuery("");
  };

  const loadOrder = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      // Load Score
      const scoreRes = await scoringService.getCustomerScore(customerId);
      if (scoreRes.ok && scoreRes.score) {
        setPriorityScore(scoreRes.score);
      }

      let result;
      if (source === "repurchase") {
        const storedItems = localStorage.getItem('pending_order_items');
        const items = storedItems ? JSON.parse(storedItems) : [];
        result = await suggestedOrderService.createFromRepurchase(customerId, items);
      } else if (source === "last_order") {
        result = await suggestedOrderService.createFromLastOrder(customerId);
      } else {
        result = await suggestedOrderService.createFromCustomer360(customerId);
      }

      if (result.ok && (result.order || result.suggested_order || result.data)) {
        const orderData = result.order || result.suggested_order || result.data || null;
        setOrder(orderData);
        
        // Load Credit Data
        const creditRes = await creditService.getCustomerCreditData(customerId);
        if (creditRes.ok && creditRes.data) {
          setCreditData(creditRes.data);
        }
        // Log Suggested Order Created
        if (orderData) {
          feedbackLogger.logSuggestedOrderCreated(
            orderData.customer_id, 
            orderData.customer_name, 
            orderData.id,
            source as any
          );
        }
      }
    } catch (err) {
      console.error("Error loading suggested order:", err);
    } finally {
      setLoading(false);
    }
  }, [customerId, source]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleUpdateQuantity = (productId: string, delta: number) => {
    if (!order) return;
    const newLines = order.lines.map(line => {
      if (line.product_id === productId) {
        const newQty = Math.max(0, line.quantity + delta);
        return { 
          ...line, 
          quantity: newQty,
          subtotal: newQty * line.unit_price 
        };
      }
      return line;
    }).filter(line => line.quantity > 0);

    updateOrderTotals(newLines);
  };

  const handleDeleteLine = (productId: string) => {
    if (!order) return;
    const newLines = order.lines.filter(line => line.product_id !== productId);
    updateOrderTotals(newLines);
  };

  const updateOrderTotals = (lines: SuggestedOrderLine[]) => {
    if (!order) return;
    const subtotal = lines.reduce((acc, l) => acc + l.subtotal, 0);
    const taxes = subtotal * 0.19; // Simplified taxes
    const total = subtotal + taxes;
    
    setOrder({
      ...order,
      lines,
      subtotal,
      taxes,
      total,
      validation_status: "pending" // Needs re-validation after edit
    });
  };

  const handleValidate = async () => {
    if (!order) return;
    setValidating(true);
    try {
      const result = await suggestedOrderService.validateSuggestedOrder(order);
      if (result.ok && result.order) {
        setOrder(result.order);

        // AUTO FEEDBACK: If blocked by credit
        const creditBlock = result.order.validation_messages.find(v => v.code === 'credit_block' || (v.severity === 'blocked' && v.message.toLowerCase().includes('bloqueo')));
        if (creditBlock) {
          feedbackService.logAutomaticEvent({
            customer_id: order.customer_id,
            customer_name: order.customer_name,
            related_entity_type: "suggested_order",
            related_entity_id: order.id,
            event_type: "action_suggested",
            outcome: "opportunity_lost",
            reason_code: "credit_block",
            note: creditBlock.message
          });
        }
      }
    } catch (err) {
      console.error("Validation error:", err);
    } finally {
      setValidating(false);
    }
  };

  const handleConfirm = async () => {
    if (!order || order.validation_status !== 'valid') return;
    setConfirming(true);
    try {
      const result = await suggestedOrderService.confirmSuggestedOrder(order);
      if (result.ok) {
        // Log Confirmation
        feedbackLogger.logSuggestedOrderConfirmed(
          order.customer_id,
          order.customer_name,
          result.data?.id || `ORD-${Date.now()}`,
          order.total,
          order.id
        );
        navigate('/dashboard/pedidos');
      }
    } catch (err) {
      console.error("Confirmation error:", err);
    } finally {
      setConfirming(false);
    }
  };

  const handleDiscard = async () => {
    if (!order) return;
    setShowDiscardFeedback(true);
  };

  const handleConfirmDiscard = async (option: any) => {
    if (!order) return;
    await feedbackLogger.logSuggestedOrderDiscarded(order.customer_id, order.customer_name, order.id, option.code);
    navigate(-1);
  };

  const prepareWhatsapp = async () => {
    if (!order) return;
    const itemsList = order.lines
      .map(l => `- ${l.quantity} un. ${l.product_name}`)
      .join('\n');
    
    const messageBody = `Hola ${order.customer_name}, le preparé una sugerencia de pedido basada en su rotación habitual:\n\n${itemsList}\n\nTotal estimado: ${formatCurrency(order.total)}\n\n¿Desea que lo confirmemos o hacemos algún ajuste?`;
    
    // Create a local proactive message object
    const proactiveMsg: ProactiveMessage = {
      id: `SO-${order.id}`,
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      advisor_id: order.advisor_id,
      channel: "whatsapp",
      trigger_type: "suggested_order",
      status: "pending_review",
      priority: "medium",
      title: "Pedido Sugerido",
      reason: "Generado automáticamente desde sugerencia comercial.",
      message_body: messageBody,
      source: "suggested_order",
      related_entity_type: "suggested_order",
      related_entity_id: order.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setSelectedProactiveMessage(proactiveMsg);
  };

  const sendWhatsapp = () => {
    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    setShowWhatsappModal(false);
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-16 h-16 border-4 border-dismel-red/10 border-t-dismel-red rounded-full animate-spin mb-4" />
      <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Analizando Pedido Inteligente...</h3>
      <p className="text-[10px] font-bold text-text-muted mt-2 uppercase tracking-tight">Estamos calculando la mejor sugerencia para este cliente</p>
    </div>
  );

  if (!order) return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-white">
      <AlertTriangle size={48} className="text-dismel-red mb-4" />
      <h3 className="text-sm font-black uppercase tracking-widest text-text-main">No se pudo cargar la sugerencia</h3>
      <button onClick={() => navigate(-1)} className="mt-6 px-10 py-4 bg-dismel-red text-white rounded-2xl font-black uppercase tracking-widest text-[11px]">Regresar</button>
    </div>
  );

  const blockConfirmation = order.status === 'blocked' || order.validation_status !== 'valid' || order.lines.length === 0;

  return (
    <div className="flex flex-col h-full bg-app-bg relative overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-white border-b border-border-soft px-5 h-[80px] flex items-center gap-4 flex-shrink-0 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl bg-dismel-gray flex items-center justify-center text-text-main active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-dismel-red mb-0.5 line-clamp-1">{order.customer_name}</h2>
          <div className="flex items-center gap-2">
             <div className="px-2 py-0.5 bg-gray-100 rounded-md">
                <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">
                   Fuente: {order.source === 'customer_360' ? 'Cliente 360' : (order.source === 'repurchase' ? 'Recompra' : 'Historial')}
                </p>
             </div>
             <p className="text-[9px] font-bold text-text-muted">{order.id}</p>
          </div>
        </div>
        <div className="text-right flex items-center gap-4">
           <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Total Est.</p>
              <p className="text-sm font-black text-text-main leading-none">{formatCurrency(order.total)}</p>
           </div>
           {source !== 'manual' && (
              <button 
                onClick={handleDiscard}
                className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center active:scale-95 transition-transform"
              >
                 <Trash2 size={20} />
              </button>
           )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {/* Scoring Priority Alerts */}
        <div className="px-5 py-4 space-y-3">
          {showDiscardFeedback && (
            <QuickFeedbackPrompt
              title="¿Por qué descartas la sugerencia?"
              customerId={order.customer_id}
              customerName={order.customer_name}
              relatedEntityType="suggested_order"
              relatedEntityId={order.id}
              strategyType="suggested_order"
              options={[
                { label: "Cliente no necesita", value: "noneed", code: "no_need" },
                { label: "Precio", value: "price", code: "price" },
                { label: "Sin stock", value: "stock", code: "stock" },
                { label: "Cartera", value: "credit", code: "credit_block" },
                { label: "Pidió después", value: "later", code: "bad_timing" },
                { label: "Otro", value: "other", code: "other" }
              ]}
              onComplete={(opt) => handleConfirmDiscard(opt)}
              onSkip={() => setShowDiscardFeedback(false)}
            />
          )}

          {priorityScore?.signals.some(s => s.signal_type === 'credit_overdue') && (
             <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-3 shadow-sm">
                <AlertTriangle className="text-red-600 shrink-0" size={18} />
                <div>
                   <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Alerta de Cartera</p>
                   <p className="text-[11px] font-bold text-red-800 leading-tight mt-1">El cliente tiene mora. Sugerimos gestionar el pago antes de confirmar.</p>
                </div>
             </div>
          )}

          {priorityScore?.recommended_action_type === 'create_order' && (
             <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 shadow-sm">
                <Zap className="text-blue-600 shrink-0" size={18} fill="currentColor" />
                <p className="text-[11px] font-bold text-blue-800 leading-tight">Este pedido coincide con una oportunidad de recompra de alta confianza.</p>
             </div>
          )}
        </div>

        {/* Validation Summary Bar */}
        <div className={`px-5 py-3 flex items-center justify-between border-b ${
          order.validation_status === 'valid' ? 'bg-green-50 border-green-100' : 
          (order.validation_status === 'invalid' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100')
        }`}>
           <div className="flex items-center gap-3">
              {order.validation_status === 'valid' ? (
                <CheckCircle2 size={18} className="text-green-600" />
              ) : (
                <AlertTriangle size={18} className={order.validation_status === 'invalid' ? 'text-red-600' : 'text-orange-600'} />
              )}
              <p className={`text-[10px] font-black uppercase tracking-widest ${
                order.validation_status === 'valid' ? 'text-green-700' : 
                (order.validation_status === 'invalid' ? 'text-red-700' : 'text-orange-700')
              }`}>
                {order.validation_status === 'valid' ? 'Validado con éxito' : 
                 (order.validation_status === 'invalid' ? 'Requiere corrección' : 'Pendiente por validar')}
              </p>
           </div>
           {order.validation_status !== 'valid' && !validating && (
             <button 
               onClick={handleValidate}
               className="text-[10px] font-black text-dismel-red uppercase tracking-widest underline decoration-2 underline-offset-2"
             >
               Validar Ahora
             </button>
           )}
        </div>

        {/* Validation Messages */}
        <AnimatePresence>
          {order.validation_messages.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white border-b border-border-soft overflow-hidden"
            >
               <div className="p-4 space-y-2">
                  {order.validation_messages.map((msg, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl flex gap-3 ${
                      msg.severity === 'blocked' || msg.severity === 'error' ? 'bg-red-50 border border-red-100' : 'bg-orange-50 border border-orange-100'
                    }`}>
                       <AlertTriangle size={16} className={msg.severity === 'blocked' || msg.severity === 'error' ? 'text-red-600' : 'text-orange-600'} />
                       <div className="flex-1">
                          <p className="text-[10px] font-bold text-text-main leading-tight mb-1">{msg.message}</p>
                          {msg.suggested_fix && (
                            <p className="text-[9px] font-black text-text-muted uppercase tracking-tight italic">
                               Sugerencia: {msg.suggested_fix}
                            </p>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order Lines */}
        <div className="px-5 py-6">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Líneas Sugeridas</h3>
              <p className="text-[10px] font-bold text-text-muted">{order.lines.length} productos</p>
           </div>

           <div className="space-y-4">
              {order.lines.map((line) => (
                <motion.div 
                  layout
                  key={line.product_id}
                  className="bg-white rounded-[32px] border border-border-soft overflow-hidden shadow-sm shadow-black/5"
                >
                   <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex-1 min-w-0 pr-4">
                            <h4 className="text-xs font-black text-text-main leading-snug uppercase tracking-tight mb-1 line-clamp-2">{line.product_name}</h4>
                            <div className="flex items-center gap-2">
                               <p className="text-[9px] font-bold text-text-muted">{line.product_code}</p>
                               <span className="w-1 h-1 bg-border-soft rounded-full" />
                               <p className="text-[9px] font-bold text-text-muted uppercase">{line.brand || line.category}</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => handleDeleteLine(line.product_id)}
                           className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-text-muted/40 active:bg-red-50 active:text-red-500 transition-colors"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-5">
                         <div className="bg-app-bg p-3 rounded-2xl border border-border-soft">
                            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1 opacity-60">P. Unitario</p>
                            <p className="text-[11px] font-black text-text-main">{formatCurrency(line.unit_price)}</p>
                         </div>
                         <div className="bg-app-bg p-3 rounded-2xl border border-border-soft">
                            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1 opacity-60">Subtotal</p>
                            <p className="text-[11px] font-black text-text-main font-mono">{formatCurrency(line.subtotal)}</p>
                         </div>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5 px-1">
                               <div className={`w-1.5 h-1.5 rounded-full ${
                                 line.stock_status === 'available' ? 'bg-green-500' : (line.stock_status === 'low_stock' ? 'bg-orange-500' : 'bg-red-500')
                               }`} />
                               <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">
                                  {line.stock_status === 'available' ? 'Stock OK' : (line.stock_status === 'low_stock' ? `Bajo Stock (${line.available_stock})` : 'Agotado')}
                               </p>
                            </div>
                            <div className="bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100/50 inline-flex items-center gap-2">
                               <Zap size={10} className="text-blue-600" />
                               <p className="text-[9px] font-black text-blue-800 uppercase tracking-tight leading-none">{line.reason}</p>
                            </div>
                         </div>

                         <div className="flex items-center bg-gray-100 rounded-2xl p-1 shrink-0">
                            <button 
                              onClick={() => handleUpdateQuantity(line.product_id, -1)}
                              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-text-main shadow-sm active:scale-90 transition-transform"
                            >
                               <Minus size={16} />
                            </button>
                            <div className="w-12 text-center">
                               <span className="text-sm font-black text-text-main">{line.quantity}</span>
                            </div>
                            <button 
                              onClick={() => handleUpdateQuantity(line.product_id, 1)}
                              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-text-main shadow-sm active:scale-90 transition-transform"
                            >
                               <Plus size={16} />
                            </button>
                         </div>
                      </div>
                   </div>
                   
                   {/* Confidence indicator bottom border */}
                   <div className={`h-1.5 w-full ${
                     line.confidence === 'high' ? 'bg-green-500/30' : (line.confidence === 'medium' ? 'bg-blue-500/30' : 'bg-orange-500/30')
                   }`} />
                </motion.div>
              ))}
           </div>
           
           <button 
             onClick={() => setShowProductSearch(true)}
             className="w-full mt-6 h-16 border-2 border-dashed border-border-soft rounded-[32px] flex items-center justify-center gap-3 text-text-muted/60 active:bg-white transition-colors"
           >
              <Plus size={20} />
              <span className="text-[11px] font-black uppercase tracking-widest">Agregar Producto Manual</span>
           </button>
        </div>

        {/* Totals Summary */}
        <div className="px-5 mt-4 mb-8">
           <div className="bg-white rounded-[32px] p-6 border border-border-soft shadow-sm">
              <div className="space-y-3 mb-6">
                 <div className="flex justify-between items-center text-[11px] font-bold text-text-muted">
                    <span className="uppercase tracking-widest">Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                 </div>
                 <div className="flex justify-between items-center text-[11px] font-bold text-text-muted">
                    <span className="uppercase tracking-widest">Descuentos</span>
                    <span className="text-green-600">-{formatCurrency(order.discounts)}</span>
                 </div>
                 <div className="flex justify-between items-center text-[11px] font-bold text-text-muted">
                    <span className="uppercase tracking-widest">Impuestos (19%)</span>
                    <span>{formatCurrency(order.taxes)}</span>
                 </div>
              </div>
              <div className="pt-5 border-t border-dashed border-border-soft flex justify-between items-center">
                 <span className="text-[13px] font-black text-text-main uppercase tracking-[0.2em]">Total</span>
                 <span className="text-xl font-black text-dismel-red">{formatCurrency(order.total)}</span>
              </div>
           </div>
        </div>
      </div>

      {/* Absolute Footer Actions - positioned within the dashboard main area relative container */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-border-soft shadow-[0_-20px_40px_rgba(0,0,0,0.05)] z-[30]">
         {/* Credit Validation Banner */}
         {creditData && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowCreditModal(true)}
              className={`mb-4 px-4 py-3 rounded-2xl flex items-center justify-between border cursor-pointer active:scale-[0.98] transition-all ${
              creditData.summary.status === 'ok' ? 'bg-green-50 border-green-100 text-green-700' :
              creditData.summary.status === 'at_risk' ? 'bg-orange-50 border-orange-100 text-orange-700' :
              'bg-red-50 border-red-100 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                   creditData.summary.status === 'ok' ? 'bg-green-500' : 
                   creditData.summary.status === 'at_risk' ? 'bg-orange-500' : 'bg-red-600'
                 } text-white`}>
                    {creditData.summary.status === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                 </div>
                 <div>
                    <p className="text-[8px] font-black uppercase tracking-widest leading-none mb-1">
                      Cartera: {
                        creditData.summary.status === 'ok' ? 'Estado Óptimo' : 
                        creditData.summary.status === 'at_risk' ? 'Mora Detectada' : 
                        creditData.summary.status === 'blocked' ? 'BLOQUEADO' : 'Requiere Aprobación'
                      }
                    </p>
                    <p className="text-[10px] font-bold leading-none">
                      {creditData.summary.overdue_amount > 0 ? `Vencido: ${formatCurrency(creditData.summary.overdue_amount)}` : 'Sin facturas vencidas'}
                    </p>
                 </div>
              </div>
              <ChevronRight size={14} />
            </motion.div>
         )}

         <div className="flex gap-3">
            <button 
              onClick={prepareWhatsapp}
              className="w-14 h-14 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 active:scale-95 transition-transform shrink-0"
            >
               <MessageCircle size={24} />
            </button>
            <button 
              onClick={() => {
                if (creditData?.summary.is_blocked) {
                   setShowCreditModal(true);
                   return;
                }
                order.validation_status === 'pending' || order.validation_status === 'invalid' ? handleValidate() : handleConfirm();
              }}
              disabled={confirming || validating}
              className={`flex-1 h-14 rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-xl transition-all flex items-center justify-center gap-3 ${
                (order.validation_status === 'pending' && !creditData?.summary.is_blocked) ? 'bg-black text-white' : 
                (creditData?.summary.is_blocked ? 'bg-red-600 text-white' : 
                (order.validation_status === 'invalid' ? 'bg-orange-500 text-white' : 'bg-dismel-red text-white shadow-dismel-red/30'))
              }`}
            >
               {validating ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
               ) : confirming ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
               ) : (
                  <>
                    <span>
                      {creditData?.summary.is_blocked ? 'Cliente Bloqueado (Gestionar Cartera)' : 
                       (order.validation_status === 'pending' ? 'Validar Pedido' : 
                        (order.validation_status === 'invalid' ? 'Corregir y Re-validar' : 'Confirmar Pedido'))}
                    </span>
                    {!validating && !confirming && <ArrowRight size={18} />}
                  </>
               )}
            </button>
         </div>
      </div>

      <AnimatePresence>
        {showCreditModal && (
          <Customer360Modal 
            customerId={customerId} 
            initialTab="credit"
            onClose={() => {
              setShowCreditModal(false);
              // Reload credit data just in case something changed (e.g. promise registered)
              loadOrder();
            }} 
          />
        )}
      </AnimatePresence>

      {/* Whatsapp Modal */}
      <AnimatePresence>
         {selectedProactiveMessage && (
           <ProactiveMessageReviewModal 
             message={selectedProactiveMessage}
             onClose={() => setSelectedProactiveMessage(null)}
             onAction={(action) => {
               if (action === 'sent') {
                 // Optionally mark something
               }
               setSelectedProactiveMessage(null);
             }}
           />
         )}
         {showWhatsappModal && (
            <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6">
               <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden"
               >
                  <div className="p-8">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black uppercase tracking-tight">Preparar Mensaje</h3>
                        <button onClick={() => setShowWhatsappModal(false)} className="text-text-muted"><ShoppingCart size={20} /></button>
                     </div>
                     
                     <div className="space-y-4 mb-8">
                        <p className="text-[11px] font-black text-text-muted uppercase tracking-widest">Mensaje para {order.customer_name}</p>
                        <textarea 
                           value={whatsappMessage}
                           onChange={(e) => setWhatsappMessage(e.target.value)}
                           className="w-full h-40 bg-gray-50 border border-border-soft rounded-3xl p-5 text-sm font-bold text-text-main outline-none focus:border-dismel-red/30 transition-all no-scrollbar"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <button 
                           onClick={() => setShowWhatsappModal(false)}
                           className="h-14 bg-gray-100 text-text-muted rounded-[20px] font-black uppercase tracking-widest text-[11px]"
                        >
                           Cancelar
                        </button>
                        <button 
                           onClick={sendWhatsapp}
                           className="h-14 bg-green-500 text-white rounded-[20px] font-black uppercase tracking-widest text-[11px] shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                        >
                           <Send size={16} />
                           Enviar
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Product Search Modal */}
      <AnimatePresence>
         {showProductSearch && (
            <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-md flex flex-col justify-end sm:justify-start sm:pt-20">
               <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  className="bg-white w-full max-w-lg mx-auto rounded-t-[40px] sm:rounded-[40px] flex flex-col max-h-[90vh] overflow-hidden"
               >
                  <div className="p-6 border-b border-border-soft flex-shrink-0">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black uppercase tracking-tight">Buscar Productos</h3>
                        <button onClick={() => setShowProductSearch(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-text-muted transition-transform active:scale-90">
                           <Trash2 size={16} />
                        </button>
                     </div>
                     
                     <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                           autoFocus
                           type="text" 
                           placeholder="Nombre, SKU o Categoría..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="w-full bg-gray-50 border border-border-soft rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-dismel-red/30 transition-all font-sans"
                        />
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-0">
                     <div className="space-y-4 py-6">
                        {filteredProducts.map((p) => (
                           <motion.div 
                              key={p.id}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleAddProduct(p)}
                              className="p-4 bg-white border border-border-soft rounded-3xl flex items-center gap-4 cursor-pointer hover:border-dismel-red/20 active:bg-gray-50 transition-all shadow-sm"
                           >
                              <div className="w-12 h-12 bg-dismel-gray rounded-2xl flex items-center justify-center text-text-muted shrink-0">
                                 <Plus size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <h4 className="text-xs font-black text-text-main line-clamp-1 uppercase tracking-tight">{p.name}</h4>
                                 <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">{p.sku}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">{p.category}</span>
                                 </div>
                              </div>
                              <div className="text-right shrink-0">
                                 <p className="text-xs font-black text-dismel-red">{formatCurrency(p.price)}</p>
                                 <p className="text-[8px] font-bold text-green-600 uppercase">Stock: {p.stock}</p>
                              </div>
                           </motion.div>
                        ))}

                        {filteredProducts.length === 0 && (
                           <div className="py-20 text-center">
                              <ShoppingCart size={48} className="mx-auto text-gray-100 mb-4" />
                              <p className="text-sm font-black text-text-muted uppercase tracking-widest">No hay resultados</p>
                              <p className="text-[10px] text-text-muted font-bold mt-2">Prueba con términos más generales</p>
                           </div>
                        )}
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
