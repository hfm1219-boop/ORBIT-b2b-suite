import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Route as RouteIcon, MapPin, Search, Calendar, 
  TrendingUp, RefreshCw, AlertCircle, MapPinned,
  ChevronRight, ShoppingBag, CheckCircle2, User
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RouteTodayResponse, RouteVisit, LocationCoordinates, VisitResultType } from "../types";
import { routeService } from "../services/routeService";
import { locationService } from "../services/locationService";
import RouteVisitCard from "../components/route/RouteVisitCard";
import VisitResultModal from "../components/route/VisitResultModal";
import CustomerDashboardModal from "../components/customers/CustomerDashboardModal";

export default function Ruta() {
  const [routeData, setRouteData] = useState<RouteTodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals / Status
  const [finishVisitModal, setFinishVisitModal] = useState<{ isOpen: boolean; visit: RouteVisit | null }>({
    isOpen: false,
    visit: null
  });
  const [finishingLoading, setFinishingLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadRoute();
  }, []);

  async function loadRoute() {
    try {
      setLoading(true);
      setError(null);
      const data = await routeService.getTodayRoute();
      if (data.ok) {
        setRouteData(data);
      } else {
        throw new Error(data.error || "No se pudo cargar la ruta");
      }
    } catch (err: any) {
      setError(err.message || "No se pudieron obtener las visitas programadas.");
    } finally {
      setLoading(false);
    }
  }

  const handleStartVisit = async (visit: RouteVisit) => {
    try {
      // 1. Get Location
      const location = await locationService.getCurrentLocation();
      
      // 2. Calculate Distance if customer has coordinates
      let distanceMeters = 0;
      let locationValidated = false;

      if (visit.latitude && visit.longitude) {
        distanceMeters = locationService.calculateDistanceMeters(
          location.latitude, 
          location.longitude, 
          visit.latitude, 
          visit.longitude
        );
        locationValidated = locationService.isWithinVisitRadius(distanceMeters);
      }

      // 3. API Check-in
      await routeService.checkInVisit(visit.id, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || 0,
        distance_meters: Math.round(distanceMeters),
        location_validated: locationValidated,
        timestamp: new Date().toISOString()
      });

      // 4. Update UI local state
      if (routeData) {
        const updatedItems = routeData.items.map(item => 
          item.id === visit.id 
            ? { ...item, status: 'in_progress' as const, checkin_time: new Date().toISOString(), distance_meters: Math.round(distanceMeters), location_validated: locationValidated } 
            : item
        );
        setRouteData({
          ...routeData,
          items: updatedItems,
          summary: { ...routeData.summary, in_progress: routeData.summary.in_progress + 1, pending: routeData.summary.pending - 1 }
        });
      }

    } catch (err: any) {
      alert(`Error al iniciar visita: ${err.message}. Intentando iniciar sin validación GPS...`);
      // Optional: Allow proceeding if GPS fails
    }
  };

  const handleFinishVisit = (visit: RouteVisit) => {
    setFinishVisitModal({ isOpen: true, visit });
  };

  const onConfirmFinish = async (resultType: VisitResultType, note: string) => {
    if (!finishVisitModal.visit) return;
    const visit = finishVisitModal.visit;

    try {
      setFinishingLoading(true);
      
      // Get location for checkout
      let location: LocationCoordinates = { latitude: 0, longitude: 0 };
      try {
        location = await locationService.getCurrentLocation();
      } catch (e) {
        console.warn("No se pudo obtener ubicación para el cierre");
      }

      // API Check-out
      await routeService.checkOutVisit(visit.id, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || 0,
        result_type: resultType,
        result_note: note,
        timestamp: new Date().toISOString()
      });

      // Update Local State
      if (routeData) {
        const updatedItems = routeData.items.map(item => 
          item.id === visit.id 
            ? { ...item, status: 'completed' as const, checkout_time: new Date().toISOString(), result_type: resultType, result_note: note } 
            : item
        );
        setRouteData({
          ...routeData,
          items: updatedItems,
          summary: { 
            ...routeData.summary, 
            completed: routeData.summary.completed + 1, 
            in_progress: routeData.summary.in_progress - 1,
            orders_created: resultType === 'order_created' ? routeData.summary.orders_created + 1 : routeData.summary.orders_created
          }
        });
      }

      setFinishVisitModal({ isOpen: false, visit: null });
    } catch (err: any) {
      alert(`Error al finalizar visita: ${err.message}`);
    } finally {
      setFinishingLoading(false);
    }
  };

  const handleStartOrder = (visit: RouteVisit, selectedSuggestions?: any[]) => {
    localStorage.setItem('pendingOrderCustomer', JSON.stringify({ id: visit.customer_id, name: visit.customer_name }));
    localStorage.setItem('pendingVisitId', visit.id);
    
    if (selectedSuggestions && selectedSuggestions.length > 0) {
      localStorage.setItem('pending_order_items', JSON.stringify(
        selectedSuggestions.map(s => ({
          id: s.product.product_id,
          sku: s.product.sku,
          name: s.product.product_name,
          qty: s.qty,
          price: s.product.current_price
        }))
      ));
    }
    
    navigate('/dashboard/pedidos');
  };

  const handleAddToOrder = (item: any) => {
    // Show a temporary feedback
    alert(`Añadido al pedido sugerido: ${item.name}`);
    // In a real app, this would add to a local cart or session
  };

  const filteredVisits = routeData?.items.filter(item => {
    const matchesSearch = item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'pending') return matchesSearch && (item.status === 'planned' || item.status === 'in_progress');
    if (filter === 'completed') return matchesSearch && item.status === 'completed';
    return matchesSearch;
  }) || [];

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#f8f9fa] items-center justify-center p-10 space-y-4">
        <div className="w-12 h-12 border-4 border-dismel-red border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
           <p className="text-sm font-black text-gray-800 uppercase tracking-tight">Cargando ruta de hoy</p>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Consultando itinerario en Odoo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-[#f8f9fa] items-center justify-center p-10 space-y-6">
        <div className="w-20 h-20 bg-red-50 text-red-400 rounded-full flex items-center justify-center">
           <AlertCircle size={40} />
        </div>
        <div className="text-center space-y-2">
           <p className="text-base font-black text-gray-800 uppercase tracking-tight">¡Oops! Algo salió mal</p>
           <p className="text-xs font-medium text-gray-500 max-w-xs">{error}</p>
        </div>
        <button 
          onClick={loadRoute}
          className="bg-white border-2 border-gray-200 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 flex items-center gap-2 active:scale-95 transition-transform"
        >
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-app-bg font-sans">
      {/* Header Overview */}
      <div className="bg-dismel-red p-6 pt-12 text-white flex-shrink-0">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                 <RouteIcon size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-black uppercase tracking-tight leading-none">Ruta de Hoy</h2>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mt-1.5">
                   {new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
                 </p>
              </div>
           </div>
           <button 
             onClick={loadRoute}
             className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
           >
             <RefreshCw size={18} />
           </button>
        </div>

        {/* Summary Dashboard */}
        <div className="grid grid-cols-4 gap-2.5">
           <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 text-center border border-white/10">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1 leading-none">Total</p>
              <p className="text-base font-black">{routeData?.summary.total_planned}</p>
           </div>
           <div className="bg-white rounded-2xl p-2.5 text-center shadow-lg shadow-black/5">
              <p className="text-[8px] font-black uppercase tracking-widest leading-none mb-1 text-text-muted">Visitas</p>
              <p className="text-base font-black text-dismel-red">{routeData?.summary.completed}</p>
           </div>
           <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 text-center border border-white/10">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1 leading-none">Ventas</p>
              <p className="text-base font-black">{routeData?.summary.orders_created}</p>
           </div>
           <div className="bg-green-400/20 backdrop-blur-md rounded-2xl p-2.5 text-center border border-green-400/20">
              <p className="text-[8px] font-black uppercase tracking-widest leading-none mb-1 text-green-100">GPS OK</p>
              <p className="text-base font-black text-white">{routeData?.summary.validated_visits}</p>
           </div>
        </div>
      </div>

      {/* Action Bar / Filters */}
      <div className="p-4 bg-white border-b border-border-soft flex-shrink-0 flex flex-col gap-4">
         <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/40" size={16} />
            <input 
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dismel-gray/50 border border-transparent h-12 rounded-2xl pl-11 pr-4 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:bg-white focus:border-dismel-red/30 focus:ring-4 focus:ring-dismel-red/5 transition-all outline-none"
            />
         </div>

         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'Todo' },
            { id: 'pending', label: 'Pendientes' },
            { id: 'completed', label: 'Completados' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-6 h-9 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                filter === f.id ? "bg-dismel-red border-dismel-red text-white shadow-lg shadow-dismel-red/20" : "bg-white border-border-soft text-text-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
         </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-6">
        {filteredVisits.length > 0 ? (
          filteredVisits.map((visit) => (
            <RouteVisitCard 
              key={visit.id}
              visit={visit}
              onStartVisit={handleStartVisit}
              onFinishVisit={handleFinishVisit}
              onStartOrder={handleStartOrder}
              onOpenCustomer={(id) => setSelectedCustomerId(id)}
              onAddToOrder={handleAddToOrder}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 opacity-30 grayscale">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <MapPinned size={40} className="text-gray-400" />
            </div>
            <div className="space-y-1">
               <p className="text-sm font-black text-gray-800 uppercase">Sin resultados</p>
               <p className="text-xs font-medium">No se encontraron visitas que coincidan.</p>
            </div>
          </div>
        )}
        
        {/* Footer info spacing */}
        <div className="h-20" />
      </div>

      {/* Modals */}
      <VisitResultModal 
        isOpen={finishVisitModal.isOpen}
        onClose={() => setFinishVisitModal({ isOpen: false, visit: null })}
        onConfirm={onConfirmFinish}
        isLoading={finishingLoading}
      />

      <AnimatePresence>
        {selectedCustomerId && (
          <CustomerDashboardModal 
            customerId={selectedCustomerId}
            onClose={() => setSelectedCustomerId(null)}
            onStartOrder={(cid, name, product) => {
               setSelectedCustomerId(null);
               localStorage.setItem('pendingOrderCustomer', JSON.stringify({ id: cid, name }));
               if (product) localStorage.setItem('pendingOrderProduct', JSON.stringify(product));
               navigate('/dashboard/clientes');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
