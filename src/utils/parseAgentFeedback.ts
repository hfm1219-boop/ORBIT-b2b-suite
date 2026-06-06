import { AgentFeedbackContext, ParsedAgentFeedback, CommercialFeedbackEvent } from "../types";
import { dateTextParser } from "./dateTextParser";
import { moneyTextParser } from "./moneyTextParser";

export const parseAgentFeedback = (input: string, context?: AgentFeedbackContext): ParsedAgentFeedback => {
  const lower = input.toLowerCase();
  const parsed: ParsedAgentFeedback = {
    confidence: "low",
    needs_confirmation: false,
    missing_fields: [],
    note: input
  };

  // 1. Resolve Customer
  let customerId = context?.current_customer_id;
  let customerName = context?.current_customer_name;
  let matchedName = "";

  if (context?.known_customers) {
    for (const customer of context.known_customers) {
      const nameParts = customer.name.toLowerCase().split(' ');
      // Check if a significant part of the name is present (excluding short words like 'SAS', 'S.A.')
      const significantParts = nameParts.filter(p => p.length > 3 && !['business', 'gourmet'].includes(p));
      
      const isMatch = lower.includes(customer.name.toLowerCase()) || 
                      significantParts.some(part => lower.includes(part));

      if (isMatch) {
        customerId = customer.id;
        customerName = customer.name;
        matchedName = customer.name;
        break;
      }
    }
  }

  if (customerId) {
    parsed.customer_id = customerId;
    parsed.customer_name = customerName;
    parsed.matched_customer_name = matchedName;
  } else {
    parsed.missing_fields.push("customer");
    parsed.needs_confirmation = true;
    parsed.suggested_question = "¿De qué cliente estás hablando?";
    parsed.suggested_quick_options = context?.known_customers?.slice(0, 4).map(c => ({ label: c.name, value: c.id }));
  }

  // 2. Identify Intent
  
  // A. Promise to Pay
  if (lower.includes("prometió pagar") || lower.includes("paga") || lower.includes("quedó de pagar")) {
    parsed.strategy_type = "credit_collection";
    parsed.event_type = "agent_feedback_captured";
    parsed.outcome = "promise_to_pay";
    parsed.customer_response = "promise_to_pay";
    parsed.related_entity_type = "payment";
    
    const date = dateTextParser.parseRelativeDate(lower);
    if (date) {
      parsed.promise_to_pay_date = date;
      parsed.next_follow_up_date = date;
      parsed.confidence = "high";
    } else {
      parsed.confidence = "medium";
      if (!parsed.needs_confirmation) {
        parsed.needs_confirmation = true;
        parsed.missing_fields.push("date");
        parsed.suggested_question = "¿Para qué fecha prometió pagar?";
        parsed.suggested_quick_options = [
          { label: "Mañana", value: "mañana" },
          { label: "Viernes", value: "viernes" },
          { label: "Lunes", value: "lunes" }
        ];
      }
    }
  }

  // B. Payment Received
  else if (lower.includes("pagó") || lower.includes("transfirió") || lower.includes("canceló la factura")) {
    parsed.strategy_type = "credit_collection";
    parsed.event_type = "payment_registered";
    parsed.outcome = "payment_received";
    parsed.customer_response = "paid";
    parsed.related_entity_type = "payment";
    
    const amount = moneyTextParser.parseMoney(lower);
    if (amount) {
      parsed.payment_amount = amount;
      parsed.value = amount;
      parsed.confidence = "high";
    } else {
      parsed.confidence = "medium";
    }
  }

  // C. Order Won
  else if (lower.includes("compró") || lower.includes("monté pedido") || lower.includes("confirmó pedido") || lower.includes("aceptó")) {
    parsed.outcome = "order_won";
    parsed.customer_response = "accepted";
    parsed.event_type = "order_confirmed";
    parsed.related_entity_type = "order";
    
    if (lower.includes("sugerido")) {
      parsed.strategy_type = "suggested_order";
    } else if (lower.includes("recompra")) {
      parsed.strategy_type = "repurchase";
    } else {
      parsed.strategy_type = "manual";
    }
    parsed.confidence = "high";

    const amount = moneyTextParser.parseMoney(lower);
    if (amount) {
      parsed.order_total = amount;
      parsed.value = amount;
    }
  }

  // D. Interested / Follow up
  else if (lower.includes("interesado") || lower.includes("cotización") || lower.includes("propuesta") || lower.includes("revisar") || lower.includes("pensar")) {
    parsed.outcome = "opportunity_open";
    parsed.customer_response = "interested";
    parsed.event_type = "agent_feedback_captured";
    parsed.confidence = "medium";

    if (lower.includes("mixers") || lower.includes("gin") || lower.includes("tónica") || lower.includes("cristalería")) {
      parsed.strategy_type = "cross_sell";
    }

    const date = dateTextParser.parseRelativeDate(lower);
    if (date) {
        parsed.next_follow_up_date = date;
    }
  }

  // E. Price Objection / Discount
  else if (lower.includes("descuento") || lower.includes("caro") || lower.includes("precio")) {
    parsed.customer_response = "asked_for_discount";
    parsed.reason_code = "price";
    parsed.outcome = "opportunity_open";
    parsed.event_type = "agent_feedback_captured";
    parsed.confidence = "medium";
    
    if (lower.includes("competidor") || lower.includes("competencia") || lower.includes("otro")) {
      parsed.reason_code = "competitor";
    }
  }

  // F. Later / Reschedule
  else if (lower.includes("no necesita") || lower.includes("por ahora no") || lower.includes("después") || lower.includes("despues") || lower.includes("más adelante")) {
    parsed.customer_response = "asked_for_later";
    parsed.reason_code = "no_need";
    parsed.outcome = "rescheduled";
    parsed.event_type = "agent_feedback_captured";
    
    if (lower.includes("no necesita")) parsed.reason_code = "no_need";
    else parsed.reason_code = "bad_timing";

    const date = dateTextParser.parseRelativeDate(lower);
    if (date) {
      parsed.next_follow_up_date = date;
      parsed.confidence = "high";
    } else {
      parsed.confidence = "medium";
    }
  }

  // G. No response / Not available
  else if (lower.includes("no respondió") || lower.includes("no contestó") || lower.includes("no estaba") || lower.includes("cerrado")) {
    parsed.outcome = "no_response";
    parsed.customer_response = "no_response";
    parsed.event_type = "agent_feedback_captured";
    
    if (lower.includes("not available") || lower.includes("no estaba")) parsed.customer_response = "not_available";
    if (lower.includes("cerrado")) parsed.reason_code = "closed";
    
    parsed.confidence = "high";
  }

  // H. Complaint / Issue
  else if (lower.includes("molesto") || lower.includes("quejó") || lower.includes("problema") || lower.includes("averiado") || lower.includes("no le llegó")) {
    parsed.strategy_type = "delivery_issue_resolution";
    parsed.event_type = "issue_escalated";
    parsed.outcome = "issue_escalated";
    parsed.customer_response = "complaint";
    parsed.reason_code = lower.includes("entrega") ? "delivery_issue" : "service_issue";
    parsed.confidence = "high";
  }

  return parsed;
};
