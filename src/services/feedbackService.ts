import apiClient from "./apiClient";
import { CommercialFeedbackEvent, CustomerLearningProfile } from "../types";
import { responseNormalizer } from "./responseNormalizer";
import { analyzeCustomerLearning } from "../utils/customerLearningAnalyzer";

// In-memory demo data for persistence during session
const getDemoEvents = (): CommercialFeedbackEvent[] => {
  try {
    const stored = localStorage.getItem('demo_feedback_events');
    if (stored) return JSON.parse(stored);
    
    // Initial rich demo data if nothing stored
    const initialEvents: Partial<CommercialFeedbackEvent>[] = [
      // Don Pepe - Successful Repurchase (+15 bonus)
      { 
        customer_id: "1", customer_name: "LICORERA DON PEPE SAS", 
        event_type: "order_confirmed", outcome: "order_won", customer_response: "accepted", strategy_type: "repurchase", source: "automatic",
        order_total: 850000,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString() 
      },
      
      // Hotel Caribe - Broken Promise (+25 penalty to credit)
      { 
        customer_id: "2", customer_name: "HOTEL CARIBE INTERNACIONAL", 
        event_type: "agent_feedback_captured", outcome: "promise_to_pay", customer_response: "promise_to_pay", strategy_type: "credit_collection", source: "agent",
        note: "Dijo que pagaba hace 3 días", promise_to_pay_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
        created_at: new Date(Date.now() - 86400000 * 4).toISOString() 
      },

      // Bar Seven - Active Delivery Issue (+25 total score, resolver novedad first)
      // also low response rate on WhatsApp
      { 
        customer_id: "3", customer_name: "BAR SEVEN NIGHTS", 
        event_type: "issue_escalated", outcome: "issue_escalated", customer_response: "complaint", reason_code: "delivery_issue", strategy_type: "delivery_issue_resolution", source: "agent",
        note: "Pedido no llegó completo ayer",
        created_at: new Date(Date.now() - 3600000 * 4).toISOString() 
      },
      { customer_id: "3", customer_name: "BAR SEVEN NIGHTS", event_type: "message_sent", channel: "whatsapp", created_at: new Date(Date.now() - 86400000 * 10).toISOString(), strategy_type: "repurchase" },
      { customer_id: "3", customer_name: "BAR SEVEN NIGHTS", event_type: "message_sent", channel: "whatsapp", created_at: new Date(Date.now() - 86400000 * 15).toISOString(), strategy_type: "repurchase" },
      { customer_id: "3", customer_name: "BAR SEVEN NIGHTS", event_type: "message_sent", channel: "whatsapp", created_at: new Date(Date.now() - 86400000 * 20).toISOString(), strategy_type: "repurchase" },
      { customer_id: "3", customer_name: "BAR SEVEN NIGHTS", event_type: "message_sent", channel: "whatsapp", created_at: new Date(Date.now() - 86400000 * 25).toISOString(), strategy_type: "repurchase" },
      { customer_id: "3", customer_name: "BAR SEVEN NIGHTS", event_type: "message_sent", channel: "whatsapp", created_at: new Date(Date.now() - 86400000 * 30).toISOString(), strategy_type: "repurchase" },

      // Restaurante Azul - Repurchase Fatigue (-10) & Price sensitivity (-5)
      { 
        customer_id: "4", customer_name: "RESTAURANTE AZUL MEDITERRANEO", 
        event_type: "customer_response_captured", customer_response: "rejected", reason_code: "price", strategy_type: "repurchase", source: "quick_reply",
        created_at: new Date(Date.now() - 3600000 * 1).toISOString() 
      },
      { 
        customer_id: "4", customer_name: "RESTAURANTE AZUL MEDITERRANEO", 
        event_type: "message_sent", strategy_type: "repurchase", source: "automatic",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString() 
      },
      { 
        customer_id: "4", customer_name: "RESTAURANTE AZUL MEDITERRANEO", 
        event_type: "message_sent", strategy_type: "repurchase", source: "automatic",
        created_at: new Date(Date.now() - 3600000 * 10).toISOString() 
      },

      // Tienda La 10 - Positive Payment Behavior (+5)
      { 
        customer_id: "5", customer_name: "TIENDA LA 10 BARRIO CALDAS", 
        event_type: "order_confirmed", outcome: "payment_received", customer_response: "paid", strategy_type: "credit_collection", source: "agent",
        payment_amount: 120000,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString() 
      }
    ];

    const finalEvents = initialEvents.map(e => ({
      id: Math.random().toString(36).substr(2, 9),
      advisor_id: "advisor_1",
      ...e
    } as CommercialFeedbackEvent));

    localStorage.setItem('demo_feedback_events', JSON.stringify(finalEvents));
    return finalEvents;
  } catch (e) {
    return [];
  }
};

let demoEvents = getDemoEvents();

const saveDemoEvents = (events: CommercialFeedbackEvent[]) => {
  demoEvents = events;
  localStorage.setItem('demo_feedback_events', JSON.stringify(events));
  // Notify other components
  window.dispatchEvent(new CustomEvent("feedback:updated"));
};

export const feedbackService = {
  // ... (keep methods but update getCustomerLearningProfile)
  async logAutomaticEvent(payload: Partial<CommercialFeedbackEvent>): Promise<{ ok: boolean; event?: CommercialFeedbackEvent }> {
    try {
      // Avoid duplicates if same type and entity in last 5 seconds
      const now = new Date();
      const isDuplicate = demoEvents.some(e => 
        e.customer_id === payload.customer_id && 
        e.event_type === payload.event_type && 
        e.related_entity_id === payload.related_entity_id &&
        (now.getTime() - new Date(e.created_at).getTime()) < 5000
      );

      if (isDuplicate) {
        console.log("Feedback: Skipping duplicate event");
        return { ok: true };
      }

      const response = await apiClient.post("/advisor/feedback/events", payload);
      const event = responseNormalizer.normalizeObjectResponse<CommercialFeedbackEvent>(response.data, ["event", "data"]);
      return { ok: true, event: event! };
    } catch (error) {
      console.warn("Feedback API failed, using demo mode", error);
      const newEvent: CommercialFeedbackEvent = {
        id: Math.random().toString(36).substr(2, 9),
        advisor_id: "advisor_1",
        customer_id: payload.customer_id || "unknown",
        customer_name: payload.customer_name || "Unknown Customer",
        related_entity_type: payload.related_entity_type || "manual",
        related_entity_id: payload.related_entity_id,
        strategy_type: payload.strategy_type || "manual",
        event_type: payload.event_type || "action_suggested",
        outcome: payload.outcome || "unknown",
        source: "automatic",
        created_at: new Date().toISOString(),
        ...payload
      } as CommercialFeedbackEvent;
      
      const updatedEvents = [...demoEvents, newEvent];
      saveDemoEvents(updatedEvents);
      return { ok: true, event: newEvent };
    }
  },

  async captureQuickResponse(payload: Partial<CommercialFeedbackEvent>): Promise<{ ok: boolean; event?: CommercialFeedbackEvent }> {
    try {
      const response = await apiClient.post("/advisor/feedback/quick-response", payload);
      const event = responseNormalizer.normalizeObjectResponse<CommercialFeedbackEvent>(response.data, ["event", "data"]);
      return { ok: true, event: event! };
    } catch (error) {
      console.warn("Feedback API failed, using demo mode", error);
      const newEvent: CommercialFeedbackEvent = {
        id: Math.random().toString(36).substr(2, 9),
        advisor_id: "advisor_1",
        source: "quick_reply",
        created_at: new Date().toISOString(),
        ...payload
      } as CommercialFeedbackEvent;
      
      const updatedEvents = [...demoEvents, newEvent];
      saveDemoEvents(updatedEvents);
      return { ok: true, event: newEvent };
    }
  },

  async captureAgentFeedback(payload: Partial<CommercialFeedbackEvent>): Promise<{ ok: boolean; event?: CommercialFeedbackEvent }> {
    try {
      const response = await apiClient.post("/advisor/feedback/agent-capture", payload);
      const event = responseNormalizer.normalizeObjectResponse<CommercialFeedbackEvent>(response.data, ["event", "data"]);
      return { ok: true, event: event! };
    } catch (error) {
      console.warn("Feedback API failed, using demo mode", error);
      const newEvent: CommercialFeedbackEvent = {
        id: Math.random().toString(36).substr(2, 9),
        advisor_id: "advisor_1",
        source: "agent",
        created_at: new Date().toISOString(),
        ...payload
      } as CommercialFeedbackEvent;
      
      const updatedEvents = [...demoEvents, newEvent];
      saveDemoEvents(updatedEvents);
      return { ok: true, event: newEvent };
    }
  },

  async getFeedbackEvents(): Promise<{ ok: boolean; events: CommercialFeedbackEvent[]; error?: string }> {
    try {
      const response = await apiClient.get("/advisor/feedback/events");
      const events = responseNormalizer.normalizeArrayResponse<CommercialFeedbackEvent>(response.data, ["events", "data"]);
      return { ok: true, events };
    } catch (error) {
      return { ok: true, events: demoEvents };
    }
  },

  async getFeedbackEventsForCustomer(customer_id: string): Promise<{ ok: boolean; events: CommercialFeedbackEvent[] }> {
    try {
      const response = await apiClient.get(`/advisor/customers/${customer_id}/feedback-events`);
      const events = responseNormalizer.normalizeArrayResponse<CommercialFeedbackEvent>(response.data, ["events", "data"]);
      return { ok: true, events };
    } catch (error) {
      const events = demoEvents.filter(e => e.customer_id === customer_id);
      return { ok: true, events };
    }
  },

  async getCustomerLearningProfile(customer_id: string): Promise<{ ok: boolean; profile?: CustomerLearningProfile }> {
    try {
      const response = await apiClient.get(`/advisor/customers/${customer_id}/learning-profile`);
      const profile = responseNormalizer.normalizeObjectResponse<CustomerLearningProfile>(response.data, ["profile", "data"]);
      return { ok: true, profile: profile! };
    } catch (error) {
      const events = demoEvents.filter(e => e.customer_id === customer_id);
      const profile = analyzeCustomerLearning(events, customer_id);
      return { ok: true, profile };
    }
  },

  async getTodayFeedbackSummary(): Promise<{ ok: boolean; data: any }> {
    try {
      const response = await apiClient.get("/advisor/feedback/summary/today");
      const data = responseNormalizer.normalizeObjectResponse<any>(response.data, ["data", "summary"]);
      return { ok: true, data: data! };
    } catch (error) {
      const today = new Date().toISOString().split('T')[0];
      const todaysEvents = demoEvents.filter(e => e.created_at.startsWith(today));
      
      return {
        ok: true,
        data: {
          orders_count: todaysEvents.filter(e => e.outcome === 'order_won').length,
          orders_total: todaysEvents.filter(e => e.outcome === 'order_won').reduce((acc, curr) => acc + (curr.order_total || 0), 0),
          payments_count: todaysEvents.filter(e => e.outcome === 'payment_received').length,
          payments_total: todaysEvents.filter(e => e.outcome === 'payment_received').reduce((acc, curr) => acc + (curr.payment_amount || 0), 0),
          messages_sent: todaysEvents.filter(e => e.event_type === 'message_sent').length,
          top_objection: todaysEvents.find(e => !!e.reason_code)?.reason_code || 'ninguna',
          pending_feedback_count: 5 // Static for demo
        }
      };
    }
  },

  async getPendingFeedbackPrompts(): Promise<{ ok: boolean; data: any[] }> {
    try {
      const response = await apiClient.get("/advisor/feedback/pending-prompts");
      const data = responseNormalizer.normalizeArrayResponse<any>(response.data, ["data", "prompts"]);
      return { ok: true, data };
    } catch (error) {
      // Mock pending nudges
      return {
        ok: true,
        data: [
          {
            id: 'p1',
            customer_id: '1',
            customer_name: 'LICORERA DON PEPE SAS',
            event_type: 'whatsapp_opened',
            label: 'Mensaje enviado. ¿Qué respondió?'
          },
          {
            id: 'p2',
            customer_id: '3',
            customer_name: 'BAR SEVEN NIGHTS',
            event_type: 'visit_completed',
            label: 'Visita sin pedido. ¿Por qué no compró?'
          }
        ]
      };
    }
  },

  async getFeedbackStats(): Promise<{ ok: boolean; data: any }> {
    try {
      const response = await apiClient.get("/advisor/feedback/stats");
      const data = responseNormalizer.normalizeObjectResponse<any>(response.data, ["data", "stats"]);
      return { ok: true, data: data! };
    } catch (error) {
      return {
        ok: true,
        data: {
          total_captured: demoEvents.length + 14,
          suggested_order_hit_rate: 74,
          top_objections: [
            { label: 'Precio', count: 8 },
            { label: 'Competencia', count: 5 },
            { label: 'Stock', count: 3 },
            { label: 'Credito', count: 2 }
          ]
        }
      };
    }
  }
};
