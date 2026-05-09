import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, MoreVertical, Send, Paperclip, Mic, Image as ImageIcon, Bot, CheckCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getCopilotSuggestion } from "../services/geminiService";

const MOCK_MESSAGES = [
  { id: "1", body: "Hola, ¿tienen disponibilidad de Arroz Diana de 1kg?", sender: "client", timestamp: new Date(Date.now() - 100000).toISOString(), type: "text", status: "read" },
  { id: "2", body: "Hola! Déjame revisar el inventario para tu zona.", sender: "advisor", timestamp: new Date(Date.now() - 50000).toISOString(), type: "text", status: "read" },
];

export default function ChatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (text: string, sender: 'advisor' | 'client' = 'advisor') => {
    if (!text.trim()) return;
    const newMessage = {
      id: Math.random().toString(36).substr(2, 9),
      body: text,
      sender,
      timestamp: new Date().toISOString(),
      type: "text",
      status: "sending"
    };
    setMessages(prev => [...prev, newMessage]);
    setInputText("");
    setSuggestion(null);

    // Simulate sent status
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: "sent" } : m));
    }, 1000);
  };

  const loadSuggestion = async () => {
    setIsSuggesting(true);
    const lastClientMsg = [...messages].reverse().find(m => m.sender === 'client')?.body || "";
    const history = messages.map(m => ({ role: m.sender === 'client' ? 'user' : 'model', content: m.body }));
    
    const result = await getCopilotSuggestion(history, lastClientMsg);
    setSuggestion(result);
    setIsSuggesting(false);
  };

  return (
    <div className="absolute inset-0 bg-[#E5DDD5] flex flex-col z-50">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-3 flex-shrink-0">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft className="w-6 h-6 text-dismel-red" />
        </button>
        <div className="w-10 h-10 rounded-full bg-dismel-gray flex-shrink-0 flex items-center justify-center font-bold text-gray-400">
          S
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-dismel-dark truncate">Supermercado El Sol</h3>
          <p className="text-[10px] text-green-500 font-bold uppercase">En línea</p>
        </div>
        <MoreVertical className="w-5 h-5 text-gray-400" />
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"
      >
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`max-w-[80%] p-3 rounded-2xl shadow-sm relative ${
              msg.sender === 'advisor' 
                ? "bg-white self-end rounded-tr-none text-dismel-dark" 
                : "bg-dismel-dark text-white self-start rounded-tl-none"
            }`}
          >
            <p className="text-sm leading-relaxed">{msg.body}</p>
            <div className={`flex items-center gap-1 mt-1 justify-end ${msg.sender === 'advisor' ? "text-gray-400" : "text-white/50"}`}>
              <span className="text-[9px] font-medium">
                {format(new Date(msg.timestamp), "HH:mm")}
              </span>
              {msg.sender === 'advisor' && (
                <CheckCheck className={`w-3 h-3 ${msg.status === 'read' ? "text-blue-500" : ""}`} />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Copilot Suggestion Bar */}
      <AnimatePresence>
        {(suggestion || isSuggesting) && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="px-4 py-1"
          >
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-dismel-red/20">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-dismel-red" />
                  <span className="text-[10px] font-black uppercase text-dismel-red tracking-widest">Sugerencia Copiloto</span>
                </div>
                <button onClick={() => setSuggestion(null)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              {isSuggesting ? (
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-dismel-red rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-dismel-red rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-dismel-red rounded-full animate-bounce delay-150"></div>
                </div>
              ) : (
                <p className="text-xs text-gray-700 leading-relaxed italic mb-3">"{suggestion}"</p>
              )}
              {!isSuggesting && (
                <button 
                  onClick={() => handleSend(suggestion!)}
                  className="w-full bg-dismel-red/10 text-dismel-red py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-dismel-red hover:text-white transition-colors"
                >
                  Usar Sugerencia
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <footer className="bg-white p-4 flex items-center gap-3 border-t border-gray-100 flex-shrink-0">
        <button 
          onClick={loadSuggestion}
          className="w-10 h-10 rounded-full bg-dismel-red/10 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
        >
          <Bot className="w-5 h-5 text-dismel-red" />
        </button>
        <div className="flex-1 bg-dismel-gray rounded-3xl flex items-center px-4 py-1">
          <input
            type="text"
            placeholder="Mensaje..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend(inputText)}
            className="flex-1 bg-transparent border-none py-2 text-sm outline-none"
          />
          <Paperclip className="w-5 h-5 text-gray-400 ml-2" />
          <ImageIcon className="w-5 h-5 text-gray-400 ml-2" />
        </div>
        <button 
          onClick={() => inputText ? handleSend(inputText) : null}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            inputText ? "bg-dismel-red rotate-0 shadow-lg shadow-dismel-red/30" : "bg-gray-200 -rotate-12"
          }`}
        >
          {inputText ? <Send className="w-5 h-5 text-white ml-0.5" /> : <Mic className="w-5 h-5 text-gray-600" />}
        </button>
      </footer>
    </div>
  );
}
