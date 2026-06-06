import { PriorityScore, CustomerSignal, BusinessRule, ScoringConfig } from '../types';
import { analyzeCustomerLearning } from './customerLearningAnalyzer';

export const DEFAULT_DYNAMIC_RULES: BusinessRule[] = [
  {
    id: "R1",
    name: "Recompra Atrasada",
    description: "Detecta cuando un cliente supera su frecuencia de compra habitual.",
    active: true,
    category: "sales",
    signal_type: "repurchase_due",
    weight: 30,
    severity: "high",
    condition_description: "days_since_last_order > purchase_frequency_days",
    action_recommendation: "Crear pedido sugerido",
    blocks_order: false,
    creates_message: true,
    creates_route_priority: true
  },
  {
    id: "R2",
    name: "Cartera Vencida",
    description: "Detecta facturas con mora mayor a 1 día.",
    active: true,
    category: "credit",
    signal_type: "credit_overdue",
    weight: 35,
    severity: "critical",
    condition_description: "overdue_amount > 0",
    action_recommendation: "Gestionar pago inmediato",
    blocks_order: true,
    creates_message: true,
    creates_route_priority: true
  },
  {
    id: "R3",
    name: "Caída de Venta",
    description: "Caída significativa en el volumen de compra mensual.",
    active: true,
    category: "retention",
    signal_type: "sales_drop",
    weight: 25,
    severity: "high",
    condition_description: "sales_drop_percentage >= 30%",
    action_recommendation: "Visita de fidelización",
    blocks_order: false,
    creates_message: true,
    creates_route_priority: true
  }
];

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  id: "CONF-01",
  name: "Dismel Standard v1",
  active: true,
  version: "1.0",
  rules: DEFAULT_DYNAMIC_RULES,
  priority_thresholds: {
    critical_min: 85,
    high_min: 60,
    medium_min: 35,
    low_min: 0
  },
  updated_at: new Date().toISOString()
};

export function calculatePriorityScore(customer: any, rules: BusinessRule[] = DEFAULT_DYNAMIC_RULES): PriorityScore {
  const signals: CustomerSignal[] = [];
  let totalScore = 0;
  let feedbackAdjustment = 0;
  const now = new Date().toISOString();
  const nowMs = new Date().getTime();
  
  // Simplified feedback lookup for demo
  const feedbackEvents = JSON.parse(localStorage.getItem('demo_feedback_events') || '[]');
  const customerFeedback = feedbackEvents.filter((e: any) => e.customer_id === customer.id);
  
  // Use analyzer for deeper insights
  const learningProfile = analyzeCustomerLearning(customerFeedback, customer.id);

  // Helper to check for active delivery/service issues
  const hasActiveIssue = customerFeedback.some(e => 
    (e.event_type === 'issue_escalated' || e.reason_code === 'delivery_issue' || e.reason_code === 'service_issue') &&
    e.outcome !== 'issue_resolved' &&
    new Date(e.created_at).getTime() > nowMs - 7 * 24 * 3600 * 1000 // Last 7 days
  );

  // Helper for recent negative feedback (72h)
  const recentNegative = customerFeedback.filter(e => 
    (e.outcome === 'negative' || e.outcome === 'opportunity_lost' || e.customer_response === 'rejected' || e.customer_response === 'complaint') &&
    new Date(e.created_at).getTime() > nowMs - 72 * 3600 * 1000
  );

  // Helper for recent positive feedback (72h)
  const recentPositive = customerFeedback.filter(e => 
    (e.outcome === 'positive' || e.outcome === 'order_won' || e.outcome === 'payment_received' || e.customer_response === 'accepted' || e.customer_response === 'interested') &&
    new Date(e.created_at).getTime() > nowMs - 72 * 3600 * 1000
  );

  const strategyWarnings: string[] = [];
  let recommendedChannel: "whatsapp" | "phone" | "visit" | undefined = learningProfile.preferred_channel !== "unknown" ? learningProfile.preferred_channel : undefined;

  // RULE A & B: Conversions
  const convertedRepurchase = learningProfile.successful_strategies.includes('repurchase');
  const convertedSuggested = learningProfile.successful_strategies.includes('suggested_order');
  
  // 1. REPURCHASE RULE (CORE)
  if (customer.has_sales_drop || (customer.last_order_days > 8)) {
    let score = 30 + (customer.last_order_days > 12 ? 10 : 0);
    
    if (convertedRepurchase) {
      score += 15;
      signals.push({
        id: `SIG-REP-CONV-${customer.id}`,
        customer_id: customer.id,
        signal_type: "repurchase_converted_before",
        severity: "info",
        score: 15,
        title: "Recompra ha funcionado antes",
        description: "Este cliente ha convertido recomendaciones de recompra en pedidos anteriormente.",
        evidence: [{ label: "Tasa éxito", value: `${Math.round(learningProfile.order_conversion_rate * 100)}%` }],
        created_at: now,
        source: "demo"
      });
    }

    if (recentNegative.some(e => e.strategy_type === 'repurchase')) {
      score -= 10;
      feedbackAdjustment -= 10;
    }

    totalScore += score;
    signals.push({
      id: `SIG-REP-${customer.id}`,
      customer_id: customer.id,
      signal_type: "repurchase_due",
      severity: score > 40 ? "high" : "medium",
      score: score,
      title: "Recompra Atrasada",
      description: `El cliente no compra hace ${customer.last_order_days} días. Su frecuencia es cada 8 días.`,
      evidence: [
        { label: "Días de retraso", value: Math.max(0, customer.last_order_days - 8) },
        { label: "Última compra", value: customer.last_order_date || 'Hace 12 días' }
      ],
      created_at: now,
      source: "odoo_sales"
    });
  }

  // 2. CREDIT RULES (CORE)
  if (customer.has_credit_issue || (customer.debt_overdue > 0)) {
    let score = 35 + (customer.debt_overdue > 2000000 ? 15 : 0);
    
    // Check for broken promises
    const brokenPromise = customerFeedback.find(e => 
      e.outcome === 'promise_to_pay' && 
      e.promise_to_pay_date && 
      new Date(e.promise_to_pay_date).getTime() < nowMs &&
      !recentPositive.some(p => p.outcome === 'payment_received')
    );

    if (brokenPromise) {
      score += 25;
      signals.push({
        id: `SIG-CRE-BROKEN-${customer.id}`,
        customer_id: customer.id,
        signal_type: "promise_to_pay_broken",
        severity: "critical",
        score: 25,
        title: "Promesa Incumplida",
        description: `El cliente incumplió promesa de pago del ${new Date(brokenPromise.promise_to_pay_date!).toLocaleDateString()}.`,
        evidence: [{ label: "Fecha pactada", value: brokenPromise.promise_to_pay_date! }],
        created_at: now,
        source: "agent"
      });
    } else {
      // Pending promise?
      const pendingPromise = customerFeedback.find(e => 
        e.outcome === 'promise_to_pay' && 
        e.promise_to_pay_date && 
        new Date(e.promise_to_pay_date).getTime() >= nowMs - (new Date(e.promise_to_pay_date).getHours() * 3600000) // Today or future
      );
      if (pendingPromise) {
        score += 20;
        signals.push({
          id: `SIG-CRE-PENDING-${customer.id}`,
          customer_id: customer.id,
          signal_type: "promise_to_pay_pending",
          severity: "high",
          score: 20,
          title: "Promesa de Pago Pendiente",
          description: `El cliente tiene un compromiso de pago para el ${new Date(pendingPromise.promise_to_pay_date!).toLocaleDateString()}.`,
          evidence: [{ label: "Fecha promesa", value: pendingPromise.promise_to_pay_date! }],
          created_at: now,
          source: "agent"
        });
      }
    }

    totalScore += score;
    signals.push({
      id: `SIG-CRE-${customer.id}`,
      customer_id: customer.id,
      signal_type: "credit_overdue",
      severity: "critical",
      score: score,
      title: "Cartera Vencida",
      description: `Posee facturas vencidas por ${customer.debt_overdue || '$1.200.000'}.`,
      evidence: [
        { label: "Monto", value: customer.debt_overdue || 1200000, unit: "COP" }
      ],
      created_at: now,
      source: "odoo_credit"
    });
  } else if (recentPositive.some(e => e.outcome === 'payment_received')) {
    totalScore += 5;
    signals.push({
      id: `SIG-CRE-POS-${customer.id}`,
      customer_id: customer.id,
      signal_type: "payment_behavior_positive",
      severity: "info",
      score: 5,
      title: "Buen Comportamiento de Pago",
      description: "Pago reciente recibido. Cartera en orden.",
      evidence: [],
      created_at: now,
      source: "demo"
    });
  }

  // 3. OTHER FEEDBACK RULES
  
  // Strategy Fatigue
  const repurchaseRecent = customerFeedback.filter(e => e.strategy_type === 'repurchase' && new Date(e.created_at).getTime() > nowMs - 48 * 3600000);
  if (repurchaseRecent.length >= 3 && !recentPositive.some(e => e.strategy_type === 'repurchase')) {
    totalScore -= 10;
    feedbackAdjustment -= 10;
    strategyWarnings.push("Fatiga de estrategia: Recompra intentada varias veces sin éxito.");
    signals.push({
      id: `SIG-FATIGUE-${customer.id}`,
      customer_id: customer.id,
      signal_type: "strategy_fatigue",
      severity: "low",
      score: -10,
      title: "Fatiga de Estrategia",
      description: "Se han intentado múltiples contactos de recompra recientemente sin conversión.",
      evidence: [{ label: "Intentos 48h", value: repurchaseRecent.length }],
      created_at: now,
      source: "demo"
    });
  }

  // Active Issue
  if (hasActiveIssue) {
    totalScore += 25;
    signals.push({
      id: `SIG-ISSUE-${customer.id}`,
      customer_id: customer.id,
      signal_type: "delivery_issue_active",
      severity: "critical",
      score: 25,
      title: "Novedad de Servicio Activa",
      description: "El cliente tiene una queja o problema de entrega pendiente por resolver.",
      evidence: [{ label: "Tipo", value: "Entrega / Logística" }],
      created_at: now,
      source: "agent"
    });
    strategyWarnings.push("Resolver novedad antes de vender.");
  }

  // WhatsApp Response
  if (learningProfile.preferred_channel === "whatsapp" && learningProfile.response_rate < 0.25 && customerFeedback.length > 5) {
    strategyWarnings.push("El cliente rara vez responde por WhatsApp.");
    signals.push({
      id: `SIG-WA-NO-${customer.id}`,
      customer_id: customer.id,
      signal_type: "whatsapp_no_response",
      severity: "low",
      score: -10,
      title: "Baja respuesta WhatsApp",
      description: "El cliente tiene una tasa de respuesta muy baja por este canal.",
      evidence: [{ label: "Tasa resp.", value: `${Math.round(learningProfile.response_rate * 100)}%` }],
      created_at: now,
      source: "demo"
    });
    recommendedChannel = "visit"; // Recommend visit instead
  }

  // Price Sensitivity
  if (learningProfile.price_sensitivity === 'high' || customerFeedback.some(e => e.reason_code === 'price' || e.reason_code === 'competitor')) {
    signals.push({
      id: `SIG-PRICE-${customer.id}`,
      customer_id: customer.id,
      signal_type: "price_objection_repeated",
      severity: "medium",
      score: -5,
      title: "Objeción de Precio Repetida",
      description: "El cliente ha manifestado repetidamente incomodidad con los precios o competencia.",
      evidence: [{ label: "Nivel", value: "Alto" }],
      created_at: now,
      source: "demo"
    });
    strategyWarnings.push("Sensible al precio: Revisar descuentos o promociones.");
  }

  // Determine Priority
  let priority: PriorityScore["priority"] = "low";
  if (totalScore >= 85) priority = "critical";
  else if (totalScore >= 60) priority = "high";
  else if (totalScore >= 35) priority = "medium";

  // Determine Recommended Action
  let action_type: PriorityScore["recommended_action_type"] = "no_action";
  let action_text = "Sin acción requerida";

  // Action Logic
  if (hasActiveIssue) {
    action_type = "resolve_issue";
    action_text = "Resolver novedad de servicio";
  } else if (customer.debt_overdue > 0) {
    action_type = "collect_payment";
    action_text = "Gestionar pago de cartera";
  } else if (totalScore > 0) {
    if (learningProfile.recommended_contact_action.includes("WhatsApp") && learningProfile.response_rate > 0.4) {
      action_type = "send_message";
      action_text = "Enviar mensaje de recompra";
    } else if (recommendedChannel === "visit" || totalScore > 70) {
      action_type = "visit";
      action_text = "Programar visita presencial";
    } else {
      action_type = "create_order";
      action_text = "Preparar pedido sugerido";
    }
  }

  // Adjustment logic for specific cases
  if (learningProfile.price_sensitivity === 'high' && action_type === 'create_order') {
    action_type = "review_order";
    action_text = "Revisar condiciones antes de contactar";
  }

  // Confidence
  let confidence: PriorityScore["confidence"] = "medium";
  if (signals.some(s => s.signal_type.includes('converted_before')) && totalScore > 50) confidence = "high";
  if (recentNegative.length > 2 || hasActiveIssue) confidence = "low";

  // Feedback Summary
  let feedback_summary = "";
  if (convertedRepurchase) feedback_summary += "Ha convertido recompras antes. ";
  if (learningProfile.price_sensitivity === 'high') feedback_summary += "Alta sensibilidad al precio. ";
  if (hasActiveIssue) feedback_summary += "Queja activa por entrega. ";

  return {
    customer_id: customer.id,
    customer_name: customer.name,
    total_score: totalScore,
    priority,
    confidence,
    recommended_action_type: action_type,
    recommended_action: action_text,
    explanation: `Prioridad ${priority} ajustada por comportamiento histórico y señales actuales.`,
    signals,
    score_breakdown: signals.map(s => ({
      signal_type: s.signal_type,
      label: s.title,
      score: s.score,
      weight: 1,
      contribution: s.score,
      explanation: s.description
    })),
    calculated_at: now,
    feedback_adjustment_score: feedbackAdjustment,
    feedback_confidence_adjustment: confidence === 'high' ? 20 : confidence === 'low' ? -20 : 0,
    feedback_summary: feedback_summary.trim(),
    recommended_channel: recommendedChannel,
    strategy_warnings: strategyWarnings
  };
}
