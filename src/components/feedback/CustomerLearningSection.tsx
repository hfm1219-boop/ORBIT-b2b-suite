import React, { useState, useEffect } from "react";
import { 
  Brain, 
  TrendingUp, 
  MessageCircle, 
  Smartphone, 
  MapPin, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  Info,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Percent,
  Calendar
} from "lucide-react";
import { feedbackService } from "../../services/feedbackService";
import { CustomerLearningProfile, CommercialFeedbackEvent } from "../../types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface CustomerLearningSectionProps {
  customerId: string;
}

export default function CustomerLearningSection({ customerId }: CustomerLearningSectionProps) {
  const [profile, setProfile] = useState<CustomerLearningProfile | null>(null);
  const [events, setEvents] = useState<CommercialFeedbackEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLearningData();

    // Listen for updates from Agente or other components
    const handleUpdate = () => loadLearningData();
    window.addEventListener("feedback:updated", handleUpdate);
    return () => window.removeEventListener("feedback:updated", handleUpdate);
  }, [customerId]);

  const loadLearningData = async () => {
    setLoading(true);
    const [profileRes, eventsRes] = await Promise.all([
      feedbackService.getCustomerLearningProfile(customerId),
      feedbackService.getFeedbackEventsForCustomer(customerId)
    ]);

    if (profileRes.ok && profileRes.profile) {
      setProfile(profileRes.profile);
    }
    if (eventsRes.ok && eventsRes.events) {
      setEvents(eventsRes.events.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    }
    setLoading(false);
  };

  if (loading) return (
     <div className="bg-white rounded-[32px] p-6 border border-border-soft animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
        <div className="space-y-3">
           <div className="h-10 bg-gray-50 rounded-2xl" />
           <div className="h-10 bg-gray-50 rounded-2xl" />
        </div>
     </div>
  );

  if (!profile && events.length === 0) {
    return (
      <div className="bg-white rounded-[32px] border border-dashed border-border-soft p-8 text-center">
        <Brain className="mx-auto text-text-muted mb-3 opacity-20" size={32} />
        <p className="text-[11px] font-black text-text-muted uppercase tracking-widest leading-relaxed">
          No hay suficiente historial todavía.<br />
          Las próximas acciones ayudarán a aprender qué funciona.
        </p>
      </div>
    );
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <MessageCircle size={14} />;
      case 'phone': return <Smartphone size={14} />;
      case 'visit': return <MapPin size={14} />;
      default: return <Info size={14} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* A. Resumen de Aprendizaje Principal */}
      <div className="bg-black text-white rounded-[32px] p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-dismel-red" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Recomendación IA</p>
          </div>
          <h3 className="text-xl font-black italic tracking-tight leading-tight mb-3">
            "{profile?.recommended_contact_action}"
          </h3>
          <p className="text-xs text-white/70 font-medium leading-relaxed">
            Estrategia recomendada: <span className="text-dismel-red font-bold uppercase tracking-wider">{profile?.recommended_strategy}</span>
          </p>
        </div>
        <Brain size={120} className="absolute -right-10 -bottom-10 text-white/5 opacity-10" />
      </div>

      {/* B. Indicadores Rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard 
          label="Canal" 
          value={profile?.preferred_channel || 'N/A'} 
          icon={getChannelIcon(profile?.preferred_channel || '')} 
          color="bg-indigo-50 text-indigo-700"
        />
        <MetricCard 
          label="Respuesta" 
          value={`${Math.round((profile?.response_rate || 0) * 100)}%`} 
          icon={<Percent size={14} />} 
          color="bg-emerald-50 text-emerald-700"
        />
        <MetricCard 
          label="Conversión" 
          value={`${Math.round((profile?.order_conversion_rate || 0) * 100)}%`} 
          icon={<TrendingUp size={14} />} 
          color="bg-blue-50 text-blue-700"
        />
        <MetricCard 
          label="Objeción" 
          value={profile?.top_objections[0] || 'Ninguna'} 
          icon={<AlertTriangle size={14} />} 
          color="bg-amber-50 text-amber-700"
        />
      </div>

      <div className="bg-white rounded-[32px] border border-border-soft p-5 lg:p-6 shadow-sm space-y-6">
        
        {/* C. Estrategias que Funcionan */}
        {profile?.successful_strategies && profile.successful_strategies.length > 0 && (
          <div>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <ThumbsUp size={10} className="text-emerald-500" /> Estrategias Exitosas
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.successful_strategies.map((strategy, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-100"
                >
                  {strategy.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* D. Alertas de Cuidado */}
        {(profile?.price_sensitivity === 'high' || profile?.service_sensitivity === 'high' || profile?.credit_behavior === 'frequent_promises') && (
          <div className="pt-6 border-t border-dashed border-border-soft">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <AlertTriangle size={10} className="text-amber-500" /> Alertas de Cuidado
            </p>
            <div className="space-y-2">
                {profile?.price_sensitivity === 'high' && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-2xl border border-red-100 text-red-700">
                    <Percent size={14} />
                    <span className="text-[10px] font-bold">Alta sensibilidad a precio: Revisar condiciones comerciales.</span>
                  </div>
                )}
                {profile?.service_sensitivity === 'high' && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-bold">Problemas de servicio recurrentes: Validar logística.</span>
                  </div>
                )}
                {profile?.credit_behavior === 'frequent_promises' && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-700">
                    <Clock size={14} />
                    <span className="text-[10px] font-bold">Promesas de pago frecuentes: Seguimiento estrecho en cartera.</span>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* E. Últimos Eventos */}
        {events.length > 0 && (
          <div className="pt-6 border-t border-dashed border-border-soft">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Calendar size={10} /> Línea de Tiempo Reciente
            </p>
            <div className="space-y-4">
              {events.slice(0, 3).map((event) => (
                <div key={event.id} className="relative pl-6 pb-2 last:pb-0">
                  <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-border-soft border-2 border-white ring-4 ring-transparent" />
                  <div className="absolute left-[3px] top-4 bottom-0 w-[1px] bg-border-soft last:hidden" />
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-text-main mb-0.5">
                        {event.event_type.replace(/_/g, ' ')}
                      </p>
                      {event.note && (
                        <p className="text-[10px] text-text-muted font-medium line-clamp-2 italic mb-1">
                          "{event.note}"
                        </p>
                      )}
                      <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: es })} • {event.source}
                      </p>
                    </div>
                    <div className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase ${
                      event.outcome === 'positive' || event.outcome === 'order_won' || event.outcome === 'payment_received' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : event.outcome === 'negative' || event.outcome === 'opportunity_lost'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {event.outcome}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className={`p-4 rounded-[24px] ${color} border border-black/5`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">
        {icon}
        <p className="text-[8px] font-black uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-sm font-black uppercase tracking-tight truncate">{value}</p>
    </div>
  );
}
