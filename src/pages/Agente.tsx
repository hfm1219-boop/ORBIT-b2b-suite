import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Bot, 
  Sparkles, 
  ShoppingCart, 
  Users, 
  Target, 
  ChevronRight, 
  Zap, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  RotateCcw,
  BarChart3,
  TrendingUp,
  Brain,
  ThumbsUp,
  ThumbsDown,
  Info,
  History,
  Trash2,
  Settings,
  Sliders,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { feedbackService } from "../services/feedbackService";
import { useNavigate } from "react-router-dom";
import { parseAgentFeedback } from "../utils/parseAgentFeedback";
import { ParsedAgentFeedback, AgentFeedbackContext, CommercialPerformanceSummary } from "../types";
import AgentConfirmationChips from "../components/agent/AgentConfirmationChips";
import AgentPendingFeedback from "../components/agent/AgentPendingFeedback";
import { commercialPerformanceService } from "../services/commercialPerformanceService";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: {
    label: string;
    type: 'route' | 'order' | 'customer';
    payload?: any;
  }[];
  isFeedback?: boolean;
  parsedData?: ParsedAgentFeedback;
}

export default function Agente() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hola! Soy tu copiloto de inteligencia comercial. ¿En qué te puedo ayudar hoy?\n\n🚀 *Resumen de Cumplimiento Diario*\n• *Cuota Mensual:* $99.753.875\n• *Venta a la Fecha:* $11.859.429\n• *Cumplimiento Actual:* 11.89%\n\n📅 *Avance Ideal del Mes:* 26.92%\n(7 de 26 días hábiles)\n🎯 *Meta Ideal a Hoy:* $26.856.813\n(26.92%)\n\n📈 *Proyección al Cierre:*\n$44.049.307 (44.16% de la cuota)\n\n⚠️ Estás por debajo del ritmo ideal.\n¡Ánimo, aún quedan 19 días!",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'feedback'>('chat');
  const [stats, setStats] = useState<any>(null);
  const [performance, setPerformance] = useState<CommercialPerformanceSummary | null>(null);
  const [knownCustomers, setKnownCustomers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeTab === 'feedback') {
      loadFeedbackStats();
    }
    loadKnownCustomers();
  }, [activeTab]);

  const loadKnownCustomers = async () => {
    // Demo customers
    setKnownCustomers([
      { id: '1', name: 'LICORERA DON PEPE SAS' },
      { id: '2', name: 'HOTEL CARIBE BUSINESS' },
      { id: '3', name: 'BAR SEVEN NIGHTS' },
      { id: '4', name: 'RESTAURANTE AZUL GOURMET' },
      { id: '5', name: 'TIENDA LA 10' }
    ]);
  };

  const loadFeedbackStats = async () => {
    const [statsResp, perfResp] = await Promise.all([
      feedbackService.getFeedbackStats(),
      commercialPerformanceService.getCommercialPerformance('week')
    ]);

    if (statsResp.ok) {
      setStats(statsResp.data);
    }
    if (perfResp.ok && perfResp.performance) {
      setPerformance(perfResp.performance);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const currentText = inputValue.trim();
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // 1. Process as potentially feedback
    const context: AgentFeedbackContext = {
      known_customers: knownCustomers,
    };

    const parsed = parseAgentFeedback(currentText, context);

    // Simulate AI Response
    setTimeout(async () => {
      let aiContent = "";
      let aiActions: any[] = [];
      let isFeedbackMsg = false;

      if (parsed.confidence === "high" || (parsed.confidence === "medium" && !parsed.needs_confirmation)) {
        // Automatically register feedback
        const feedbackPayload = {
          customer_id: parsed.customer_id,
          customer_name: parsed.customer_name,
          event_type: parsed.event_type || "agent_feedback_captured",
          outcome: parsed.outcome,
          customer_response: parsed.customer_response,
          reason_code: parsed.reason_code,
          strategy_type: parsed.strategy_type,
          related_entity_type: parsed.related_entity_type,
          note: parsed.note,
          order_total: parsed.order_total,
          payment_amount: parsed.payment_amount,
          promise_to_pay_date: parsed.promise_to_pay_date,
          next_follow_up_date: parsed.next_follow_up_date,
          value: parsed.value,
          source: "agent" as any
        };

        await feedbackService.captureAgentFeedback(feedbackPayload);
        
        aiContent = `Registrado: ${parsed.customer_name}. ${parsed.note}.`;
        if (parsed.next_follow_up_date) {
            aiContent += ` Haré seguimiento el ${parsed.next_follow_up_date}.`;
        }
        isFeedbackMsg = true;
      } else if (parsed.needs_confirmation) {
          aiContent = parsed.suggested_question || "Entiendo que quieres registrar feedback. ¿Me confirmas los detalles?";
          isFeedbackMsg = true;
      } else {
        // General query fallthrough
        aiContent = "He analizado tus datos. Veo que tienes 3 clientes con pedidos sugeridos pendientes de validación. ¿Te gustaría revisarlos ahora para incluirlos en tu ruta?";
        aiActions = [
          { label: "Ver pedidos sugeridos", type: 'order' },
          { label: "Ver mi ruta de hoy", type: 'route' }
        ];
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString(),
        actions: aiActions,
        isFeedback: isFeedbackMsg,
        parsedData: parsed
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleFeedbackConfirmation = async (msgId: string, value: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !msg.parsedData) return;

    if (value === 'yes') {
      // Process the feedback as is
      await feedbackService.captureAgentFeedback({
        ...msg.parsedData,
        source: 'agent' as any,
        event_type: msg.parsedData.event_type || "agent_feedback_captured"
      } as any);

      setMessages(prev => prev.map(m => 
        m.id === msgId 
          ? { ...m, content: `¡Registrado! He capturado el feedback para ${msg.parsedData?.customer_name}.`, isFeedback: false, parsedData: undefined } 
          : m
      ));
    } else if (value === 'no') {
      setMessages(prev => prev.map(m => 
        m.id === msgId 
          ? { ...m, content: "Entendido, no he registrado el feedback. ¿En qué te puedo ayudar?", isFeedback: false, parsedData: undefined } 
          : m
      ));
    } else if (value.startsWith('customer_')) {
      // Handle customer selection from prompt... (simplified for demo)
    }
    // More complex flows would go here
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: "Chat reiniciado. ¿En qué puedo ayudarte?",
      timestamp: new Date().toISOString()
    }]);
  };

  return (
    <div className="flex flex-col h-full bg-app-bg overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-dismel-red px-5 py-6 text-white relative flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
              <Bot size={22} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight leading-none">IA Comercial</h2>
              <p className="text-[7px] uppercase font-black tracking-widest opacity-70 mt-1">Asistente Inteligente • Online</p>
            </div>
          </div>
          
          <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-sm">
             <button 
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-white text-dismel-red shadow-sm' : 'text-white/60'}`}
             >
                Chat
             </button>
             <button 
              onClick={() => setActiveTab('feedback')}
              className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'feedback' ? 'bg-white text-dismel-red shadow-sm' : 'text-white/60'}`}
             >
                Feedback
             </button>
          </div>
        </div>

        <div className="flex gap-2">
           <button className="flex items-center gap-1.5 px-3 h-7 bg-white/10 rounded-xl text-[7px] font-black uppercase tracking-widest border border-white/20 transition-all active:scale-95 leading-none shadow-sm">
              <Sliders size={10} /> Consultas
           </button>
           <button 
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 h-7 bg-white/10 rounded-xl text-[7px] font-black uppercase tracking-widest border border-white/20 transition-all active:scale-95 leading-none shadow-sm"
           >
              <Trash2 size={10} /> Limpiar
           </button>
           <div className="flex-1"></div>
           <button className="w-7 h-7 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center transition-all active:scale-95 shadow-sm">
              <Settings size={14} />
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-app-bg">
        {activeTab === 'chat' ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 no-scrollbar pb-32">
            <AgentPendingFeedback />
            
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] sm:max-w-[70%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  <div className={`p-4 rounded-[28px] shadow-sm border whitespace-pre-wrap text-[13px] leading-relaxed relative ${
                    msg.role === 'user' 
                      ? 'bg-dismel-red text-white border-transparent rounded-tr-none' 
                      : 'bg-white border-border-soft text-text-main rounded-tl-none'
                  }`}>
                    {msg.content}
                    
                    {msg.isFeedback && msg.parsedData && (
                      <div className="mt-4">
                        <AgentConfirmationChips 
                          options={msg.parsedData.needs_confirmation ? msg.parsedData.suggested_quick_options?.map(o => ({ ...o, color: 'bg-indigo-500' })) : undefined}
                          onSelect={(val) => handleFeedbackConfirmation(msg.id, val)}
                          onCancel={() => handleFeedbackConfirmation(msg.id, 'no')}
                        />
                      </div>
                    )}

                    {msg.actions && (
                      <div className="mt-4 flex flex-col gap-2">
                        {msg.actions.map((action, i) => (
                          <button 
                            key={i}
                            onClick={() => {
                              if (action.type === 'order') navigate('/dashboard/pedidos');
                              if (action.type === 'route') navigate('/dashboard/hoy');
                              if (action.type === 'customer') navigate('/dashboard/clientes');
                            }}
                            className={`font-black text-[9px] uppercase tracking-widest py-3 px-4 rounded-xl flex items-center justify-between group transition-all ${
                              msg.role === 'user' 
                                ? 'bg-white/20 text-white border border-white/20' 
                                : 'bg-gray-50 text-dismel-red border border-border-soft'
                            }`}
                          >
                            {action.label}
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className={`text-[7px] font-black uppercase tracking-widest mt-1.5 opacity-30 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-border-soft p-4 rounded-[28px] flex items-center gap-1 shadow-sm">
                  <div className="w-1 h-1 bg-dismel-red rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1 h-1 bg-dismel-red rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1 h-1 bg-dismel-red rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-8 no-scrollbar bg-gray-50/50">
             <div className="space-y-6">
                <div>
                   <h3 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <BarChart3 size={12} className="text-dismel-red" />
                      Feedback Inteligente
                   </h3>
                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-5 rounded-[32px] border border-border-soft shadow-sm">
                         <div className="w-8 h-8 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-3">
                            <CheckCircle2 size={16} />
                         </div>
                         <p className="text-[20px] font-black text-text-main leading-none">{performance?.total_orders_created || stats?.total_captured || 14}</p>
                         <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mt-2">Pedidos Cerrados</p>
                      </div>
                      <div className="bg-white p-5 rounded-[32px] border border-border-soft shadow-sm">
                         <div className="w-8 h-8 bg-dismel-red/5 text-dismel-red rounded-xl flex items-center justify-center mb-3">
                            <DollarSign size={16} />
                         </div>
                         <p className="text-[20px] font-black text-dismel-red leading-none">
                            {performance?.total_sales_value 
                              ? `$${(performance.total_sales_value / 1000000).toFixed(1)}M` 
                              : stats?.suggested_order_hit_rate || '74'}
                         </p>
                         <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mt-2">Venta Proactiva</p>
                      </div>
                   </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-black rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-dismel-red/10 blur-3xl" />
                   
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-dismel-red rounded-2xl flex items-center justify-center">
                         <Brain size={20} className="text-white" />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-tight">Aprendizaje Continuo</h4>
                   </div>
                   
                   <p className="text-[11px] font-bold text-gray-400 mb-8 leading-relaxed italic opacity-90 border-l-2 border-dismel-red pl-4">
                      "Tu feedback sobre los rechazos por precio en la Zona Norte ha permitido a la IA ajustar los pedidos sugeridos, reduciendo devoluciones en un 12%."
                   </p>

                   <div className="space-y-4">
                      <h5 className="text-[7px] font-black text-gray-500 uppercase tracking-[0.3em]">Top Objeciones de la Semana</h5>
                      {(stats?.top_objections || [
                        { label: 'Precio', count: 8 },
                        { label: 'Competencia', count: 5 },
                        { label: 'Inventario', count: 3 }
                      ]).map((obj: any, i: number) => (
                        <div key={i} className="flex items-center justify-between group">
                           <div className="flex items-center gap-3">
                              <span className="text-[8px] font-black text-gray-600 w-3">{i + 1}</span>
                              <span className="text-[10px] font-black uppercase tracking-tight group-hover:text-dismel-red transition-colors">{obj.label}</span>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                 <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(obj.count / 14) * 100}%` }}
                                    className="h-full bg-dismel-red"
                                 />
                              </div>
                              <span className="text-[9px] font-black text-white w-4 text-right">{obj.count}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div>
                   <h4 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <History size={12} className="text-text-muted" />
                      Eventos Recientes
                   </h4>
                   <div className="space-y-3">
                      {(stats?.recent_events || [
                        { customer_name: 'Tienda La Esperanza', time: 'Hace 2h', title: 'Feedback de Visita', type: 'message' },
                        { customer_name: 'Licorera Don Pepe', time: 'Hace 5h', title: 'Pedido Sugerido', type: 'order' },
                        { customer_name: 'Bar Seven Nights', time: 'Ayer', title: 'Gestión Cartera', type: 'wallet' }
                      ]).map((event: any, i: number) => (
                        <div key={i} className="bg-white p-4 rounded-[28px] border border-border-soft flex items-center gap-4 hover:shadow-md transition-shadow active:scale-[0.98]">
                           <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-text-muted shrink-0">
                              {event.type === 'order' ? <ShoppingCart size={16} /> : event.type === 'wallet' ? <DollarSign size={16} /> : <MessageSquare size={16} />}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-text-main uppercase tracking-tight truncate">{event.title}</p>
                              <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mt-0.5 truncate">{event.customer_name} • {event.time}</p>
                           </div>
                           <div className="bg-green-50 text-green-600 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                              <CheckCircle2 size={14} />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Input Area (Only for chat) */}
      {activeTab === 'chat' && (
        <div className="p-4 px-5 bg-white border-t border-border-soft shrink-0 pb-8 sm:pb-4">
          <div className="bg-dismel-gray rounded-full flex items-center gap-2 p-1.5 pl-5 border border-border-soft shadow-sm focus-within:bg-white focus-within:ring-4 focus-within:ring-dismel-red/5 transition-all">
            <button className="text-text-muted/40 hover:text-dismel-red transition-colors shrink-0">
              <Sparkles size={20} />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Mensaje para IA comercial..."
              className="flex-1 bg-transparent py-4 text-[11px] font-black uppercase tracking-widest outline-none placeholder:text-text-muted/30"
            />
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="w-12 h-12 bg-dismel-red text-white rounded-full flex items-center justify-center shadow-lg shadow-dismel-red/20 active:scale-90 transition-all disabled:opacity-50 shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
