import React from 'react';
import { CreditSummary, CreditStatus, CreditRiskLevel } from '../../types/credit';
import { formatCurrency } from '../../lib/utils';
import { AlertTriangle, Clock, CreditCard, ShieldCheck, ShieldAlert } from 'lucide-react';

interface CreditSummaryCardProps {
  summary: CreditSummary;
}

export default function CreditSummaryCard({ summary }: CreditSummaryCardProps) {
  const getStatusColor = (status: CreditStatus) => {
    switch (status) {
      case 'ok': return 'bg-green-500';
      case 'at_risk': return 'bg-orange-400';
      case 'blocked': return 'bg-red-600';
      case 'requires_approval': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: CreditStatus) => {
    switch (status) {
      case 'ok': return 'Al día';
      case 'at_risk': return 'En riesgo';
      case 'blocked': return 'Bloqueado';
      case 'requires_approval': return 'Req. Aprobación';
      default: return status;
    }
  };

  const usedPercentage = Math.min(100, (summary.used_credit / summary.credit_limit) * 100);

  return (
    <div className="bg-white rounded-[32px] border border-border-soft overflow-hidden shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${getStatusColor(summary.status)} shadow-lg shadow-black/5`}>
              {summary.status === 'ok' ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
            </div>
            <div>
              <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest">Estatus Financiero</h4>
              <p className={`text-[10px] font-black uppercase tracking-widest ${getStatusColor(summary.status).replace('bg-', 'text-')}`}>
                {getStatusLabel(summary.status)}
              </p>
            </div>
          </div>
          {summary.max_overdue_days > 0 && (
            <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Clock size={12} className="shrink-0" />
              <span className="text-[9px] font-black uppercase tracking-tight">{summary.max_overdue_days} días vda.</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-1.5">Deuda Total</p>
            <p className="text-lg font-black text-text-main">{formatCurrency(summary.total_debt)}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-1.5">Vencido</p>
            <p className={`text-lg font-black ${summary.overdue_amount > 0 ? 'text-red-600' : 'text-text-main'}`}>
              {formatCurrency(summary.overdue_amount)}
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6 pt-6 border-t border-dashed border-border-soft">
          <div className="flex justify-between items-end">
             <div>
                <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Cupo Usado</p>
                <p className="text-sm font-black text-text-main">{formatCurrency(summary.used_credit)}</p>
             </div>
             <div className="text-right">
                <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Disponible</p>
                <p className="text-sm font-black text-green-600">{formatCurrency(summary.available_credit)}</p>
             </div>
          </div>
          
          <div className="relative">
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ${usedPercentage > 90 ? 'bg-red-500' : 'bg-green-500'}`}
                 style={{ width: `${usedPercentage}%` }}
               />
            </div>
            <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-[7px] font-black uppercase tracking-widest text-text-muted/40">
               <span>Meta: 0</span>
               <span>Límite: {formatCurrency(summary.credit_limit)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CreditRiskBadge({ level }: { level: CreditRiskLevel }) {
  const getLevelInfo = (level: CreditRiskLevel) => {
    switch (level) {
      case 'low': return { color: 'bg-green-100 text-green-700', label: 'Riesgo Bajo' };
      case 'medium': return { color: 'bg-orange-100 text-orange-700', label: 'Riesgo Medio' };
      case 'high': return { color: 'bg-red-100 text-red-700', label: 'Riesgo Alto' };
      case 'critical': return { color: 'bg-red-600 text-white', label: 'Crítico' };
    }
  };

  const info = getLevelInfo(level);

  return (
    <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${info.color}`}>
      {info.label}
    </div>
  );
}
