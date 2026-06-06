import { CommercialFeedbackEvent, CustomerLearningProfile } from "../types";

export const analyzeCustomerLearning = (
  events: CommercialFeedbackEvent[],
  customer_id: string
): CustomerLearningProfile => {
  const customerEvents = events.filter(e => e.customer_id === customer_id);
  
  if (customerEvents.length === 0) {
    return {
      customer_id,
      preferred_channel: "unknown",
      common_positive_triggers: [],
      top_objections: [],
      successful_strategies: [],
      rejected_strategies: [],
      price_sensitivity: "unknown",
      service_sensitivity: "unknown",
      credit_behavior: "unknown",
      response_rate: 0,
      order_conversion_rate: 0,
      suggested_order_hit_rate: 0,
      payment_conversion_rate: 0,
      last_feedback_summary: "No hay suficiente historial de respuesta todavía.",
      recommended_contact_action: "Iniciar primer contacto para conocer al cliente.",
      recommended_strategy: "Venta consultiva",
      ai_confidence: 0,
      updated_at: new Date().toISOString()
    };
  }

  // 1. Channel Analysis
  const channels = {
    whatsapp: 0,
    visit: 0,
    phone: 0
  };

  customerEvents.forEach(e => {
    if (e.event_type === "whatsapp_opened" || e.event_type === "message_sent") channels.whatsapp++;
    if (e.event_type === "visit_completed" || e.event_type === "visit_started") channels.visit++;
    // phone calls could be manual or other sources
    if (e.source === "manual" && e.outcome === "positive") channels.phone++;
  });

  let preferred_channel: "whatsapp" | "phone" | "visit" | "unknown" = "unknown";
  if (channels.whatsapp > channels.visit && channels.whatsapp > channels.phone) preferred_channel = "whatsapp";
  else if (channels.visit > channels.whatsapp && channels.visit > channels.phone) preferred_channel = "visit";
  else if (channels.phone > 0) preferred_channel = "phone";

  // 2. Response Rates
  const contacts = customerEvents.filter(e => 
    ["message_sent", "whatsapp_opened", "visit_completed", "customer_contacted"].includes(e.event_type)
  ).length;
  
  const responses = customerEvents.filter(e => 
    ["accepted", "interested", "asked_for_later", "rejected", "paid", "promise_to_pay", "complaint"].includes(e.customer_response || "")
  ).length;

  const response_rate = contacts > 0 ? responses / contacts : 0;

  // 3. Conversions
  const salesActions = customerEvents.filter(e => 
    ["suggested_order", "repurchase", "cross_sell", "sales_drop_recovery"].includes(e.strategy_type || "")
  ).length;
  
  const ordersWon = customerEvents.filter(e => e.outcome === "order_won").length;
  const order_conversion_rate = salesActions > 0 ? ordersWon / salesActions : 0;

  const suggestedOrderActions = customerEvents.filter(e => e.strategy_type === "suggested_order").length;
  const suggestedOrderWins = customerEvents.filter(e => e.strategy_type === "suggested_order" && e.outcome === "order_won").length;
  const suggested_order_hit_rate = suggestedOrderActions > 0 ? suggestedOrderWins / suggestedOrderActions : 0;

  const collectionActions = customerEvents.filter(e => e.strategy_type === "credit_collection").length;
  const paymentsReceived = customerEvents.filter(e => e.outcome === "payment_received").length;
  const payment_conversion_rate = collectionActions > 0 ? paymentsReceived / collectionActions : 0;

  // 4. Objections and Sensitivities
  const objections: Record<string, number> = {};
  customerEvents.forEach(e => {
    if (e.reason_code) {
      objections[e.reason_code] = (objections[e.reason_code] || 0) + 1;
    }
  });

  const sortedObjections = Object.keys(objections).sort((a, b) => objections[b] - objections[a]);
  const top_objections = sortedObjections.slice(0, 3);

  const priceObjections = objections["price"] || 0;
  const competitorObjections = objections["competitor"] || 0;
  const deliveryObjections = objections["delivery_issue"] || 0;
  const serviceObjections = objections["service_issue"] || 0;

  let price_sensitivity: "high" | "medium" | "low" | "unknown" = "unknown";
  if (priceObjections + competitorObjections > 2) price_sensitivity = "high";
  else if (priceObjections + competitorObjections > 0) price_sensitivity = "medium";
  else if (customerEvents.length > 3) price_sensitivity = "low";

  let service_sensitivity: "high" | "medium" | "low" | "unknown" = "unknown";
  if (deliveryObjections + serviceObjections > 2) service_sensitivity = "high";
  else if (deliveryObjections + serviceObjections > 0) service_sensitivity = "medium";
  else if (customerEvents.length > 3) service_sensitivity = "low";

  // 5. Credit Behavior
  const promises = customerEvents.filter(e => e.outcome === "promise_to_pay").length;
  const disputes = customerEvents.filter(e => e.customer_response === "disputed").length;
  
  let credit_behavior: any = "unknown";
  if (disputes > 0) credit_behavior = "disputes_debt";
  else if (promises > 2) credit_behavior = "frequent_promises";
  else if (collectionActions > 0 && paymentsReceived === 0 && contacts > 0) credit_behavior = "needs_reminder";
  else if (paymentsReceived > 0) credit_behavior = "pays_on_time";

  // 6. Strategies
  const strategySuccess: Record<string, number> = {};
  const strategyRefusal: Record<string, number> = {};

  customerEvents.forEach(e => {
    if (e.strategy_type) {
      if (e.outcome === "positive" || e.outcome === "order_won" || e.outcome === "payment_received") {
        strategySuccess[e.strategy_type] = (strategySuccess[e.strategy_type] || 0) + 1;
      } else if (e.outcome === "negative" || e.outcome === "opportunity_lost" || e.customer_response === "rejected") {
        strategyRefusal[e.strategy_type] = (strategyRefusal[e.strategy_type] || 0) + 1;
      }
    }
  });

  const successful_strategies = Object.keys(strategySuccess).sort((a, b) => strategySuccess[b] - strategySuccess[a]).slice(0, 3);
  const rejected_strategies = Object.keys(strategyRefusal).sort((a, b) => strategyRefusal[b] - strategyRefusal[a]).slice(0, 3);

  // 7. Recommendations and Summary
  let recommended_contact_action = "Contactar por WhatsApp para seguimiento.";
  if (preferred_channel === "visit") recommended_contact_action = "Priorizar visita presencial para cierre.";
  if (service_sensitivity === "high") recommended_contact_action = "Resolver novedades de servicio antes de vender.";

  let recommended_strategy = "Recompra sugerida";
  if (successful_strategies.length > 0) recommended_strategy = successful_strategies[0];
  if (price_sensitivity === "high") recommended_strategy = "Venta con descuento/promocional";

  const lastEvent = customerEvents[customerEvents.length - 1];
  const last_feedback_summary = lastEvent.note || `Última interacción: ${lastEvent.event_type} (${lastEvent.outcome})`;

  return {
    customer_id,
    preferred_channel,
    common_positive_triggers: successful_strategies,
    top_objections,
    successful_strategies,
    rejected_strategies,
    price_sensitivity,
    service_sensitivity,
    credit_behavior,
    response_rate,
    order_conversion_rate,
    suggested_order_hit_rate,
    payment_conversion_rate,
    last_feedback_summary,
    recommended_contact_action,
    recommended_strategy,
    ai_confidence: customerEvents.length > 5 ? 0.9 : 0.6,
    updated_at: new Date().toISOString()
  };
};
