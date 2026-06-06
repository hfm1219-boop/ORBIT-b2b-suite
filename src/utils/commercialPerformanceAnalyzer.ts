import { 
  CommercialFeedbackEvent, 
  CommercialPerformanceSummary, 
  StrategyPerformanceSummary, 
  ObjectionSummary,
  CommercialStrategyType,
  AdvisorGoalAlignment
} from '../types';

export function buildCommercialPerformanceSummary(
  events: CommercialFeedbackEvent[], 
  options: { period: "today" | "week" | "month", advisor_id: string }
): CommercialPerformanceSummary {
  const { period, advisor_id } = options;
  const now = new Date();
  let periodStart = new Date();
  
  if (period === 'today') {
    periodStart.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    periodStart.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    periodStart.setDate(now.getDate() - 30);
  }

  const periodEvents = events.filter(e => new Date(e.created_at) >= periodStart);
  
  // Strategy types to track
  const strategyTypes: CommercialStrategyType[] = [
    "repurchase", "suggested_order", "cross_sell", "credit_collection", 
    "sales_drop_recovery", "visit", "payment_link", "delivery_issue_resolution", 
    "relationship", "manual"
  ];

  const strategyLabels: Record<string, string> = {
    repurchase: "Recompra",
    suggested_order: "Pedido Sugerido",
    cross_sell: "Venta Cruzada",
    credit_collection: "Cartera",
    sales_drop_recovery: "Recuperación",
    visit: "Visitas",
    payment_link: "Link de Pago",
    delivery_issue_resolution: "Novedades",
    relationship: "Relación",
    manual: "Manual"
  };

  const objectionLabels: Record<string, string> = {
    price: "Precio",
    stock: "Stock",
    credit_block: "Cartera Bloqueada",
    competitor: "Competencia",
    no_need: "No necesita",
    bad_timing: "Mal momento",
    delivery_issue: "Entrega",
    service_issue: "Servicio",
    no_money: "Sin dinero",
    closed: "Cerrado",
    other: "Otro"
  };

  const strategySummaries: StrategyPerformanceSummary[] = strategyTypes.map(type => {
    const sEvents = periodEvents.filter(e => e.strategy_type === type);
    
    const suggested = sEvents.filter(e => e.event_type === 'action_suggested').length;
    const executed = sEvents.filter(e => [
      'action_completed', 'message_sent', 'whatsapp_opened', 
      'order_draft_created', 'order_confirmed', 'suggested_order_confirmed', 
      'payment_registered', 'visit_completed', 'customer_contacted'
    ].includes(e.event_type)).length;

    const contacts = sEvents.filter(e => [
      'message_sent', 'whatsapp_opened', 'customer_contacted', 'visit_completed'
    ].includes(e.event_type)).length;

    const responses = sEvents.filter(e => e.customer_response && e.customer_response !== 'no_response').length;
    const positive = sEvents.filter(e => ['accepted', 'interested', 'paid', 'promise_to_pay'].includes(e.customer_response || '') || ['order_won', 'payment_received', 'opportunity_open', 'positive'].includes(e.outcome)).length;
    
    const orders = sEvents.filter(e => ['order_confirmed', 'suggested_order_confirmed'].includes(e.event_type) || e.outcome === 'order_won').length;
    const salesValue = sEvents.reduce((acc, e) => acc + (e.order_total || e.value || 0), 0);
    
    const payments = sEvents.filter(e => e.event_type === 'payment_registered' || e.outcome === 'payment_received').length;
    const collectionValue = sEvents.reduce((acc, e) => acc + (e.payment_amount || 0), 0);
    
    const open = sEvents.filter(e => e.outcome === 'opportunity_open').length;
    const lost = sEvents.filter(e => e.outcome === 'opportunity_lost' || e.customer_response === 'rejected' || e.event_type === 'action_dismissed').length;

    // Objections for this strategy
    const objectionsMap: Record<string, number> = {};
    sEvents.forEach(e => {
      if (e.reason_code) {
        objectionsMap[e.reason_code] = (objectionsMap[e.reason_code] || 0) + 1;
      }
    });

    const topObjections: ObjectionSummary[] = Object.entries(objectionsMap)
      .map(([code, count]) => ({
        reason_code: code as any,
        label: objectionLabels[code] || code,
        count
      }))
      .sort((a, b) => b.count - a.count);

    return {
      strategy_type: type,
      label: strategyLabels[type] || type,
      period_start: periodStart.toISOString(),
      period_end: now.toISOString(),
      actions_suggested: suggested,
      actions_executed: executed,
      execution_rate: suggested > 0 ? executed / suggested : 0,
      contacts_made: contacts,
      responses_received: responses,
      response_rate: contacts > 0 ? responses / contacts : 0,
      positive_responses: positive,
      positive_response_rate: responses > 0 ? positive / responses : 0,
      orders_created: orders,
      order_conversion_rate: executed > 0 ? orders / executed : 0,
      sales_value: salesValue,
      payments_collected: payments,
      collection_value: collectionValue,
      opportunities_open: open,
      opportunities_lost: lost,
      loss_rate: (orders + lost) > 0 ? lost / (orders + lost) : 0,
      top_objections: topObjections,
      trend: "stable"
    };
  });

  const totalSuggested = strategySummaries.reduce((acc, s) => acc + s.actions_suggested, 0);
  const totalExecuted = strategySummaries.reduce((acc, s) => acc + s.actions_executed, 0);
  const totalContacts = strategySummaries.reduce((acc, s) => acc + s.contacts_made, 0);
  const totalResponses = strategySummaries.reduce((acc, s) => acc + s.responses_received, 0);
  const totalOrders = strategySummaries.reduce((acc, s) => acc + s.orders_created, 0);
  const totalSalesValue = strategySummaries.reduce((acc, s) => acc + s.sales_value, 0);
  const totalPayments = strategySummaries.reduce((acc, s) => acc + s.payments_collected, 0);
  const totalCollectionValue = strategySummaries.reduce((acc, s) => acc + s.collection_value, 0);
  const totalOpen = strategySummaries.reduce((acc, s) => acc + s.opportunities_open, 0);
  const totalLost = strategySummaries.reduce((acc, s) => acc + s.opportunities_lost, 0);

  // Global objections
  const globalObjectionsMap: Record<string, number> = {};
  periodEvents.forEach(e => {
    if (e.reason_code) {
      globalObjectionsMap[e.reason_code] = (globalObjectionsMap[e.reason_code] || 0) + 1;
    }
  });

  const globalTopObjections: ObjectionSummary[] = Object.entries(globalObjectionsMap)
    .map(([code, count]) => ({
      reason_code: code as any,
      label: objectionLabels[code] || code,
      count
    }))
    .sort((a, b) => b.count - a.count);

  const topStrategy = [...strategySummaries]
    .sort((a, b) => b.sales_value - a.sales_value || b.order_conversion_rate - a.order_conversion_rate)[0]?.strategy_type;
  
  const healthiestStrategy = strategySummaries.filter(s => s.actions_executed > 1);
  const weakestStrategy = healthiestStrategy.length > 0 
    ? [...healthiestStrategy].sort((a, b) => a.order_conversion_rate - b.order_conversion_rate || b.loss_rate - a.loss_rate)[0]?.strategy_type
    : undefined;

  // Mock goal alignment
  const salesGoal = 125000000; // 125M monthly goal example
  const salesActual = totalSalesValue + (period === 'month' ? 85000000 : period === 'week' ? 25000000 : 5000000);
  const salesGap = Math.max(0, salesGoal - salesActual);
  
  const goalAlignment: AdvisorGoalAlignment = {
    advisor_id: advisor_id,
    period_start: periodStart.toISOString(),
    period_end: now.toISOString(),
    sales_goal: salesGoal,
    sales_actual: salesActual,
    sales_gap: salesGap,
    sales_progress_percentage: salesActual / salesGoal,
    proactive_sales_value: totalSalesValue,
    proactive_sales_percentage: salesActual > 0 ? totalSalesValue / salesActual : 0,
    collection_goal: 80000000,
    collection_actual: totalCollectionValue + (period === 'month' ? 45000000 : 2000000),
    collection_gap: 0,
    proactive_collection_value: totalCollectionValue,
    proactive_actions_completed: totalExecuted,
    customers_recovered: strategySummaries.find(s => s.strategy_type === 'sales_drop_recovery')?.orders_created || 0,
    at_risk_customers_managed: periodEvents.filter(e => e.strategy_type === 'sales_drop_recovery').length,
    visit_completion_rate: strategySummaries.find(s => s.strategy_type === 'visit')?.execution_rate || 0.85,
    suggested_order_conversion_rate: strategySummaries.find(s => s.strategy_type === 'suggested_order')?.order_conversion_rate || 0,
    message_conversion_rate: totalContacts > 0 ? totalOrders / totalContacts : 0,
    recommended_focus: totalSalesValue > 0 ? "Continúa con la estrategia de Recompra, es tu canal más fuerte." : "Enfócate en Recombra y Pedidos Sugeridos para cerrar tu brecha de ventas."
  };

  return {
    period,
    period_start: periodStart.toISOString(),
    period_end: now.toISOString(),
    total_actions_suggested: totalSuggested,
    total_actions_executed: totalExecuted,
    execution_rate: totalSuggested > 0 ? totalExecuted / totalSuggested : 0,
    total_contacts: totalContacts,
    total_responses: totalResponses,
    response_rate: totalContacts > 0 ? totalResponses / totalContacts : 0,
    total_orders_created: totalOrders,
    total_sales_value: totalSalesValue,
    total_payments_collected: totalPayments,
    total_collection_value: totalCollectionValue,
    total_opportunities_open: totalOpen,
    total_opportunities_lost: totalLost,
    top_strategy: topStrategy,
    weakest_strategy: weakestStrategy,
    top_objections: globalTopObjections,
    strategy_summaries: strategySummaries,
    advisor_goal_alignment: goalAlignment,
    generated_at: now.toISOString()
  };
}
