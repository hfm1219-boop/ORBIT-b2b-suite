import React from 'react';
import { VisitStatus } from '../../types';

interface VisitStatusBadgeProps {
  status: VisitStatus;
  className?: string;
}

export default function VisitStatusBadge({ status, className = "" }: VisitStatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'planned':
        return 'bg-dismel-gray text-text-muted border-border-soft';
      case 'in_progress':
        return 'bg-dismel-red-soft text-dismel-red border-dismel-red/10 animate-pulse-slow';
      case 'completed':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'skipped':
        return 'bg-red-50 text-error-red border-error-red/10';
      case 'not_validated':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      default:
        return 'bg-dismel-gray text-text-muted border-border-soft';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'planned': return 'Pendiente';
      case 'in_progress': return 'En visita';
      case 'completed': return 'Completada';
      case 'skipped': return 'No realizada';
      case 'not_validated': return 'No validada';
      default: return status;
    }
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyles()} ${className}`}>
      {getStatusLabel()}
    </span>
  );
}
