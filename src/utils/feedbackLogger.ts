import { feedbackService } from "../services/feedbackService";
import { CommercialFeedbackEvent } from "../types";

export const feedbackLogger = {
  logActionViewed: (customerId: string, customerName: string, actionId: string, source?: string) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: "next_best_action",
      related_entity_id: actionId,
      event_type: "action_viewed",
      outcome: "unknown",
      note: source ? `Source: ${source}` : undefined,
      source: "automatic"
    });
  },

  logActionStarted: (customerId: string, customerName: string, actionType: CommercialFeedbackEvent['related_entity_type'], actionId?: string) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: actionType,
      related_entity_id: actionId,
      event_type: "visit_started", // Reusing visit_started for any action start
      outcome: "unknown",
      source: "automatic"
    });
  },

  logCustomer360Opened: (customerId: string, customerName: string, sourceEntityType?: CommercialFeedbackEvent['related_entity_type'], sourceEntityId?: string) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: sourceEntityType || "customer_360",
      related_entity_id: sourceEntityId,
      event_type: "action_viewed",
      outcome: "unknown",
      source: "automatic"
    });
  },

  logMessagePrepared: (customerId: string, customerName: string, entityType: CommercialFeedbackEvent['related_entity_type'], entityId?: string) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: entityType,
      related_entity_id: entityId,
      event_type: "message_prepared",
      outcome: "unknown",
      source: "automatic"
    });
  },

  logWhatsAppOpened: (customerId: string, customerName: string, entityType: CommercialFeedbackEvent['related_entity_type'], entityId?: string) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: entityType,
      related_entity_id: entityId,
      event_type: "whatsapp_opened",
      outcome: "unknown",
      source: "automatic"
    });
  },

  logMessageApproved: (customerId: string, customerName: string, entityType: CommercialFeedbackEvent['related_entity_type'], entityId?: string) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: entityType,
      related_entity_id: entityId,
      event_type: "message_prepared", // Map to prepared but could be a specific one
      outcome: "positive",
      source: "automatic"
    });
  },

  logMessageSent: (customerId: string, customerName: string, entityType: CommercialFeedbackEvent['related_entity_type'], entityId?: string) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: entityType,
      related_entity_id: entityId,
      event_type: "message_sent",
      outcome: "unknown",
      source: "automatic"
    });
  },

  logMessageDiscarded: (customerId: string, customerName: string, entityType: CommercialFeedbackEvent['related_entity_type'], entityId?: string, reason?: CommercialFeedbackEvent['reason_code']) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: entityType,
      related_entity_id: entityId,
      event_type: "action_dismissed",
      outcome: "negative",
      reason_code: reason,
      source: "automatic"
    });
  },

  logOrderDraftCreated: (customerId: string, customerName: string, entityType: CommercialFeedbackEvent['related_entity_type'], entityId?: string, strategyType?: CommercialFeedbackEvent['strategy_type']) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: entityType,
      related_entity_id: entityId,
      strategy_type: strategyType || "suggested_order",
      event_type: "order_draft_created",
      outcome: "neutral",
      source: "automatic"
    });
  },

  logOrderConfirmed: (customerId: string, customerName: string, orderId: string, total: number) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: "order",
      related_entity_id: orderId,
      event_type: "order_confirmed",
      outcome: "order_won",
      order_total: total,
      order_id: orderId,
      value: total,
      source: "automatic"
    });
  },

  logSuggestedOrderCreated: (customerId: string, customerName: string, suggestedOrderId: string, source: CommercialFeedbackEvent['related_entity_type']) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: source,
      related_entity_id: suggestedOrderId,
      strategy_type: "suggested_order",
      event_type: "order_draft_created",
      outcome: "neutral",
      source: "automatic"
    });
  },

  logSuggestedOrderConfirmed: (customerId: string, customerName: string, orderId: string, total: number, suggestedOrderId: string) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: "suggested_order",
      related_entity_id: suggestedOrderId,
      strategy_type: "suggested_order",
      event_type: "suggested_order_confirmed",
      outcome: "order_won",
      order_total: total,
      order_id: orderId,
      value: total,
      source: "automatic"
    });
  },

  logSuggestedOrderDiscarded: (customerId: string, customerName: string, suggestedOrderId: string, reason?: CommercialFeedbackEvent['reason_code']) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: "suggested_order",
      related_entity_id: suggestedOrderId,
      strategy_type: "suggested_order",
      event_type: "action_dismissed",
      outcome: "negative",
      reason_code: reason,
      source: "automatic"
    });
  },

  logPaymentRegistered: (customerId: string, customerName: string, amount: number, paymentId?: string) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: "payment",
      related_entity_id: paymentId,
      strategy_type: "credit_collection",
      event_type: "payment_registered",
      outcome: "payment_received",
      payment_amount: amount,
      value: amount,
      source: "automatic"
    });
  },

  logPaymentLinkSent: (customerId: string, customerName: string, paymentId?: string) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: "payment",
      related_entity_id: paymentId,
      strategy_type: "payment_link",
      event_type: "message_sent",
      outcome: "unknown",
      source: "automatic"
    });
  },

  logVisitStarted: (customerId: string, customerName: string, visitId: string) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: "smart_route_visit",
      related_entity_id: visitId,
      strategy_type: "visit",
      event_type: "visit_started",
      outcome: "unknown",
      source: "automatic"
    });
  },

  logVisitCompleted: (customerId: string, customerName: string, visitId: string, outcome: CommercialFeedbackEvent['outcome']) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: "smart_route_visit",
      related_entity_id: visitId,
      strategy_type: "visit",
      event_type: "visit_completed",
      outcome: outcome,
      source: "automatic"
    });
  },

  logVisitSkipped: (customerId: string, customerName: string, visitId: string, reason?: CommercialFeedbackEvent['reason_code']) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: "smart_route_visit",
      related_entity_id: visitId,
      strategy_type: "visit",
      event_type: "action_dismissed",
      outcome: "neutral",
      reason_code: reason,
      source: "automatic"
    });
  },

  logVisitRescheduled: (customerId: string, customerName: string, visitId: string, nextDate?: string) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: "smart_route_visit",
      related_entity_id: visitId,
      strategy_type: "visit",
      event_type: "follow_up_scheduled",
      outcome: "rescheduled",
      next_follow_up_date: nextDate,
      source: "automatic"
    });
  },

  logActionCompleted: (customerId: string, customerName: string, actionId: string) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: "next_best_action",
      related_entity_id: actionId,
      event_type: "visit_completed",
      outcome: "positive",
      source: "automatic"
    });
  },

  logActionDismissed: (customerId: string, customerName: string, entityType: CommercialFeedbackEvent['related_entity_type'], entityId?: string, reason?: CommercialFeedbackEvent['reason_code']) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      related_entity_type: entityType,
      related_entity_id: entityId,
      event_type: "action_dismissed",
      outcome: "neutral",
      reason_code: reason,
      source: "automatic"
    });
  },

  logFollowUpScheduled: (customerId: string, customerName: string, date: string, note?: string) => {
    return feedbackService.logAutomaticEvent({
      customer_id: customerId,
      customer_name: customerName,
      event_type: "follow_up_scheduled",
      outcome: "opportunity_open",
      next_follow_up_date: date,
      note: note,
      source: "automatic"
    });
  }
};
