import React from 'react';
import { Invoice } from '../../types/credit';
import { formatCurrency } from '../../lib/utils';
import { FileText, ChevronRight, MessageSquare, ExternalLink } from 'lucide-react';

interface InvoiceCardProps {
  invoice: Invoice;
  onGenerateLink: (invoice: Invoice) => void;
  onPrepareMessage: (invoice: Invoice) => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onGenerateLink, onPrepareMessage }) => {
  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'current': return 'bg-green-500';
      case 'overdue': return 'bg-orange-500';
      case 'critical': return 'bg-red-600';
      case 'paid': return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: Invoice['status']) => {
    switch (status) {
      case 'current': return 'Vigente';
      case 'overdue': return 'Vencida';
      case 'critical': return 'Crítica';
      case 'paid': return 'Pagada';
    }
  };

  return (
    <div className="bg-white p-5 rounded-[28px] border border-border-soft shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-dismel-gray rounded-2xl flex items-center justify-center text-text-muted">
            <FileText size={20} />
          </div>
          <div>
            <h5 className="text-[11px] font-black text-text-main uppercase tracking-widest">{invoice.invoice_number}</h5>
            <div className="flex items-center gap-2">
              <p className="text-[9px] font-bold text-text-muted">Exp: {invoice.issue_date}</p>
              <span className="w-1 h-1 bg-gray-200 rounded-full" />
              <p className={`text-[9px] font-black uppercase ${invoice.overdue_days > 0 ? 'text-red-500' : 'text-text-muted'}`}>
                {invoice.overdue_days > 0 ? `Hace ${invoice.overdue_days} días` : `Vence ${invoice.due_date}`}
              </p>
            </div>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase text-white ${getStatusColor(invoice.status)}`}>
          {getStatusLabel(invoice.status)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-dismel-gray rounded-2xl">
         <div>
            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Monto Original</p>
            <p className="text-[11px] font-black text-text-main opacity-60">{formatCurrency(invoice.total_amount)}</p>
         </div>
         <div className="text-right">
            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Saldo Pendiente</p>
            <p className="text-[11px] font-black text-text-main">{formatCurrency(invoice.remaining_balance)}</p>
         </div>
      </div>

      <div className="flex gap-2">
         <button 
           onClick={() => onGenerateLink(invoice)}
           className="flex-1 h-10 bg-black text-white rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest"
         >
            <ExternalLink size={12} /> Link Pago
         </button>
         <button 
           onClick={() => onPrepareMessage(invoice)}
           className="flex-1 h-10 bg-white border border-border-soft text-text-main rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest"
         >
            <MessageSquare size={12} /> Cobro
         </button>
      </div>
    </div>
  );
}

interface InvoiceListProps {
  invoices: Invoice[];
  onGenerateLink: (invoice: Invoice) => void;
  onPrepareMessage: (invoice: Invoice) => void;
}

export default function InvoiceList({ invoices, onGenerateLink, onPrepareMessage }: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <div className="py-10 text-center bg-white rounded-[32px] border border-border-soft border-dashed">
        <FileText size={40} className="mx-auto text-gray-200 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">No hay facturas pendientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map(invoice => (
        <InvoiceCard 
          key={invoice.id} 
          invoice={invoice} 
          onGenerateLink={onGenerateLink}
          onPrepareMessage={onPrepareMessage}
        />
      ))}
    </div>
  );
}
