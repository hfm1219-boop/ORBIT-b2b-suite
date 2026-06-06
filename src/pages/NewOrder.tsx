import React, { useState } from "react";
import { ChevronDown, X, Trash2, Plus, Search, User, MapPin, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { feedbackLogger } from "../utils/feedbackLogger";

interface NewOrderProps {
  onBack: () => void;
  initialCustomerId?: string;
  initialCustomerName?: string;
  initialProduct?: any;
}

const MOCK_CLIENTS = [
  { id: "1", name: "ANILLO PEREIRA HECTOR-REST.LA CASA DE SOCORRO", nit: "72134248", distance: 120 },
  { id: "2", name: "CENTRO DE RECREACION DE OFICIALES CLUB NAVAL SANTA CRUZ", nit: "900417735", distance: 654030 },
  { id: "3", name: "CEVIMAKER S.A.S.", nit: "900799452", distance: 540 },
];

const MOCK_PRODUCTS = [
  { id: "1", name: "U.L.C. AV00274 GFA X 20 LTS", price: 224387, category: "Limpieza", stock: 45 },
  { id: "2", name: "SUMA GRILL AV00771 GAL X 5 LTS", price: 131222, category: "Cocina", stock: 12 },
  { id: "3", name: "MANGO METALICO AZUL 140 CM RF_105822", price: 7957, category: "Accesorios", stock: 120 },
];

export default function NewOrder({ onBack, initialCustomerId, initialCustomerName, initialProduct }: NewOrderProps) {
  const [step, setStep] = useState<"client" | "order">(initialCustomerId ? "order" : "client");
  const [selectedClient, setSelectedClient] = useState<any>(
    initialCustomerId ? { id: initialCustomerId, name: initialCustomerName, distance: 0 } : null
  );
  const [selectedIncidencia, setSelectedIncidencia] = useState("");
  const [searchIncidencia, setSearchIncidencia] = useState("");
  const [showIncidenciaDrop, setShowIncidenciaDrop] = useState(false);
  
  const [searchProduct, setSearchProduct] = useState("");
  const [showProductDrop, setShowProductDrop] = useState(false);
  
  const [items, setItems] = useState<any[]>(initialProduct ? [{ ...initialProduct, qty: 1, discount: 0 }] : []);
  const [searchClient, setSearchClient] = useState("");

  // Load from localStorage if available
  React.useEffect(() => {
    const pendingCustomer = localStorage.getItem('pendingOrderCustomer');
    const pendingItems = localStorage.getItem('pending_order_items');
    
    if (pendingCustomer && !initialCustomerId) {
      const customer = JSON.parse(pendingCustomer);
      setSelectedClient({ id: customer.id, name: customer.name, distance: 0 });
      setStep("order");
      localStorage.removeItem('pendingOrderCustomer');
    }

    if (pendingItems) {
      try {
        const parsedItems = JSON.parse(pendingItems);
        const itemsArray = Array.isArray(parsedItems) ? parsedItems : [parsedItems];
        
        setItems(prev => [...prev, ...itemsArray.map((item: any) => ({
          id: item.id || item.product_id,
          sku: item.sku,
          name: item.name || item.product_name,
          qty: item.qty || item.suggested_qty || 1,
          price: item.price || item.current_price || 0,
          discount: 0
        }))]);
      } catch (e) {
        console.error("Error parsing pending items", e);
      } finally {
        localStorage.removeItem('pending_order_items');
      }
    }
  }, [initialCustomerId]);

  const INCIDENCIAS = ["PEDIDO TELEFONICO", "VISITA PRESENCIAL", "URGENCIA", "REPOSICION", "GARANTIA", "MUESTRA"];

  const filteredClients = MOCK_CLIENTS.filter(c => 
    c.name.toLowerCase().includes(searchClient.toLowerCase()) || 
    c.nit.includes(searchClient)
  );

  const filteredIncidencias = INCIDENCIAS.filter(i => 
    i.toLowerCase().includes(searchIncidencia.toLowerCase())
  );

  const filteredProducts = MOCK_PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    p.id.includes(searchProduct)
  );

  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
    setStep("order");
  };

  const addItem = (product: any) => {
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      setItems(items.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setItems([...items, { ...product, qty: 1, discount: 0 }]);
    }
    setSearchProduct("");
    setShowProductDrop(false);
  };

  const totalBruto = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const totalImpuestos = totalBruto * 0.19;
  const totalPedido = totalBruto + totalImpuestos;

  if (step === "client") {
    return (
      <div className="absolute inset-0 bg-white z-50 flex flex-col">
        <header className="h-14 flex items-center justify-between px-4 border-b border-gray-100">
          <button onClick={onBack} className="text-dismel-red font-bold text-sm">Volver</button>
          <h2 className="font-bold text-sm">Seleccionar Cliente</h2>
          <div className="w-10"></div>
        </header>

        <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              type="text"
              placeholder="Buscar por nombre o NIT"
              className="w-full bg-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm outline-none border-b-2 border-transparent focus:border-dismel-red transition-all"
              value={searchClient}
              onChange={(e) => setSearchClient(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {filteredClients.map(client => (
              <motion.button
                key={client.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectClient(client)}
                className="w-full p-4 border border-gray-100 rounded-2xl bg-white shadow-sm flex flex-col text-left hover:border-dismel-red/30 transition-colors"
              >
                <h4 className="text-sm font-black text-gray-800 leading-tight mb-1">{client.name}</h4>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">NIT: {client.nit}</p>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-dismel-red" />
                    <span className="text-[10px] font-bold text-gray-500">{client.distance}m</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col no-scrollbar overflow-y-auto">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 sticky top-0 bg-white z-20 border-b border-gray-50 font-sans">
        <button onClick={() => setStep("client")} className="text-dismel-red font-bold text-sm">Volver</button>
        <h2 className="font-bold text-sm">Nuevo pedido</h2>
        <button onClick={onBack} className="text-gray-400 text-sm">Cancelar</button>
      </header>

      <div className="p-4 space-y-4 font-sans">
        {/* Step 1: Customer (ReadOnly since we came from step 1) */}
        <div className="space-y-3">
          <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm flex justify-between items-start">
            <div className="flex-1">
              <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest block mb-1">Cliente Seleccionado</label>
              <p className="text-xs font-bold text-gray-800 uppercase leading-tight max-w-[95%]">
                {selectedClient.name}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Step 2: Incidencia (Searchable Dropdown) */}
        <div className="space-y-2 relative">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Incidencia</label>
          <div className="relative">
            <div className={`p-3 bg-white border ${showIncidenciaDrop ? "border-dismel-red ring-1 ring-dismel-red/10" : "border-gray-200"} rounded-lg transition-all flex items-center gap-3`}>
              <Search className={`w-4 h-4 ${showIncidenciaDrop ? "text-dismel-red" : "text-gray-300"}`} />
              <input
                type="text"
                placeholder="Busca tipo de incidencia..."
                className="flex-1 bg-transparent text-xs font-bold outline-none text-gray-800 placeholder:text-gray-300 placeholder:font-medium"
                value={selectedIncidencia && !showIncidenciaDrop ? selectedIncidencia : searchIncidencia}
                onFocus={() => setShowIncidenciaDrop(true)}
                onChange={(e) => setSearchIncidencia(e.target.value)}
              />
              <ChevronDown className={`w-4 h-4 opacity-40 transition-transform ${showIncidenciaDrop ? "rotate-180" : ""}`} />
            </div>

            <AnimatePresence>
              {showIncidenciaDrop && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 shadow-2xl rounded-xl z-50 overflow-hidden max-h-48 overflow-y-auto no-scrollbar"
                >
                  {filteredIncidencias.map(inc => (
                    <button
                      key={inc}
                      onClick={() => {
                        setSelectedIncidencia(inc);
                        setSearchIncidencia("");
                        setShowIncidenciaDrop(false);
                      }}
                      className="w-full p-4 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                    >
                      {inc}
                      {selectedIncidencia === inc && <Check className="w-4 h-4 text-dismel-red" />}
                    </button>
                  ))}
                  {filteredIncidencias.length === 0 && (
                    <div className="p-4 text-center text-[10px] font-bold text-gray-300 uppercase">Sin resultados</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Step 3: Georef & Products (Searchable Dropdown) */}
        <AnimatePresence>
          {selectedIncidencia && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-1.5 px-1 bg-green-50/50 py-2.5 rounded-xl justify-center border border-green-100/50 shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-green-600" />
                <span className="text-[10px] text-green-700 font-bold uppercase tracking-tight">
                  Georeferenciado a {selectedClient.distance} m
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>

              <div className="space-y-4 relative">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1 mb-2">Búsqueda de Productos</label>
                  <div className={`p-3 bg-white border ${showProductDrop ? "border-dismel-red ring-1 ring-dismel-red/10" : "border-gray-200"} rounded-lg transition-all flex items-center gap-3`}>
                    <Search className={`w-4 h-4 ${showProductDrop ? "text-dismel-red" : "text-gray-300"}`} />
                    <input
                      type="text"
                      placeholder="Busca por nombre o referencia..."
                      className="flex-1 bg-transparent text-xs font-bold outline-none text-gray-800 placeholder:text-gray-300 placeholder:font-medium"
                      value={searchProduct}
                      onFocus={() => setShowProductDrop(true)}
                      onChange={(e) => setSearchProduct(e.target.value)}
                    />
                    {searchProduct && (
                      <X onClick={() => setSearchProduct("")} className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {showProductDrop && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-[72px] left-0 right-0 bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl z-50 overflow-hidden max-h-72 overflow-y-auto no-scrollbar"
                    >
                      <div className="p-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sugerencias para este cliente</p>
                      </div>
                      {filteredProducts.map(p => (
                        <button
                          key={p.id}
                          onClick={() => addItem(p)}
                          className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                        >
                          <div>
                            <p className="text-xs font-black text-gray-800 leading-tight">{p.name}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[9px] font-bold text-gray-400 px-1 bg-gray-100 rounded">REF: {p.id}</span>
                              <span className="text-[9px] font-bold text-gray-400 px-1 bg-gray-100 rounded">STOCK: {p.stock}</span>
                            </div>
                          </div>
                          <p className="text-xs font-black text-dismel-red">${p.price.toLocaleString()}</p>
                        </button>
                      ))}
                      {filteredProducts.length === 0 && (
                        <div className="p-12 text-center flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 text-gray-100" />
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sin coincidencias</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Backdrop to close dropdowns */}
                {(showIncidenciaDrop || showProductDrop) && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => {
                      setShowIncidenciaDrop(false);
                      setShowProductDrop(false);
                    }} 
                  />
                )}
              </div>

              {/* Added Products Section */}
              <div className="border-t border-gray-50 pt-4">
                <h3 className="text-sm font-black text-gray-800 px-1 mb-3">Productos agregados</h3>
                
                <div className="space-y-3">
                  {items.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-dismel-red" />
                      <button 
                        onClick={() => setItems(items.filter(i => i.id !== item.id))}
                        className="absolute top-4 right-4 text-dismel-red p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      <h4 className="text-[11px] font-black text-gray-800 pr-8 leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">Total línea: ${item.price.toLocaleString()}</p>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-gray-400">Desc %</span>
                          <input 
                            type="number"
                            className="w-12 h-8 bg-gray-50 border border-gray-200 rounded text-center text-xs font-black outline-none focus:border-dismel-red"
                            defaultValue={0}
                          />
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button className="p-1.5 text-dismel-red bg-red-50 rounded-lg active:scale-95 transition-transform">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex items-center gap-4 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 shadow-inner">
                            <button 
                              onClick={() => setItems(items.map(i => i.id === item.id && i.qty > 1 ? { ...i, qty: i.qty - 1 } : i))}
                              className="text-gray-400"
                            >
                              <Plus className="w-3.5 h-3.5 rotate-45" />
                            </button>
                            <span className="text-xs font-black min-w-[20px] text-center">{item.qty}</span>
                            <button 
                              onClick={() => setItems(items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i))}
                              className="text-dismel-red"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {items.length === 0 && (
                    <div className="py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center gap-2">
                       <Search className="w-8 h-8 text-gray-200" />
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Agrega productos para continuar</p>
                    </div>
                  )}
                </div>

                {/* Always visible summary if products exist */}
                {items.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-6 rounded-[32px] bg-white border border-gray-100 shadow-2xl space-y-3"
                  >
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-gray-400 uppercase tracking-widest leading-none">Total bruto</span>
                      <span className="text-gray-800">${totalBruto.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-gray-400 uppercase tracking-widest leading-none">Total descuento</span>
                      <span className="text-gray-800 font-mono">$0</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold py-1">
                      <span className="text-gray-400 uppercase tracking-widest leading-none">Total venta neta</span>
                      <span className="text-gray-800 font-black">${totalBruto.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-gray-400 uppercase tracking-widest leading-none">Total impuestos</span>
                      <span className="text-gray-800">${totalImpuestos.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-4 border-t border-gray-50 items-end">
                      <span className="text-sm font-black text-gray-800 leading-none pb-1">Total pedido</span>
                      <span className="text-2xl font-black text-dismel-red leading-none tabular-nums">${totalPedido.toLocaleString()}</span>
                    </div>

                    <div className="flex gap-4 pt-6">
                      <button 
                        type="button"
                        className="flex-1 bg-gray-100 text-gray-800 py-4 rounded-2xl font-black text-sm active:scale-95 transition-transform" 
                        onClick={onBack}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          // Log Order Confirmed
                          feedbackLogger.logOrderConfirmed(
                            selectedClient.id, 
                            selectedClient.name, 
                            "S" + Math.floor(Math.random() * 100000), 
                            Number(totalPedido)
                          );
                          
                          // For now, show a success alert and go back
                          alert(`¡Pedido para ${selectedClient.name} enviado con éxito!`);
                          onBack();
                        }}
                        className="flex-1 bg-dismel-red shadow-lg shadow-dismel-red/30 text-white py-4 rounded-2xl font-black text-sm active:scale-95 transition-transform"
                      >
                        Enviar
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="h-10" />
      </div>
    </div>
  );
}
