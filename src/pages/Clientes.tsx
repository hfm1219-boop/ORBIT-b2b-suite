import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ChevronRight, Users, AlertCircle, RefreshCw } from "lucide-react";
import { customerService } from "../services/customerService";
import { Customer } from "../types";
import CustomerDashboardModal from "../components/customers/CustomerDashboardModal";
import NewOrder from "./NewOrder";

export default function Clientes() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showOrderForCustomer, setShowOrderForCustomer] = useState<{id: string, name: string, product?: any} | null>(null);

  useEffect(() => {
    loadCustomers();

    // Check for pending order or customer view from other pages (Repurchase logic)
    const checkPendingActions = () => {
      const pendingCustomer = localStorage.getItem('pendingOrderCustomer');
      const pendingProduct = localStorage.getItem('pendingOrderProduct');
      const openCustomerId = localStorage.getItem('openCustomerId');

      if (pendingCustomer) {
        const customer = JSON.parse(pendingCustomer);
        const product = pendingProduct ? JSON.parse(pendingProduct) : undefined;
        localStorage.removeItem('pendingOrderCustomer');
        localStorage.removeItem('pendingOrderProduct');
        handleStartOrder(customer.id, customer.name, product);
      } else if (openCustomerId) {
        setSelectedCustomerId(openCustomerId);
        localStorage.removeItem('openCustomerId');
      }
    };

    checkPendingActions();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      const data = await customerService.getAdvisorCustomers();
      setCustomers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.nit.includes(searchTerm) ||
    (c.commercial_name && c.commercial_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStartOrder = (id: string, name: string, product?: any) => {
    setSelectedCustomerId(null);
    setShowOrderForCustomer({ id, name, product });
  };

  return (
    <div className="flex flex-col h-full bg-app-bg font-sans relative overflow-hidden">
      {/* Search Header */}
      <div className="bg-dismel-red p-6 pt-12 pb-10 flex-shrink-0">
        <h1 className="text-xl font-black text-white uppercase tracking-tight">Mis Clientes</h1>
        <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] mt-1">{customers.length} Cartera Asignada</p>
      </div>

      <div className="px-6 -mt-6 mb-4">
        <div className="relative group">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchTerm ? 'text-dismel-red' : 'text-text-muted/40'}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o NIT..."
            className="w-full bg-white border border-border-soft rounded-2xl py-4 pl-11 pr-4 text-[11px] font-bold uppercase tracking-widest outline-none shadow-lg shadow-black/5 focus:border-dismel-red/30 transition-all placeholder:text-text-muted/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
           <div className="w-10 h-10 border-4 border-dismel-red border-t-transparent rounded-full animate-spin" />
           <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Sincronizando clientes...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4">
           <div className="w-16 h-16 bg-red-50 text-dismel-red rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
           </div>
           <div className="space-y-1">
              <p className="text-sm font-black text-text-main uppercase">Error de sincronización</p>
              <p className="text-xs font-bold text-text-muted">{error}</p>
           </div>
           <button 
             onClick={loadCustomers}
             className="flex items-center gap-2 px-8 h-12 bg-white border border-border-soft rounded-2xl text-[10px] font-black uppercase text-text-main active:scale-95 transition-transform shadow-sm"
           >
              <RefreshCw size={14} />
              Reintentar
           </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-24 no-scrollbar">
          {filteredCustomers.map((customer) => (
            <motion.div
              key={customer.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCustomerId(customer.id)}
              className="p-4 bg-white border border-border-soft rounded-[28px] flex items-center justify-between shadow-sm active:bg-dismel-gray transition-colors border-l-4 border-l-white hover:border-l-dismel-red"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-dismel-red-soft flex items-center justify-center flex-shrink-0 text-dismel-red">
                  <Users className="w-6 h-6" strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-text-main text-sm truncate uppercase tracking-tight leading-none mb-1.5">{customer.name}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none">NIT: {customer.nit}</p>
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 rounded-md uppercase leading-relaxed">{customer.priceList}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted opacity-20 flex-shrink-0" />
            </motion.div>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="py-20 text-center space-y-3">
               <Search className="w-12 h-12 text-gray-100 mx-auto" />
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No se encontraron clientes</p>
            </div>
          )}
        </div>
      )}

      {/* Customer 360 Modal */}
      <AnimatePresence>
        {selectedCustomerId && (
          <CustomerDashboardModal 
            customerId={selectedCustomerId}
            onClose={() => setSelectedCustomerId(null)}
            onStartOrder={handleStartOrder}
          />
        )}
      </AnimatePresence>

      {/* New Order Overlay (Full Screen) */}
      <AnimatePresence>
        {showOrderForCustomer && (
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed inset-0 z-[70] bg-white"
          >
            <NewOrder 
              onBack={() => setShowOrderForCustomer(null)} 
              initialCustomerId={showOrderForCustomer.id}
              initialCustomerName={showOrderForCustomer.name}
              initialProduct={showOrderForCustomer.product}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
