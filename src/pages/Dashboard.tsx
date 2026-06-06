import React from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { Home, ShoppingBasket, Users, Bot, MapPin, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Agente from "./Agente";
import Pedidos from "./Pedidos";
import Clientes from "./Clientes";
import Hoy from "./Hoy";
import SuggestedOrder from "./SuggestedOrder";
import Messaging from "./Messaging";

export default function Dashboard() {
  const tabs = [
    { name: "Hoy", path: "/dashboard/hoy", icon: Home },
    { name: "Mensajes", path: "/dashboard/mensajes", icon: MessageCircle },
    { name: "Clientes", path: "/dashboard/clientes", icon: Users },
    { name: "Pedidos", path: "/dashboard/pedidos", icon: ShoppingBasket },
    { name: "Agente", path: "/dashboard/agente", icon: Bot },
  ];

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 min-h-0 relative bg-app-bg">
        <div className="h-full w-full overflow-hidden">
          <Routes>
            <Route path="hoy" element={<Hoy />} />
            <Route path="mensajes" element={<Messaging />} />
            <Route path="agente" element={<Agente />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="suggested-order" element={<SuggestedOrder />} />
            <Route path="pedido-sugerido" element={<SuggestedOrder />} />
            <Route index element={<Hoy />} />
            <Route path="*" element={<Navigate to="/dashboard/hoy" replace />} />
          </Routes>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="h-[80px] bg-white border-t border-border-soft px-4 flex items-center justify-between pb-6 flex-shrink-0 z-50">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) => 
              `relative flex flex-col items-center gap-1 flex-1 transition-all group ${
                isActive ? "text-dismel-red" : "text-text-muted hover:text-text-main"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
                  isActive ? "bg-dismel-red/10 scale-110" : "bg-transparent group-active:scale-90"
                }`}>
                  <tab.icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                </div>
                <span className={`text-[8.5px] font-black uppercase tracking-widest transition-all ${
                  isActive ? "opacity-100 translate-y-0" : "opacity-40 -translate-y-0.5"
                }`}>
                  {tab.name}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="tab-indicator"
                    className="absolute -top-1 w-1.5 h-1.5 bg-dismel-red rounded-full shadow-[0_0_8px_rgba(235,28,36,0.4)]"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
