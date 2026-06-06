import React, { useState, useEffect } from "react";
import { Settings, Shield, Sliders, Play, RotateCcw, CheckCircle2, AlertTriangle, Info, Database, Filter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { scoringService } from "../../services/scoringService";
import { BusinessRule, ScoringConfig } from "../../types";

export default function ScoringRulesPanel() {
  const [activeTab, setActiveTab] = useState<'rules' | 'simulator'>('rules');
  const [config, setConfig] = useState<ScoringConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [localRules, setLocalRules] = useState<BusinessRule[]>([]);
  const [selectedClientScore, setSelectedClientScore] = useState<any>(null);

  const simulateImpact = async (clientName: string) => {
     const clientMap: {[key: string]: string} = {
       'LICORERA DON PEPE SAS': '1',
       'HOTEL CARIBE INTERNACIONAL': '2',
       'BAR SEVEN NIGHTS': '3'
     };
     const clientId = clientMap[clientName];
     if (clientId) {
        const response = await scoringService.getCustomerScore(clientId);
        if (response.ok && response.score) {
           setSelectedClientScore(response.score);
        }
     }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const response = await scoringService.getScoringConfig();
    if (response.ok && response.config) {
      setConfig(response.config);
      setLocalRules(response.config.rules);
    }
    setLoading(false);
  };

  const toggleRule = (id: string) => {
    setLocalRules(prev => prev.map(r => 
      r.id === id ? { ...r, active: !r.active } : r
    ));
  };

  const updateWeight = (id: string, delta: number) => {
    setLocalRules(prev => prev.map(r => 
      r.id === id ? { ...r, weight: Math.max(0, r.weight + delta) } : r
    ));
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-[40px] border border-border-soft overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border-soft flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-white rounded-2xl flex items-center justify-center">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-text-main uppercase tracking-tight">Motor de Reglas</h3>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">Versión {config?.version || '1.0'}</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setActiveTab('rules')}
             className={`px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
               activeTab === 'rules' ? 'bg-black text-white' : 'bg-white border border-border-soft text-text-muted'
             }`}
           >
             Reglas
           </button>
           <button 
             onClick={() => setActiveTab('simulator')}
             className={`px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
               activeTab === 'simulator' ? 'bg-black text-white' : 'bg-white border border-border-soft text-text-muted'
             }`}
           >
             Simular
           </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'rules' ? (
          <div className="space-y-4">
             <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-blue-800 leading-relaxed">
                   Estas reglas definen cómo el sistema prioriza clientes. Los cambios aquí afectan el scoring demo inmediato.
                </p>
             </div>

             <div className="space-y-3">
                {localRules.map((rule) => (
                  <div key={rule.id} className={`p-5 rounded-[32px] border-2 transition-all ${
                    rule.active ? 'border-border-soft bg-white shadow-sm' : 'border-dashed border-gray-200 bg-gray-50 opacity-60'
                  }`}>
                     <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                           <button 
                             onClick={() => toggleRule(rule.id)}
                             className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all ${
                               rule.active ? 'bg-black border-black text-white' : 'bg-white border-gray-300'
                             }`}
                           >
                             {rule.active && <CheckCircle2 size={12} />}
                           </button>
                           <div>
                              <h4 className="text-[11px] font-black uppercase tracking-tight text-text-main">{rule.name}</h4>
                              <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{rule.category}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <button 
                             onClick={() => updateWeight(rule.id, -5)}
                             className="w-8 h-8 rounded-lg border border-border-soft flex items-center justify-center text-text-muted active:scale-95 transition-all"
                           >
                             -
                           </button>
                           <div className="w-12 text-center font-black text-xs text-text-main">
                             {rule.weight}
                           </div>
                           <button 
                             onClick={() => updateWeight(rule.id, 5)}
                             className="w-8 h-8 rounded-lg border border-border-soft flex items-center justify-center text-text-muted active:scale-95 transition-all"
                           >
                             +
                           </button>
                        </div>
                     </div>
                     <p className="text-[11px] font-bold text-text-muted leading-relaxed italic mb-4">"{rule.description}"</p>
                     
                     <div className="flex flex-wrap gap-2">
                        {rule.blocks_order && (
                           <div className="bg-red-50 text-red-600 text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                              <AlertTriangle size={8} /> Bloquea Pedido
                           </div>
                        )}
                        {rule.creates_message && (
                           <div className="bg-green-50 text-green-600 text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                              <Shield size={8} /> Genera Mensaje
                           </div>
                        )}
                        <div className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest border ${
                          rule.severity === 'critical' ? 'bg-red-900 text-white border-red-900' : 'bg-gray-100 text-text-muted border-border-soft'
                        }`}>
                          Severidad: {rule.severity}
                        </div>
                     </div>
                  </div>
                ))}
             </div>

             <button 
               className="w-full h-12 bg-dismel-red text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-dismel-red/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
               onClick={() => {
                  alert("Configuración aplicada para esta sesión demo.");
               }}
             >
               <RotateCcw size={16} /> Aplicar Cambios Demo
             </button>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="p-8 bg-gray-50 rounded-[32px] border border-dashed border-border-soft text-center">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 border border-border-soft text-text-muted">
                   <Filter size={32} />
                </div>
                <h4 className="text-sm font-black text-text-main uppercase tracking-tight mb-2">Simulador de Impacto</h4>
                <p className="text-[10px] font-bold text-text-muted leading-relaxed">
                   Seleccione un cliente para predecir su score basado en las reglas actuales.
                </p>
             </div>

             <div className="space-y-4">
                {['LICORERA DON PEPE SAS', 'HOTEL CARIBE INTERNACIONAL', 'BAR SEVEN NIGHTS'].map((client, i) => (
                  <button 
                    key={i}
                    className="w-full p-6 bg-white border border-border-soft rounded-[32px] flex items-center justify-between group hover:border-black transition-all text-left"
                  >
                     <div>
                        <p className="text-[11px] font-black text-text-main uppercase tracking-tight">{client}</p>
                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">Simular comportamiento</p>
                     </div>
                     <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                        <Play size={16} />
                     </div>
                  </button>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
