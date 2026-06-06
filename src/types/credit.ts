import { CommercialFeedbackEvent } from "../types";

export type CreditRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type CreditStatus = 'ok' | 'at_risk' | 'blocked' | 'requires_approval';

export interface CreditSummary {
  customer_id: string;
  total_debt: number;
  overdue_amount: number;
  credit_limit: number;
  used_credit: number;
  available_credit: number;
  max_overdue_days: number;
  status: CreditStatus;
  risk_level: CreditRiskLevel;
  next_action_suggestion: string;
  is_blocked: boolean;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  overdue_days: number;
  total_amount: number;
  remaining_balance: number;
  status: 'current' | 'overdue' | 'critical' | 'paid';
}

export interface PaymentPromise {
  id: string;
  customer_id: string;
  promise_date: string;
  amount: number;
  notes?: string;
  status: 'pending' | 'fulfilled' | 'broken' | 'overdue';
  created_at: string;
  payment_method?: string;
}

export interface CustomerReportedPayment {
  id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference?: string;
  notes?: string;
  status: 'pending_validation' | 'validated' | 'rejected';
  created_at: string;
}

export interface CreditEscalation {
  id: string;
  customer_id: string;
  reason: 'block_removal' | 'limit_increase' | 'dispute' | 'special_negotiation' | 'reported_payment';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  created_at: string;
}

export interface CustomerCreditBehavior {
  pays_on_time_ratio: number;
  usual_payment_day: string;
  most_used_payment_method: string;
  sensitivity_to_blocking: 'high' | 'medium' | 'low';
  last_successful_collection_date: string;
  collection_notes: string;
}

export interface CustomerCreditData {
  summary: CreditSummary;
  invoices: Invoice[];
  promises: PaymentPromise[];
  reported_payments: CustomerReportedPayment[];
  behavior: CustomerCreditBehavior;
  escalations: CreditEscalation[];
}
