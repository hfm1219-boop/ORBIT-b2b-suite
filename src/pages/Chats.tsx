import React, { useState } from "react";
import { Search, Plus, CheckCheck } from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const MOCK_CHATS = [
  {
    id: "c1",
    customerName: "Supermercado El Sol",
    customerNumber: "3104567890",
    lastMessage: "¿Tienen inventario de Arroz Diana de 1kg?",
    unreadCount: 2,
    timestamp: new Date().toISOString(),
    status: "online",
    pnId: "PN123456"
  },
  {
    id: "c2",
    customerName: "Tienda Don Pepe",
    customerNumber: "3209876543",
    lastMessage: "Pedido entregado, gracias.",
    unreadCount: 0,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: "offline",
    pnId: "PN123456"
  }
];

export default function Chats() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search Bar */}
      <div className="px-6 py-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dismel-gray rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-dismel-red/20"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4">
        {MOCK_CHATS.map((chat) => (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/dashboard/chats/${chat.id}`)}
            className="p-3 mb-2 flex items-center gap-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors"
          >
            {/* Avatar */}
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-dismel-gray flex items-center justify-center font-bold text-gray-400 overflow-hidden">
                {chat.customerName.charAt(0)}
              </div>
              {chat.status === "online" && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
              )}
            </div>

            {/* Preview */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-gray-800 truncate">{chat.customerName}</h3>
                <span className="text-[10px] text-gray-400 font-medium">
                  {format(new Date(chat.timestamp), "HH:mm", { locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {chat.unreadCount === 0 && <CheckCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                <p className={`text-xs truncate ${chat.unreadCount > 0 ? "text-dismel-dark font-bold" : "text-gray-500"}`}>
                  {chat.lastMessage}
                </p>
              </div>
            </div>

            {/* Unread Badge */}
            {chat.unreadCount > 0 && (
              <div className="w-5 h-5 rounded-full bg-dismel-red flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{chat.unreadCount}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Floating Action Button */}
      <button className="absolute bottom-6 right-6 w-14 h-14 bg-dismel-red rounded-full shadow-2xl shadow-dismel-red/40 flex items-center justify-center text-white active:scale-90 transition-transform z-10">
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}
