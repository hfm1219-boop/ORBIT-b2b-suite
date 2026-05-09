import React from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { MapPinned, ShoppingBasket, Users, Bot } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Agente from "./Agente";
import Pedidos from "./Pedidos";
import Clientes from "./Clientes";
import Ruta from "./Ruta";

export default function Dashboard() {
  const location = useLocation();

  const tabs = [
    { name: "Agente", path: "/dashboard/agente", icon: Bot },
    { name: "Ruta", path: "/dashboard/ruta", icon: MapPinned },
    { name: "Pedidos", path: "/dashboard/pedidos", icon: ShoppingBasket },
    { name: "Clientes", path: "/dashboard/clientes", icon: Users },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div 
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <Routes location={location}>
              <Route path="agente" element={<Agente />} />
              <Route path="ruta" element={<Ruta />} />
              <Route path="pedidos" element={<Pedidos />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="/" element={<Agente />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="h-20 border-t border-gray-100 flex items-center justify-around px-2 pb-5 flex-shrink-0 bg-white">
        {tabs.map((tab) => {
          const isActive = location.pathname.includes(tab.path) || (location.pathname === "/dashboard" && tab.name === "Agente");
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) => 
                `flex flex-col items-center gap-1 flex-1 transition-all relative ${
                  isActive ? "text-dismel-red" : "text-text-muted"
                }`
              }
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-dismel-red-soft" : ""}`}>
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "" : "opacity-40"} />
              </div>
              <span className={`text-[9px] uppercase tracking-widest ${isActive ? "font-black" : "font-bold opacity-40"}`}>
                {tab.name}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
