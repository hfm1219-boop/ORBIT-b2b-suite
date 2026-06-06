import apiClient from './apiClient';
import { SuggestedOrder, SuggestedOrderResponse } from '../types';
import { responseNormalizer } from './responseNormalizer';

class SuggestedOrderService {
  async createFromCustomer360(customerId: string): Promise<SuggestedOrderResponse> {
    try {
      const response = await apiClient.post(`/advisor/customers/${customerId}/suggested-order`);
      return responseNormalizer.normalizeObjectResponse<SuggestedOrderResponse>(response.data, ["data"])!;
    } catch (error) {
      console.warn("Backend suggested order not available, using demo", error);
      return { 
        ok: true, 
        demo: true, 
        order: this.getDemoSuggestedOrder(customerId, 'customer_360') 
      };
    }
  }

  async createFromRepurchase(customerId: string, items: any[]): Promise<SuggestedOrderResponse> {
    try {
      const response = await apiClient.post(`/advisor/suggested-orders/from-repurchase`, { customer_id: customerId, items });
      return responseNormalizer.normalizeObjectResponse<SuggestedOrderResponse>(response.data, ["data"])!;
    } catch (error) {
      console.warn("Backend suggested order from repurchase not available, using demo", error);
      return { 
        ok: true, 
        demo: true, 
        order: this.getDemoSuggestedOrder(customerId, 'repurchase', items) 
      };
    }
  }

  async createFromLastOrder(customerId: string): Promise<SuggestedOrderResponse> {
    try {
      const response = await apiClient.post(`/advisor/customers/${customerId}/repeat-last-order`);
      return responseNormalizer.normalizeObjectResponse<SuggestedOrderResponse>(response.data, ["data"])!;
    } catch (error) {
      console.warn("Backend repeat last order not available, using demo", error);
      return { 
        ok: true, 
        demo: true, 
        order: this.getDemoSuggestedOrder(customerId, 'last_order') 
      };
    }
  }

  async validateSuggestedOrder(order: SuggestedOrder): Promise<SuggestedOrderResponse> {
    try {
      const response = await apiClient.post(`/advisor/suggested-orders/validate`, order);
      return responseNormalizer.normalizeObjectResponse<SuggestedOrderResponse>(response.data, ["data"])!;
    } catch (error) {
      console.warn("Backend validate not available, using demo logic", error);
      return { ok: true, demo: true, order: this.localValidate(order) };
    }
  }

  async confirmSuggestedOrder(order: SuggestedOrder): Promise<SuggestedOrderResponse> {
    try {
      const response = await apiClient.post(`/advisor/suggested-orders/confirm`, order);
      return responseNormalizer.normalizeObjectResponse<SuggestedOrderResponse>(response.data, ["data"])!;
    } catch (error) {
      console.warn("Backend confirm not available, using demo success", error);
      return { ok: true, demo: true };
    }
  }

  async getSuggestedOrder(orderId: string): Promise<SuggestedOrderResponse> {
    try {
      const response = await apiClient.get(`/advisor/suggested-orders/${orderId}`);
      return responseNormalizer.normalizeObjectResponse<SuggestedOrderResponse>(response.data, ["data"])!;
    } catch (error) {
      return { ok: false, error: "Pedido no encontrado" };
    }
  }

  private localValidate(order: SuggestedOrder): SuggestedOrder {
    const validations: any[] = [];
    let status = order.status;
    
    // Demo validation logic
    order.lines.forEach(line => {
      if (line.stock_status === 'out_of_stock') {
        validations.push({
          is_valid: false,
          severity: 'error',
          code: 'STOCK_OUT',
          message: `Producto ${line.product_name} sin stock disponible.`,
          affected_product_ids: [line.product_id]
        });
      } else if (line.quantity > line.available_stock) {
        validations.push({
          is_valid: false,
          severity: 'warning',
          code: 'LOW_STOCK',
          message: `Cantidad solicitada para ${line.product_name} supera stock disponible (${line.available_stock}).`,
          affected_product_ids: [line.product_id]
        });
      }
    });

    // Credit simulation
    if (order.customer_id === "3") { // Bar Seven demo
      validations.push({
        is_valid: false,
        severity: 'blocked',
        code: 'CREDIT_LIMIT',
        message: 'Cliente bloqueado por cartera vencida y cupo excedido.',
        suggested_fix: 'Realizar cobranza antes de continuar.'
      });
      status = 'blocked';
    }

    return {
      ...order,
      validation_status: validations.some(v => v.severity === 'error' || v.severity === 'blocked') ? 'invalid' : 'valid',
      validation_messages: validations,
      status: status === 'blocked' ? 'blocked' : (validations.length > 0 ? 'needs_review' : 'validated')
    };
  }

  private getDemoSuggestedOrder(customerId: string, source: any, items?: any[]): SuggestedOrder {
    const now = new Date();
    const subtotal = 1250000;
    const taxes = subtotal * 0.19;
    const total = subtotal + taxes;

    const customers: Record<string, string> = {
      "1": "LICORERA DON PEPE SAS",
      "2": "HOTEL CARIBE INTERNACIONAL",
      "3": "BAR SEVEN NIGHTS",
      "4": "RESTAURANTE AZUL MEDITERRANEO",
      "5": "TIENDA LA 10 BARRIO CALDAS",
    };

    const lines: any[] = items ? items.map(item => ({
      product_id: item.id || item.product_id,
      product_code: item.sku || `REF-${item.id}`,
      product_name: item.name || item.product_name,
      category: "Licores",
      quantity: item.qty || item.suggested_quantity || 12,
      suggested_quantity: item.suggested_quantity || 12,
      unit_price: item.price || 120000,
      subtotal: (item.qty || 12) * (item.price || 120000),
      available_stock: customerId === "2" ? 5 : 100, // Scenario B: Hotel Caribe low stock
      stock_status: customerId === "2" ? "low_stock" : "available",
      reason: "Recompra frecuente (cada 8 días)",
      source: "repurchase",
      confidence: "high",
      editable: true
    })) : [
      {
        product_id: "P1",
        product_code: "REF-001",
        product_name: "Ron Medellín Añejo 750ml",
        category: "Licores",
        quantity: 12,
        suggested_quantity: 12,
        unit_price: 65000,
        subtotal: 780000,
        available_stock: 50,
        stock_status: "available",
        reason: "Rotación habitual",
        source: "repurchase",
        confidence: "high",
        editable: true
      },
      {
        product_id: "P2",
        product_code: "REF-002",
        product_name: "Aguardiente Antioqueño Sin Azucar 750ml",
        category: "Licores",
        quantity: 24,
        suggested_quantity: 24,
        unit_price: 45000,
        subtotal: 1080000,
        available_stock: customerId === "2" ? 0 : 200, // Out of stock for Caribe
        stock_status: customerId === "2" ? "out_of_stock" : "available",
        reason: "Oportunidad de temporada",
        source: "promotion",
        confidence: "medium",
        editable: true
      }
    ];

    return {
      id: `SO-${Math.floor(Math.random() * 10000)}`,
      customer_id: customerId,
      customer_name: customers[customerId] || "Cliente Demo",
      advisor_id: "A-01",
      source: source,
      status: "draft",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      subtotal: lines.reduce((acc, l) => acc + l.subtotal, 0),
      taxes: lines.reduce((acc, l) => acc + l.subtotal, 0) * 0.19,
      discounts: 0,
      total: lines.reduce((acc, l) => acc + l.subtotal, 0) * 1.19,
      validation_status: "pending",
      validation_messages: [],
      lines: lines
    };
  }
}

export const suggestedOrderService = new SuggestedOrderService();
