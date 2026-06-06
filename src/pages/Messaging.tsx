import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  ChevronRight, 
  Zap, 
  Clock, 
  CheckCircle2, 
  User,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { customerService } from '../services/customerService';
import { proactiveMessageService } from '../services/proactiveMessageService';
import { Customer, ProactiveMessage } from '../types';
import Customer360Modal from '../components/customers/Customer360Modal';

export default function MessagingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  const activeCustomer = customers.find(c => c.id === activeChatId);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const customersData = await customerService.getAdvisorCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error("Error loading messaging data", error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.commercial_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.includes(searchQuery)
  );

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    // Visually "send" the message (mock)
    setMessageText("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-dismel-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg pb-32">
      <AnimatePresence mode="wait">
        {!activeChatId ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Header */}
            <header className="bg-white px-6 pt-12 pb-6 sticky top-0 z-40 shadow-sm shadow-black/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-black text-text-main tracking-tight italic uppercase">Mensajería</h1>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Gestión de Clientes</p>
                </div>
                <div className="w-12 h-12 bg-dismel-red-soft text-dismel-red rounded-2xl flex items-center justify-center">
                  <MessageCircle size={24} />
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="text"
                  placeholder="Buscar chat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 bg-dismel-gray border-none rounded-2xl pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-dismel-red/10 transition-all shadow-inner"
                />
              </div>
            </header>

            <div className="p-5 space-y-3">
              {filteredCustomers.map((customer, idx) => (
                <div 
                  key={customer.id} 
                  onClick={() => setActiveChatId(customer.id)}
                  className="bg-white p-4 rounded-[28px] border border-border-soft flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 bg-dismel-gray text-text-muted rounded-[20px] flex items-center justify-center font-black text-lg relative">
                      {customer.commercial_name.charAt(0)}
                      {idx < 2 && (
                         <div className="absolute -top-1 -right-1 w-5 h-5 bg-dismel-red text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                           {idx + 1}
                         </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h5 className="text-[13px] font-black text-text-main uppercase truncate pr-2">{customer.commercial_name}</h5>
                        <span className="text-[9px] font-black text-text-muted uppercase">10:45 AM</span>
                      </div>
                      <p className="text-[11px] font-bold text-text-muted truncate italic">
                        {idx === 0 ? "¡Oiga! ¿Cuándo me trae el pedido?" : "Gracias por la visita de hoy."}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-text-muted opacity-30 group-hover:opacity-100 transition-opacity ml-2" />
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-screen"
          >
            {/* Chat Header */}
            <header className="bg-white px-5 pt-12 pb-4 flex items-center gap-4 border-b border-border-soft sticky top-0 z-40">
              <button 
                onClick={() => setActiveChatId(null)}
                className="w-10 h-10 bg-dismel-gray rounded-xl flex items-center justify-center text-text-main"
              >
                <ChevronRight size={20} className="rotate-180" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-[13px] font-black text-text-main uppercase truncate leading-tight">
                  {activeCustomer?.commercial_name}
                </h2>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                   <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">En Línea Now</p>
                </div>
              </div>
              <button className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                 <MessageSquare size={18} />
              </button>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-24">
               <div className="flex justify-center mb-6">
                  <span className="bg-gray-100 text-[9px] font-black text-text-muted px-4 py-1.5 rounded-full uppercase tracking-widest">
                    Hoy
                  </span>
               </div>

               <div className="flex flex-col gap-1 items-start">
                  <div className="max-w-[80%] bg-white p-4 rounded-t-[24px] rounded-br-[24px] border border-border-soft text-[12px] font-bold text-text-main shadow-sm italic">
                    ¡Buenos días! ¿Tienen disponibilidad de Ron Viejo de Caldas 
                    para entregar este fin de semana?
                  </div>
                  <span className="text-[8px] font-black text-text-muted uppercase ml-2">10:45 AM</span>
               </div>

               <div className="flex flex-col gap-1 items-end">
                  <div className="max-w-[80%] bg-dismel-red text-white p-4 rounded-t-[24px] rounded-bl-[24px] text-[12px] font-bold shadow-lg shadow-dismel-red/20 leading-relaxed">
                    ¡Hola! Sí, por supuesto. Nuestro sistema me indica que tienes un 
                    pedido sugerido pendiente por validar. Si lo confirmamos ahora mismo, 
                    te llega el sábado.
                  </div>
                  <div className="flex items-center gap-1 mr-2">
                    <span className="text-[8px] font-black text-text-muted uppercase">11:02 AM</span>
                    <div className="flex text-blue-500">
                       <CheckCircle2 size={10} fill="currentColor" />
                       <CheckCircle2 size={10} fill="currentColor" className="-ml-1" />
                    </div>
                  </div>
               </div>
            </div>

            {/* Chat Input */}
            <div className="fixed bottom-[96px] left-0 right-0 p-4 bg-white border-t border-border-soft flex items-center gap-3">
               <button className="w-12 h-12 bg-dismel-gray text-text-muted rounded-2xl flex items-center justify-center">
                  <Filter size={20} className="rotate-90" />
               </button>
               <input 
                 type="text"
                 placeholder="Escribe un mensaje..."
                 value={messageText}
                 onChange={(e) => setMessageText(e.target.value)}
                 className="flex-1 h-12 bg-dismel-gray border-none rounded-2xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-dismel-red/10 transition-all"
               />
               <button 
                 onClick={handleSendMessage}
                 className="w-12 h-12 bg-dismel-red text-white rounded-2xl flex items-center justify-center shadow-lg shadow-dismel-red/20"
               >
                  <ChevronRight size={24} />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
