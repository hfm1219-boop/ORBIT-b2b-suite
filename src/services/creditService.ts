import { CustomerCreditData, CreditSummary, Invoice, PaymentPromise, CustomerReportedPayment, CreditEscalation, CreditStatus } from "../types/credit";
import { feedbackLogger } from "../utils/feedbackLogger";

const MOCK_CREDIT_DATA: Record<string, CustomerCreditData> = {
  // 1. Cliente al día
  "1": {
    summary: {
      customer_id: "1",
      total_debt: 2100000,
      overdue_amount: 0,
      credit_limit: 10000000,
      used_credit: 2100000,
      available_credit: 7900000,
      max_overdue_days: 0,
      status: 'ok',
      risk_level: 'low',
      next_action_suggestion: "Cliente con excelente comportamiento. Mantener oferta comercial estándar.",
      is_blocked: false
    },
    invoices: [
      { id: "inv_101", invoice_number: "FAC-8820", issue_date: "2026-05-01", due_date: "2026-05-31", overdue_days: 0, total_amount: 2100000, remaining_balance: 2100000, status: 'current' }
    ],
    promises: [],
    reported_payments: [],
    behavior: {
      pays_on_time_ratio: 0.95,
      usual_payment_day: "Viernes",
      most_used_payment_method: "Transferencia Bancaria",
      sensitivity_to_blocking: 'low',
      last_successful_collection_date: "2026-04-28",
      collection_notes: "Suele pagar anticipadamente para aprovechar descuentos financieros."
    },
    escalations: []
  },
  // 2. Cliente con cartera vencida leve
  "2": {
    summary: {
      customer_id: "2",
      total_debt: 3500000,
      overdue_amount: 850000,
      credit_limit: 5000000,
      used_credit: 3500000,
      available_credit: 1500000,
      max_overdue_days: 12,
      status: 'at_risk',
      risk_level: 'medium',
      next_action_suggestion: "Notificar vencimiento por WhatsApp y consultar fecha estimada de pago.",
      is_blocked: false
    },
    invoices: [
      { id: "inv_201", invoice_number: "FAC-8710", issue_date: "2026-04-01", due_date: "2026-05-01", overdue_days: 12, total_amount: 1500000, remaining_balance: 850000, status: 'overdue' },
      { id: "inv_202", invoice_number: "FAC-8815", issue_date: "2026-05-05", due_date: "2026-06-05", overdue_days: 0, total_amount: 2650000, remaining_balance: 2650000, status: 'current' }
    ],
    promises: [],
    reported_payments: [],
    behavior: {
      pays_on_time_ratio: 0.75,
      usual_payment_day: "Martes",
      most_used_payment_method: "Cheque",
      sensitivity_to_blocking: 'medium',
      last_successful_collection_date: "2026-04-15",
      collection_notes: "A veces olvida las fechas exactas de vencimiento. Agradece recordatorios suaves."
    },
    escalations: []
  },
  // 3. Cliente bloqueado (Bar Seven Nights)
  "3": {
    summary: {
      customer_id: "3",
      total_debt: 4500000,
      overdue_amount: 1250000,
      credit_limit: 8000000,
      used_credit: 4500000,
      available_credit: 3500000,
      max_overdue_days: 34,
      status: 'blocked',
      risk_level: 'critical',
      next_action_suggestion: "Bloqueo por mora de +30 días. Solicitar pago parcial o aprobación de cartera antes de nuevos pedidos.",
      is_blocked: true
    },
    invoices: [
      { id: "inv_301", invoice_number: "FAC-8600", issue_date: "2026-03-15", due_date: "2026-04-10", overdue_days: 34, total_amount: 3000000, remaining_balance: 1250000, status: 'critical' },
      { id: "inv_302", invoice_number: "FAC-8750", issue_date: "2026-04-20", due_date: "2026-05-20", overdue_days: 0, total_amount: 3250000, remaining_balance: 3250000, status: 'current' }
    ],
    promises: [
      { id: "prom_301", customer_id: "3", promise_date: "2026-05-10", amount: 1250000, status: 'broken', created_at: "2026-05-08", notes: "Dijo que pagaba el fin de semana pasado pero no cumplió." }
    ],
    reported_payments: [],
    behavior: {
      pays_on_time_ratio: 0.40,
      usual_payment_day: "Lunes",
      most_used_payment_method: "Efectivo",
      sensitivity_to_blocking: 'high',
      last_successful_collection_date: "2026-03-30",
      collection_notes: "Sensible a bloqueos. Requiere seguimiento riguroso."
    },
    escalations: []
  },
  // 4. Cliente con promesa activa
  "4": {
    summary: {
      customer_id: "4",
      total_debt: 1240000,
      overdue_amount: 1240000,
      credit_limit: 3000000,
      used_credit: 1240000,
      available_credit: 1760000,
      max_overdue_days: 15,
      status: 'requires_approval',
      risk_level: 'medium',
      next_action_suggestion: "Promesa de pago activa para mañana. Monitorear reporte de pago.",
      is_blocked: false
    },
    invoices: [
      { id: "inv_401", invoice_number: "FAC-8720", issue_date: "2026-04-15", due_date: "2026-04-30", overdue_days: 15, total_amount: 1240000, remaining_balance: 1240000, status: 'overdue' }
    ],
    promises: [
      { id: "prom_401", customer_id: "4", promise_date: "2026-05-16", amount: 1240000, status: 'pending', created_at: "2026-05-14", notes: "Aseguró pago total mediante transferencia bancaria mañana." }
    ],
    reported_payments: [],
    behavior: {
      pays_on_time_ratio: 0.85,
      usual_payment_day: "Sábado",
      most_used_payment_method: "Transferencia Bancaria",
      sensitivity_to_blocking: 'medium',
      last_successful_collection_date: "2026-04-05",
      collection_notes: "Suele ser cumplido, el retraso actual es ocasional."
    },
    escalations: []
  },
  // 5. Cliente con pago informado
  "5": {
    summary: {
      customer_id: "5",
      total_debt: 8500000,
      overdue_amount: 4500000,
      credit_limit: 15000000,
      used_credit: 8500000,
      available_credit: 6500000,
      max_overdue_days: 20,
      status: 'at_risk',
      risk_level: 'medium',
      next_action_suggestion: "Pago informado pendiente de validación por cartera. Escalar a cartera si se requiere desbloqueo inmediato para pedido.",
      is_blocked: false
    },
    invoices: [
      { id: "inv_501", invoice_number: "FAC-8650", issue_date: "2026-03-25", due_date: "2026-04-24", overdue_days: 20, total_amount: 4500000, remaining_balance: 4500000, status: 'overdue' },
      { id: "inv_502", invoice_number: "FAC-8810", issue_date: "2026-05-02", due_date: "2026-06-01", overdue_days: 0, total_amount: 4000000, remaining_balance: 4000000, status: 'current' }
    ],
    promises: [],
    reported_payments: [
      { id: "pay_501", customer_id: "5", amount: 4500000, payment_date: "2026-05-14", payment_method: "Consignación", reference: "REF123456", status: 'pending_validation', created_at: "2026-05-14", notes: "El cliente envió foto del comprobante vía WhatsApp." }
    ],
    behavior: {
      pays_on_time_ratio: 0.90,
      usual_payment_day: "Jueves",
      most_used_payment_method: "Consignación",
      sensitivity_to_blocking: 'low',
      last_successful_collection_date: "2026-03-10",
      collection_notes: "Cliente corporativo, procesos de pago estables."
    },
    escalations: [
      { id: "esc_501", customer_id: "5", reason: 'reported_payment', priority: 'high', notes: "Se informa pago de $4.5M para desbloqueo de pedido hoy mismo.", status: 'in_review', created_at: "2026-05-14" }
    ]
  }
};

export const creditService = {
  getCustomerCreditData: async (customerId: string): Promise<{ ok: boolean, data?: CustomerCreditData, error?: string }> => {
    // Artificial delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const data = MOCK_CREDIT_DATA[customerId];
    if (data) {
      feedbackLogger.logActionViewed(customerId, "Cliente", "credit_collection", "customer_360");
      return { ok: true, data };
    }
    
    return { ok: false, error: "Datos de cartera no encontrados para este cliente." };
  },

  registerPaymentPromise: async (promise: Partial<PaymentPromise>): Promise<{ ok: boolean, promise?: PaymentPromise, error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newPromise: PaymentPromise = {
      id: `prom_${Date.now()}`,
      customer_id: promise.customer_id || "",
      promise_date: promise.promise_date || new Date().toISOString(),
      amount: promise.amount || 0,
      notes: promise.notes,
      payment_method: promise.payment_method,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // Log Event
    console.log("Feedback Event: payment_promise_registered", newPromise);
    // In a real app, this would persist to the backend
    
    return { ok: true, promise: newPromise };
  },

  reportPayment: async (report: Partial<CustomerReportedPayment>): Promise<{ ok: boolean, report?: CustomerReportedPayment, error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newReport: CustomerReportedPayment = {
      id: `pay_${Date.now()}`,
      customer_id: report.customer_id || "",
      amount: report.amount || 0,
      payment_date: report.payment_date || new Date().toISOString(),
      payment_method: report.payment_method || "Other",
      reference: report.reference,
      notes: report.notes,
      status: 'pending_validation',
      created_at: new Date().toISOString()
    };

    console.log("Feedback Event: payment_reported_by_customer", newReport);
    return { ok: true, report: newReport };
  },

  escalateToCredit: async (escalation: Partial<CreditEscalation>): Promise<{ ok: boolean, escalation?: CreditEscalation, error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newEscalation: CreditEscalation = {
      id: `esc_${Date.now()}`,
      customer_id: escalation.customer_id || "",
      reason: escalation.reason || 'block_removal',
      priority: escalation.priority || 'medium',
      notes: escalation.notes || "",
      status: 'open',
      created_at: new Date().toISOString()
    };

    console.log("Feedback Event: credit_case_escalated", newEscalation);
    return { ok: true, escalation: newEscalation };
  },

  generatePaymentLink: async (customerId: string, amount: number): Promise<{ ok: boolean, link?: string, error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const link = `https://pagos.dismel.com/link/${Math.random().toString(36).substring(7)}`;
    
    console.log("Feedback Event: payment_link_generated", { customerId, amount, link });
    return { ok: true, link };
  }
};
