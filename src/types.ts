export interface CustomerSignal {
  id: string;
  customer_id: string;
  signal_type:
    | "repurchase_due"
    | "credit_overdue"
    | "credit_near_due"
    | "sales_drop"
    | "inactive_customer"
    | "high_value_customer"
    | "cross_sell_opportunity"
    | "pending_order"
    | "delivery_issue"
    | "route_priority"
    | "payment_opportunity"
    | "suggested_order_ready"
    | "recent_visit_no_order"
    | "no_recent_contact"
    | "promotion_applicable"
    | "stock_available"
    | "stock_risk"
    | "manual_priority"
    | "repurchase_converted_before"
    | "suggested_order_converted_before"
    | "cross_sell_rejected"
    | "whatsapp_no_response"
    | "visit_converts_better"
    | "price_objection_repeated"
    | "competitor_objection"
    | "delivery_issue_active"
    | "service_issue_active"
    | "promise_to_pay_pending"
    | "promise_to_pay_broken"
    | "payment_behavior_positive"
    | "strategy_fatigue"
    | "feedback_positive_recent"
    | "feedback_negative_recent";
  severity: "critical" | "high" | "medium" | "low" | "info";
  score: number;
  title: string;
  description: string;
  evidence: SignalEvidence[];
  created_at: string;
  expires_at?: string;
  source:
    | "odoo_sales"
    | "odoo_credit"
    | "odoo_inventory"
    | "route"
    | "visit"
    | "message"
    | "suggested_order"
    | "manual"
    | "demo"
    | "agent";
}

export interface SignalEvidence {
  label: string;
  value: string | number;
  previous_value?: string | number;
  unit?: string;
  date?: string;
}

export interface ScoreBreakdownItem {
  signal_type: CustomerSignal["signal_type"];
  label: string;
  score: number;
  weight: number;
  contribution: number;
  explanation: string;
}

export interface PriorityScore {
  customer_id: string;
  customer_name: string;
  total_score: number;
  priority: "critical" | "high" | "medium" | "low";
  confidence: "high" | "medium" | "low";
  recommended_action_type:
    | "create_order"
    | "send_message"
    | "visit"
    | "collect_payment"
    | "review_order"
    | "resolve_issue"
    | "call"
    | "no_action";
  recommended_action: string;
  explanation: string;
  signals: CustomerSignal[];
  score_breakdown: ScoreBreakdownItem[];
  calculated_at: string;
  feedback_adjustment_score?: number;
  feedback_confidence_adjustment?: number;
  feedback_summary?: string;
  recommended_channel?: "whatsapp" | "phone" | "visit";
  strategy_warnings?: string[];
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  category:
    | "sales"
    | "credit"
    | "route"
    | "inventory"
    | "messaging"
    | "retention"
    | "cross_sell";
  signal_type: CustomerSignal["signal_type"];
  weight: number;
  severity: CustomerSignal["severity"];
  condition_description: string;
  action_recommendation: string;
  blocks_order: boolean;
  creates_message: boolean;
  creates_route_priority: boolean;
}

export interface ScoringConfig {
  id: string;
  name: string;
  active: boolean;
  version: string;
  rules: BusinessRule[];
  priority_thresholds: {
    critical_min: number;
    high_min: number;
    medium_min: number;
    low_min: number;
  };
  updated_at: string;
}

export interface ScoringResponse {
  ok: boolean;
  demo?: boolean;
  scores?: PriorityScore[];
  score?: PriorityScore;
  signals?: CustomerSignal[];
  config?: ScoringConfig;
  data?: any;
  error?: string;
}

export interface ProactiveMessage {
  id: string;
  customer_id: string;
  customer_name: string;
  commercial_name?: string;
  advisor_id: string;
  advisor_name?: string;
  phone?: string;
  channel: "whatsapp";
  trigger_type:
    | "repurchase_due"
    | "credit_due"
    | "credit_overdue"
    | "order_received"
    | "order_approved"
    | "order_invoiced"
    | "order_scheduled"
    | "order_in_route"
    | "order_delivered"
    | "delivery_issue"
    | "visit_reminder"
    | "suggested_order"
    | "cross_sell"
    | "sales_drop_recovery"
    | "payment_link"
    | "manual";
  status:
    | "draft"
    | "pending_review"
    | "approved"
    | "sent"
    | "discarded"
    | "failed";
  priority: "high" | "medium" | "low";
  title: string;
  reason: string;
  message_body: string;
  suggested_send_at?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  sent_at?: string;
  source:
    | "today"
    | "customer_360"
    | "suggested_order"
    | "smart_route"
    | "order_status"
    | "credit"
    | "manual";
  related_entity_type?:
    | "next_best_action"
    | "customer"
    | "suggested_order"
    | "order"
    | "invoice"
    | "visit"
    | "payment";
  related_entity_id?: string;
  metadata?: Record<string, any>;
}

export interface MessageTemplate {
  id: string;
  name: string;
  trigger_type: ProactiveMessage["trigger_type"];
  description: string;
  body: string;
  variables: string[];
  active: boolean;
  requires_approval: boolean;
}

export interface ProactiveMessageResponse {
  ok: boolean;
  demo?: boolean;
  messages?: ProactiveMessage[];
  message?: ProactiveMessage;
  data?: any;
  error?: string;
}

export interface MessageReviewAction {
  message_id: string;
  action: "approve" | "edit" | "discard" | "send" | "copy" | "open_whatsapp";
  edited_body?: string;
  notes?: string;
}

export type SmartVisitStatus = "pending" | "in_progress" | "completed" | "skipped" | "rescheduled";

export interface VisitResult {
  outcome: "order_created" | "payment_collected" | "promise_to_pay" | "no_purchase" | "customer_closed" | "not_available" | "issue_reported" | "relationship_visit" | "rescheduled";
  notes: string;
  next_step: string;
  next_follow_up_date?: string;
  order_id?: string;
  payment_amount?: number;
  promise_to_pay_date?: string;
  issue_type?: "logística" | "producto" | "cartera" | "precio" | "servicio" | "otro";
  photos?: string[];
  created_at: string;
}

export interface SmartRouteVisit {
  id: string;
  route_id: string;
  customer_id: string;
  customer_name: string;
  commercial_name?: string;
  channel?: string;
  city?: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
  sequence: number;
  suggested_sequence: number;
  status: SmartVisitStatus;
  priority: "high" | "medium" | "low";
  visit_type: "sales" | "collection" | "retention" | "delivery_issue" | "new_opportunity" | "relationship";
  reason: string;
  recommended_action: string;
  estimated_sales_value: number;
  estimated_collection_value: number;
  has_repurchase_opportunity: boolean;
  has_credit_issue: boolean;
  has_sales_drop: boolean;
  has_pending_order: boolean;
  has_delivery_issue: boolean;
  next_best_action_id?: string;
  suggested_order_id?: string;
  planned_start_time?: string;
  planned_end_time?: string;
  check_in_time?: string;
  check_out_time?: string;
  check_in_latitude?: number;
  check_in_longitude?: number;
  check_out_latitude?: number;
  check_out_longitude?: number;
  distance_from_customer_meters?: number;
  visit_result?: VisitResult;
}

export interface SmartRoute {
  id: string;
  advisor_id: string;
  date: string;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  total_visits: number;
  completed_visits: number;
  pending_visits: number;
  estimated_sales_value: number;
  estimated_collection_value: number;
  route_score: number;
  generated_at: string;
  visits: SmartRouteVisit[];
}

export interface SmartRouteResponse {
  ok: boolean;
  demo?: boolean;
  route?: SmartRoute;
  error?: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  role: 'advisor' | 'supervisor' | 'admin';
  advisor_id: string;
  phone_number_id: string;
  zone_number: string;
}

export interface Chat {
  id: string;
  customerName: string;
  customerNumber: string;
  lastMessage: string;
  unreadCount: number;
  timestamp: string;
  status: 'online' | 'offline';
  pnId: string;
}

export interface Message {
  id: string;
  chatId: string;
  body: string;
  type: 'text' | 'image' | 'audio' | 'document' | 'video';
  sender: 'client' | 'advisor' | 'ai';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  caption?: string;
  mediaUrl?: string;
}

export interface Customer {
  id: string;
  nit: string;
  name: string;
  commercial_name?: string;
  address: string;
  phone: string;
  mobile?: string;
  totalDebt: number;
  coordinates?: { lat: number; lng: number };
  priceList: string;
  city?: string;
  state?: string;
  advisor_name?: string;
  distance?: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  brand: string;
  discount?: number;
  tax: number;
  imageUrl?: string;
}

export interface CreditStatus {
  total_due: number;
  overdue_total: number;
  not_due_total: number;
  max_days_overdue: number;
  status: "can_order" | "review" | "blocked";
  label: string;
  reason?: string;
}

export interface PurchaseSummary {
  last_order_date?: string | null;
  last_order_amount: number;
  orders_30d: number;
  orders_60d: number;
  orders_90d: number;
  sales_30d: number;
  sales_60d: number;
  sales_90d: number;
  avg_ticket_90d: number;
}

export interface CustomerAlert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  date: string;
}

export interface FrequentProduct extends Product {
  last_purchase?: string;
  avg_qty?: number;
  purchase_count_90d?: number;
}

export interface RepurchaseSuggestion {
  id: string;
  customer_id: string;
  customer_name: string;
  product_id: string;
  product_tmpl_id?: string | number | null;
  sku?: string;
  product_name: string;
  category?: string;
  last_purchase_date: string | null;
  avg_frequency_days: number | null;
  days_since_last_purchase: number | null;
  score: number | null;
  urgency: "low" | "medium" | "high";
  urgency_label: string;
  reason: string;
  suggested_qty?: number | null;
  current_price?: number | null;
  available_qty?: number | null;
  can_add_to_order: boolean;
}

export interface RepurchaseSuggestionsResponse {
  ok: boolean;
  demo?: boolean;
  items: RepurchaseSuggestion[];
  error?: string;
}

export interface RecentOrder {
  id: string;
  date: string;
  amount: number;
  status: string;
  invoice_number?: string;
}

export interface Customer360Action {
  priority: "high" | "medium" | "low";
  title: string;
  reason: string;
  recommended_action: string;
  suggested_message: string;
  action_type: "call" | "whatsapp" | "visit" | "create_order" | "collect_payment" | "review_order";
}

export interface SuggestedRepurchaseItem {
  product_id: string;
  product_name: string;
  last_quantity: number;
  suggested_quantity: number;
  last_purchase_date: string;
  days_since_last_purchase: number;
  average_frequency_days: number;
  confidence: "high" | "medium" | "low";
}

export interface CrossSellOpportunity {
  product_id: string;
  product_name: string;
  reason: string;
  estimated_value: number;
}

export interface Customer360Data {
  ok: boolean;
  demo?: boolean;
  customer: {
    id?: string;
    customer_id: string;
    customer_name: string;
    commercial_name: string;
    nit: string;
    city: string;
    channel: string;
    segment: string;
    advisor_name: string;
    phone: string;
    address: string;
    latitude: number;
    longitude: number;
    customer_status: "active" | "at_risk" | "inactive" | "blocked";
  };
  commercial_status: {
    last_order_date: string;
    days_since_last_order: number;
    average_order_value: number;
    monthly_sales_current: number;
    monthly_sales_previous: number;
    sales_drop_percentage: number;
    purchase_frequency_days: number;
  };
  credit: {
    credit_limit: number;
    credit_used: number;
    credit_available: number;
    overdue_amount: number;
    next_due_date: string;
    credit_status: "ok" | "near_due" | "overdue" | "blocked";
  };
  proactive_recommendation: Customer360Action;
  suggested_repurchase_items: SuggestedRepurchaseItem[];
  cross_sell_opportunities: CrossSellOpportunity[];
  orders: {
    open_orders_count: number;
    last_orders: RecentOrder[];
    pending_delivery_count: number;
  };
}

export interface CustomerDashboardData {
  ok: boolean;
  demo?: boolean;
  customer: {
    id: string;
    name: string;
    commercial_name?: string;
    vat?: string;
    phone?: string;
    mobile?: string;
    street?: string;
    city?: string;
    latitude?: number | null;
    longitude?: number | null;
    pricelist_id?: string | number | null;
    pricelist_name?: string;
    advisor_id?: string | number | null;
    advisor_name?: string;
  };
  credit: CreditStatus;
  purchase_summary: PurchaseSummary;
  alerts: CustomerAlert[];
  frequent_products: FrequentProduct[];
  repurchase_suggestions: RepurchaseSuggestion[];
  recent_orders: RecentOrder[];
}

export interface OrderCartItem extends Product {
  qty: number;
  discount: number;
}

export interface CreateOrderPayload {
  customer_id: string;
  items: {
    product_id: string;
    qty: number;
    price: number;
    discount: number;
  }[];
  observation?: string;
  incidencia?: string;
}

export type VisitStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "skipped"
  | "not_validated";

export type VisitResultType =
  | "order_created"
  | "no_order"
  | "payment_followup"
  | "customer_closed"
  | "buyer_absent"
  | "claim"
  | "data_update"
  | "other";

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

export interface CommercialFeedbackEvent {
  id: string;
  advisor_id: string;
  advisor_name?: string;
  customer_id: string;
  customer_name: string;
  related_entity_type:
    | "next_best_action"
    | "customer_360"
    | "suggested_order"
    | "smart_route_visit"
    | "proactive_message"
    | "order"
    | "payment"
    | "manual_agent_feedback";
  related_entity_id?: string;
  strategy_type:
    | "repurchase"
    | "cross_sell"
    | "credit_collection"
    | "sales_drop_recovery"
    | "visit"
    | "suggested_order"
    | "payment_link"
    | "delivery_issue_resolution"
    | "relationship"
    | "manual";
  event_type:
    | "action_suggested"
    | "action_viewed"
    | "message_prepared"
    | "message_sent"
    | "whatsapp_opened"
    | "customer_contacted"
    | "order_draft_created"
    | "order_confirmed"
    | "suggested_order_confirmed"
    | "payment_registered"
    | "visit_started"
    | "visit_completed"
    | "action_dismissed"
    | "customer_response_captured"
    | "agent_feedback_captured"
    | "issue_escalated"
    | "follow_up_scheduled";
  outcome:
    | "unknown"
    | "positive"
    | "neutral"
    | "negative"
    | "order_won"
    | "payment_received"
    | "promise_to_pay"
    | "opportunity_open" | "opportunity_lost"
    | "no_response"
    | "rescheduled"
    | "issue_resolved"
    | "issue_escalated";
  customer_response?:
    | "accepted"
    | "interested"
    | "asked_for_later"
    | "asked_for_discount"
    | "needs_adjustment"
    | "rejected"
    | "no_response"
    | "not_available"
    | "complaint"
    | "paid"
    | "promise_to_pay"
    | "disputed"
    | "other";
  reason_code?:
    | "price"
    | "stock"
    | "credit_block"
    | "competitor"
    | "no_need"
    | "bad_timing"
    | "delivery_issue"
    | "service_issue"
    | "no_money"
    | "closed"
    | "other";
  value?: number;
  order_id?: string;
  order_total?: number;
  payment_amount?: number;
  promise_to_pay_date?: string;
  next_follow_up_date?: string;
  note?: string;
  source: "automatic" | "quick_reply" | "agent" | "manual";
  channel?: "whatsapp" | "phone" | "visit";
  created_at: string;
}

export type CommercialStrategyType = CommercialFeedbackEvent["strategy_type"];

export interface StrategyPerformanceSummary {
  strategy_type: CommercialStrategyType;
  label: string;
  period_start: string;
  period_end: string;
  actions_suggested: number;
  actions_executed: number;
  execution_rate: number;
  contacts_made: number;
  responses_received: number;
  response_rate: number;
  positive_responses: number;
  positive_response_rate: number;
  orders_created: number;
  order_conversion_rate: number;
  sales_value: number;
  payments_collected: number;
  collection_value: number;
  opportunities_open: number;
  opportunities_lost: number;
  loss_rate: number;
  top_objections: ObjectionSummary[];
  recommendation_quality_score?: number;
  trend?: "up" | "down" | "stable" | "unknown";
}

export interface ObjectionSummary {
  reason_code: NonNullable<CommercialFeedbackEvent["reason_code"]>;
  label: string;
  count: number;
  affected_sales_value?: number;
  affected_customers?: number;
}

export interface CommercialPerformanceSummary {
  period: "today" | "week" | "month";
  period_start: string;
  period_end: string;
  total_actions_suggested: number;
  total_actions_executed: number;
  execution_rate: number;
  total_contacts: number;
  total_responses: number;
  response_rate: number;
  total_orders_created: number;
  total_sales_value: number;
  total_payments_collected: number;
  total_collection_value: number;
  total_opportunities_open: number;
  total_opportunities_lost: number;
  top_strategy?: CommercialStrategyType;
  weakest_strategy?: CommercialStrategyType;
  top_objections: ObjectionSummary[];
  strategy_summaries: StrategyPerformanceSummary[];
  advisor_goal_alignment?: AdvisorGoalAlignment;
  generated_at: string;
}

export interface AdvisorGoalAlignment {
  advisor_id: string;
  period_start: string;
  period_end: string;
  sales_goal: number;
  sales_actual: number;
  sales_gap: number;
  sales_progress_percentage: number;
  proactive_sales_value: number;
  proactive_sales_percentage: number;
  collection_goal?: number;
  collection_actual?: number;
  collection_gap?: number;
  proactive_collection_value: number;
  proactive_actions_completed: number;
  customers_recovered: number;
  at_risk_customers_managed: number;
  visit_completion_rate: number;
  suggested_order_conversion_rate: number;
  message_conversion_rate: number;
  recommended_focus: string;
}

export interface CustomerLearningProfile {
  customer_id: string;
  preferred_channel: "whatsapp" | "phone" | "visit" | "unknown";
  preferred_contact_time?: string;
  best_response_pattern?: string;
  common_positive_triggers: string[];
  top_objections: string[];
  successful_strategies: string[];
  rejected_strategies: string[];
  price_sensitivity: "high" | "medium" | "low" | "unknown";
  service_sensitivity: "high" | "medium" | "low" | "unknown";
  credit_behavior:
    | "pays_on_time"
    | "pays_late"
    | "needs_reminder"
    | "frequent_promises"
    | "disputes_debt"
    | "unknown";
  response_rate: number;
  order_conversion_rate: number;
  suggested_order_hit_rate: number;
  payment_conversion_rate: number;
  last_feedback_summary: string;
  last_outcome_note?: string;
  recommended_contact_action: string;
  recommended_strategy: string;
  ai_confidence: number;
  updated_at: string;
}

export interface RouteVisit {
  id: string;
  advisor_id?: string | number;
  customer_id: string;
  customer_name: string;
  customer_vat?: string;
  customer_phone?: string;
  address?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;

  planned_date: string;
  planned_sequence: number;

  status: VisitStatus;

  checkin_time?: string | null;
  checkin_latitude?: number | null;
  checkin_longitude?: number | null;
  checkout_time?: string | null;
  checkout_latitude?: number | null;
  checkout_longitude?: number | null;

  distance_meters?: number | null;
  location_validated?: boolean;

  credit_status?: {
    status: "can_order" | "review" | "blocked";
    label: string;
    overdue_total?: number;
    max_days_overdue?: number;
  };

  commercial_alerts?: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    title: string;
    message: string;
  }>;

  repurchase_count?: number;
  last_order_date?: string | null;
  days_without_order?: number | null;

  result_type?: VisitResultType | null;
  result_note?: string | null;
  sale_order_id?: string | number | null;
}

export interface RouteTodayResponse {
  ok: boolean;
  demo?: boolean;
  date: string;
  error?: string;
  summary: {
    total_planned: number;
    completed: number;
    in_progress: number;
    pending: number;
    skipped: number;
    orders_created: number;
    validated_visits: number;
  };
  items: RouteVisit[];
}

export interface SuggestedOrderValidation {
  is_valid: boolean;
  severity: "info" | "warning" | "error" | "blocked";
  code: string;
  message: string;
  affected_product_ids?: string[];
  suggested_fix?: string;
}

export interface SuggestedOrderLine {
  product_id: string;
  product_code: string;
  product_name: string;
  category: string;
  brand?: string;
  quantity: number;
  suggested_quantity: number;
  previous_quantity?: number;
  unit_price: number;
  subtotal: number;
  available_stock: number;
  stock_status: "available" | "low_stock" | "out_of_stock" | "unknown";
  reason: string;
  source: "repurchase" | "cross_sell" | "promotion" | "last_order" | "manual";
  confidence: "high" | "medium" | "low";
  editable: boolean;
}

export interface SuggestedOrder {
  id: string;
  customer_id: string;
  customer_name: string;
  advisor_id: string;
  source: "repurchase" | "next_best_action" | "customer_360" | "last_order" | "route" | "smart_route" | "manual";
  status: "draft" | "validated" | "needs_review" | "blocked" | "confirmed";
  created_at: string;
  updated_at: string;
  subtotal: number;
  taxes: number;
  discounts: number;
  total: number;
  gross_margin_estimated?: number;
  validation_status: "valid" | "invalid" | "pending";
  validation_messages: SuggestedOrderValidation[];
  lines: SuggestedOrderLine[];
}

export interface SuggestedOrderResponse {
  ok: boolean;
  demo?: boolean;
  order?: SuggestedOrder;
  suggested_order?: SuggestedOrder;
  data?: SuggestedOrder;
  error?: string;
}

export interface VisitCheckInPayload {
  latitude: number;
  longitude: number;
  accuracy: number;
  distance_meters: number;
  location_validated: boolean;
  timestamp: string;
}

export interface VisitCheckOutPayload {
  latitude: number;
  longitude: number;
  accuracy: number;
  result_type: VisitResultType;
  result_note: string;
  timestamp: string;
}

export interface AgentFeedbackContext {
  current_customer_id?: string;
  current_customer_name?: string;
  known_customers?: Array<{ id: string; name: string }>;
  recent_actions?: any[];
  pending_feedback_prompts?: any[];
}

export interface ParsedAgentFeedback {
  confidence: "high" | "medium" | "low";
  needs_confirmation: boolean;
  missing_fields: string[];
  customer_id?: string;
  customer_name?: string;
  matched_customer_name?: string;
  strategy_type?: CommercialFeedbackEvent['strategy_type'];
  related_entity_type?: CommercialFeedbackEvent['related_entity_type'];
  related_entity_id?: string;
  event_type?: CommercialFeedbackEvent['event_type'];
  outcome?: CommercialFeedbackEvent['outcome'];
  customer_response?: CommercialFeedbackEvent['customer_response'];
  reason_code?: CommercialFeedbackEvent['reason_code'];
  value?: number;
  order_total?: number;
  payment_amount?: number;
  promise_to_pay_date?: string;
  next_follow_up_date?: string;
  note: string;
  suggested_question?: string;
  suggested_quick_options?: Array<{ label: string; value: string }>;
}
