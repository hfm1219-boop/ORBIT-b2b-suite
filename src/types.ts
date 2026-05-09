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
