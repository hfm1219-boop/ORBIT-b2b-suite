import apiClient from './apiClient';
import { ProactiveMessage, ProactiveMessageResponse, MessageTemplate } from '../types';
import { responseNormalizer } from './responseNormalizer';

class ProactiveMessageService {
  async getPendingMessages(): Promise<ProactiveMessageResponse> {
    try {
      const response = await apiClient.get('/advisor/proactive-messages/pending');
      const messages = responseNormalizer.normalizeArrayResponse<ProactiveMessage>(response.data, ["messages", "data"]);
      return { ok: true, messages };
    } catch (error) {
      console.warn("Backend proactive messages not available, using demo", error);
      return { ok: true, demo: true, messages: this.getDemoMessages() };
    }
  }

  async getMessagesForCustomer(customerId: string): Promise<ProactiveMessageResponse> {
    try {
      const response = await apiClient.get(`/advisor/customers/${customerId}/proactive-messages`);
      const messages = responseNormalizer.normalizeArrayResponse<ProactiveMessage>(response.data, ["messages", "data"]);
      return { ok: true, messages };
    } catch (error) {
      return { 
        ok: true, 
        demo: true, 
        messages: this.getDemoMessages().filter(m => m.customer_id === customerId) 
      };
    }
  }

  async generateMessage(payload: any): Promise<ProactiveMessageResponse> {
    try {
      const response = await apiClient.post('/advisor/proactive-messages/generate', payload);
      return responseNormalizer.normalizeObjectResponse<ProactiveMessageResponse>(response.data, ["data"])!;
    } catch (error) {
      // Mock generation logic
      const demoMsg = this.getDemoMessages()[0];
      return { ok: true, demo: true, message: { ...demoMsg, id: `NEW-${Date.now()}`, ...payload } };
    }
  }

  async approveMessage(messageId: string): Promise<ProactiveMessageResponse> {
    try {
      const response = await apiClient.post(`/advisor/proactive-messages/${messageId}/approve`);
      return responseNormalizer.normalizeObjectResponse<ProactiveMessageResponse>(response.data, ["data"])!;
    } catch (error) {
      return { ok: true, demo: true };
    }
  }

  async updateMessage(messageId: string, body: string): Promise<ProactiveMessageResponse> {
    try {
      const response = await apiClient.patch(`/advisor/proactive-messages/${messageId}`, { message_body: body });
      return responseNormalizer.normalizeObjectResponse<ProactiveMessageResponse>(response.data, ["data"])!;
    } catch (error) {
      return { ok: true, demo: true };
    }
  }

  async discardMessage(messageId: string, reason: string): Promise<ProactiveMessageResponse> {
    try {
      const response = await apiClient.post(`/advisor/proactive-messages/${messageId}/discard`, { reason });
      return responseNormalizer.normalizeObjectResponse<ProactiveMessageResponse>(response.data, ["data"])!;
    } catch (error) {
      return { ok: true, demo: true };
    }
  }

  async markAsSent(messageId: string): Promise<ProactiveMessageResponse> {
    try {
      const response = await apiClient.post(`/advisor/proactive-messages/${messageId}/sent`);
      return responseNormalizer.normalizeObjectResponse<ProactiveMessageResponse>(response.data, ["data"])!;
    } catch (error) {
      return { ok: true, demo: true };
    }
  }

  async getTemplates(): Promise<any> {
    try {
      const response = await apiClient.get('/advisor/proactive-messages/templates');
      return responseNormalizer.normalizeObjectResponse<any>(response.data, ["data", "templates"])!;
    } catch (error) {
      return { ok: true, demo: true, data: this.getDemoTemplates() };
    }
  }

  private getDemoTemplates(): MessageTemplate[] {
    return [
      {
        id: "T1",
        name: "Recompra Sugerida",
        trigger_type: "repurchase_due",
        description: "Para clientes con rotación habitual",
        body: "Hola {customer_name}, revisando su rotación habitual, es probable que esta semana necesite reponer {products}. ¿Desea que le preparemos el mismo pedido anterior o ajustamos cantidades?",
        variables: ["customer_name", "products"],
        active: true,
        requires_approval: true
      },
      {
        id: "T2",
        name: "Cartera Vencida",
        trigger_type: "credit_overdue",
        description: "Cobro administrativo",
        body: "Hola {customer_name}, actualmente tiene una factura vencida por {amount}. Para mantener activo su cupo y evitar retrasos en nuevos pedidos, podemos ayudarle a gestionar el pago.",
        variables: ["customer_name", "amount"],
        active: true,
        requires_approval: true
      }
    ];
  }

  private getDemoMessages(): ProactiveMessage[] {
    const now = new Date();
    return [
      {
        id: "MSG-001",
        customer_id: "1",
        customer_name: "LICORERA DON PEPE SAS",
        commercial_name: "Don Pepe",
        advisor_id: "A-01",
        phone: "573001234567",
        channel: "whatsapp",
        trigger_type: "repurchase_due",
        status: "pending_review",
        priority: "high",
        title: "Reponer Inventario",
        reason: "Cliente con 3 días de retraso en su ciclo de recompra habitual.",
        message_body: "Hola Don Pepe, revisando su rotación habitual, es probable que esta semana necesite reponer Aguardiente Antioqueño y Ron Medellín. ¿Desea que le preparemos el mismo pedido de la semana pasada?",
        source: "today",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        related_entity_type: "next_best_action",
        related_entity_id: "2"
      },
      {
        id: "MSG-002",
        customer_id: "2",
        customer_name: "HOTEL CARIBE INTERNACIONAL",
        commercial_name: "Hotel Caribe",
        advisor_id: "A-01",
        phone: "573109876543",
        channel: "whatsapp",
        trigger_type: "credit_overdue",
        status: "pending_review",
        priority: "high",
        title: "Cartera Vencida",
        reason: "Factura vencida por $4.500.000 (8 días de mora).",
        message_body: "Hola Hotel Caribe, actualmente tiene una factura vencida por $4.500.000. Para mantener activo su cupo y evitar retrasos en nuevos pedidos, podemos ayudarle a gestionar el pago hoy mismo.",
        source: "credit",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        related_entity_type: "customer",
        related_entity_id: "2"
      },
      {
        id: "MSG-003",
        customer_id: "3",
        customer_name: "BAR SEVEN NIGHTS",
        commercial_name: "Seven Nights",
        advisor_id: "A-01",
        phone: "3204567890",
        channel: "whatsapp",
        trigger_type: "sales_drop_recovery",
        status: "pending_review",
        priority: "medium",
        title: "Recuperación de Venta",
        reason: "Caída del 40% en compras frente al mes anterior.",
        message_body: "Hola Seven Nights, notamos que este mes su compra ha bajado frente a su comportamiento habitual. Queremos revisar si podemos ayudarle con disponibilidad, precios o alternativas de producto.",
        source: "today",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        related_entity_type: "next_best_action",
        related_entity_id: "1"
      },
      {
        id: "MSG-004",
        customer_id: "4",
        customer_name: "RESTAURANTE AZUL MEDITERRANEO",
        commercial_name: "Azul Mediterráneo",
        advisor_id: "A-01",
        phone: "3156781234",
        channel: "whatsapp",
        trigger_type: "cross_sell",
        status: "pending_review",
        priority: "medium",
        title: "Oportunidad de Mixers",
        reason: "Cliente compra destilados premium pero no compra mixers.",
        message_body: "Hola Azul Mediterráneo, además de sus destilados habituales, tenemos una oportunidad que puede complementar su barra: Agua Tónica Premium y Mezcladores. ¿Desea que le comparta la lista de precios?",
        source: "customer_360",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        related_entity_type: "customer",
        related_entity_id: "4"
      },
      {
        id: "MSG-005",
        customer_id: "5",
        customer_name: "TIENDA LA 10 BARRIO CALDAS",
        commercial_name: "La 10 Caldas",
        advisor_id: "A-01",
        phone: "3123456789",
        channel: "whatsapp",
        trigger_type: "delivery_issue",
        status: "pending_review",
        priority: "high",
        title: "Novedad en Entrega",
        reason: "Pedido #ORD-7890 con retraso por cierre de vía.",
        message_body: "Hola La 10 Caldas, le informamos que su pedido ORD-7890 presenta un ligero retraso debido a un cierre vial. Estaremos informándole la nueva hora estimada de llegada.",
        source: "order_status",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        related_entity_type: "order",
        related_entity_id: "ORD-7890"
      }
    ];
  }
}

export const proactiveMessageService = new ProactiveMessageService();
