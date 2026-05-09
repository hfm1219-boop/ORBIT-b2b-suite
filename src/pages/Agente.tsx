import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Target, Clock, AlertTriangle, Send, X, Bot, Mic, Sparkles, Settings, Trash2, Sliders } from "lucide-react";
import RepurchaseSuggestionsSection from "../components/repurchase/RepurchaseSuggestionsSection";

export default function Agente() {
  const [showAIChat, setShowAIChat] = useState(true); // Persist chat view as in screenshot
  const [messages, setMessages] = useState([
    { role: 'ai', text: `🚀 *Resumen de Cumplimiento Diario*

• *Cuota Mensual:* $99.753.875
• *Venta a la Fecha:* $11.859.429
• *Cumplimiento Actual:* 11.89%

📅 *Avance Ideal del Mes:* 26.92%
(7 de 26 días hábiles)
🎯 *Meta Ideal a Hoy:* $26.856.813
(26.92%)

📈 *Proyección al Cierre:*
$44.049.307 (44.16% de la cuota)

⚠️ Estás por debajo del ritmo ideal.
¡Ánimo, aún quedan 19 días!` }
  ]);
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleAddToOrder = (s: any) => {
    // Pass data via localStorage as requested for incremental architecture
    localStorage.setItem('pendingOrderCustomer', JSON.stringify({ id: s.customer_id, name: s.customer_name }));
    localStorage.setItem('pendingOrderProduct', JSON.stringify({
      id: s.product_id,
      name: s.product_name,
      price: s.current_price,
      stock: s.available_qty,
      category: s.category || 'Recompra',
      brand: 'Dismel',
      tax: 19
    }));
    navigate('/dashboard/clientes');
  };

  const handleOpenCustomer = (customerId: string) => {
    localStorage.setItem('openCustomerId', customerId);
    navigate('/dashboard/clientes');
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-app-bg font-sans">
      {/* Header Red Section */}
      <div className="bg-dismel-red p-6 pt-10 text-white relative flex-shrink-0">
        <div className="flex flex-col mb-6">
          <h2 className="text-xl font-black uppercase tracking-tight">Agente IA</h2>
          <p className="text-[10px] uppercase font-black tracking-widest opacity-70">Asistente Comercial Conectado</p>
        </div>
        
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 h-9 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/20 transition-all active:scale-95">
            <Sliders size={12} /> Consultas
          </button>
          <button className="flex items-center gap-1.5 px-4 h-9 bg-black/20 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-transparent transition-all active:scale-95">
            <Trash2 size={12} /> Borrar
          </button>
          <div className="flex-1"></div>
          <button className="w-10 h-10 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center transition-all active:scale-95">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Advisor Info Section */}
      <div className="p-5 bg-white border-b border-border-soft flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-dismel-red-soft rounded-2xl flex items-center justify-center text-dismel-red text-xs font-black">SA</div>
          <div>
            <h3 className="font-black text-text-main text-sm uppercase leading-none">Asesor: Santiago</h3>
            <p className="text-[9px] font-black text-text-muted mt-1 uppercase tracking-widest">Consultas en tiempo real vía Odoo</p>
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 space-y-5 py-6 no-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] rounded-[24px] p-4 shadow-sm border whitespace-pre-wrap text-[13px] leading-relaxed relative ${
              msg.role === 'ai' 
                ? 'bg-ai-soft border-ai-border text-text-main rounded-tl-none' 
                : 'bg-dismel-red-soft border-dismel-red/10 text-text-main rounded-tr-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Suggested Questions Area */}
      <div className="px-5 pb-4 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        {["¿Mis ventas de hoy?", "Cartera vencida", "Top pedidos"].map(s => (
          <button key={s} className="px-4 py-2 bg-white border border-border-soft rounded-full text-[10px] font-black uppercase tracking-widest text-text-main shadow-sm active:scale-95 transition-all">
            {s}
          </button>
        ))}
      </div>

      {/* Input Section */}
      <div className="p-4 px-5 bg-white border-t border-border-soft flex-shrink-0 pb-10">
        <div className="h-14 bg-dismel-gray flex items-center pr-2 pl-5 rounded-full border border-border-soft shadow-sm overflow-hidden focus-within:bg-white focus-within:ring-4 focus-within:ring-dismel-red/5 transition-all">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Mensaje para IA..."
            className="flex-1 py-4 bg-transparent outline-none text-[11px] font-bold uppercase tracking-widest placeholder:text-text-muted/40"
          />
          <button 
            onClick={handleSend}
            className="w-10 h-10 bg-dismel-red text-white rounded-full flex items-center justify-center shadow-lg shadow-dismel-red/30 active:scale-90 transition-all"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
