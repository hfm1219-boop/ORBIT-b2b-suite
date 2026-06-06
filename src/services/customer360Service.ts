import apiClient from './apiClient';
import { Customer360Data, RecentOrder } from '../types';
import { responseNormalizer } from './responseNormalizer';
import { idNormalizer } from '../utils/idNormalizer';

class Customer360Service {
  async getCustomer360(customerId: string): Promise<Customer360Data> {
    try {
      const response = await apiClient.get(`/advisor/customers/${customerId}/360`);
      const data = responseNormalizer.normalizeObjectResponse<Customer360Data>(response.data, ["data", "customer_360"]);
      
      if (data && data.customer) {
        data.customer.id = idNormalizer.normalizeCustomerId(data.customer) || data.customer.id;
        return data;
      }
      
      throw new Error("Data normalization failed");
    } catch (error) {
      console.warn("Backend 360 no disponible, usando demo data", error);
      return this.getDemoData(String(customerId));
    }
  }

  private getDemoData(customerId: string): Customer360Data {
    const customers: Record<string, any> = {
      "1": {
        customer_id: "1",
        customer_name: "LICORERA DON PEPE SAS",
        commercial_name: "Licorera Don Pepe",
        nit: "900.123.456-1",
        city: "Medellín",
        channel: "Tradicional",
        segment: "Premium",
        advisor_name: "Asesor Comercial",
        phone: "3001234567",
        address: "Calle 10 # 43-21",
        latitude: 6.2123,
        longitude: -75.5678,
        customer_status: "active"
      },
      "2": {
        customer_id: "2",
        customer_name: "HOTEL CARIBE INTERNACIONAL",
        commercial_name: "Hotel Caribe",
        nit: "800.987.654-2",
        city: "Cartagena",
        channel: "Horeca",
        segment: "A",
        advisor_name: "Asesor Comercial",
        phone: "3109876543",
        address: "Av. Santander # 5-10",
        latitude: 10.4123,
        longitude: -75.5432,
        customer_status: "at_risk"
      },
      "3": {
        customer_id: "3",
        customer_name: "BAR SEVEN NIGHTS",
        commercial_name: "Bar Seven",
        nit: "700.456.789-3",
        city: "Bogotá",
        channel: "Nocturno",
        segment: "B",
        advisor_name: "Asesor Comercial",
        phone: "3204567890",
        address: "Cra 15 # 82-01",
        latitude: 4.6678,
        longitude: -74.0567,
        customer_status: "blocked"
      },
      "4": {
        customer_id: "4",
        customer_name: "RESTAURANTE AZUL MEDITERRANEO",
        commercial_name: "Restaurante Azul",
        nit: "600.321.654-4",
        city: "Cali",
        channel: "Horeca",
        segment: "A",
        advisor_name: "Asesor Comercial",
        phone: "3153216544",
        address: "Cl 9 # 34-12",
        latitude: 3.4516,
        longitude: -76.5312,
        customer_status: "active"
      },
      "5": {
        customer_id: "5",
        customer_name: "TIENDA LA 10 BARRIO CALDAS",
        commercial_name: "Tienda La 10",
        nit: "500.654.321-5",
        city: "Envigado",
        channel: "Tradicional",
        segment: "C",
        advisor_name: "Asesor Comercial",
        phone: "3186543215",
        address: "Circular 4 # 78-09",
        latitude: 6.1759,
        longitude: -75.5841,
        customer_status: "active"
      }
    };

    const customer = customers[customerId] || customers["1"];
    
    // Generate relative dates
    const now = new Date();
    const lastOrderDate = new Date(now);
    lastOrderDate.setDate(now.getDate() - (customerId === "2" ? 15 : 4));
    
    const nextDueDate = new Date(now);
    nextDueDate.setDate(now.getDate() + (customerId === "3" ? -5 : 10));

    const lastOrders: RecentOrder[] = [
      { id: "ORD-1001", date: lastOrderDate.toISOString(), amount: 1560000, status: "Entregado" },
      { id: "ORD-0982", date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), amount: 1240000, status: "Entregado" },
      { id: "ORD-0955", date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), amount: 1890000, status: "Entregado" }
    ];

    const demoData: Customer360Data = {
      ok: true,
      demo: true,
      customer: customer,
      commercial_status: {
        last_order_date: lastOrderDate.toISOString(),
        days_since_last_order: customerId === "2" ? 15 : 4,
        average_order_value: 1450000,
        monthly_sales_current: 2805000,
        monthly_sales_previous: 3120000,
        sales_drop_percentage: customerId === "2" ? 25 : 0,
        purchase_frequency_days: 8
      },
      credit: {
        credit_limit: 10000000,
        credit_used: customerId === "3" ? 9500000 : 3500000,
        credit_available: customerId === "3" ? 500000 : 6500000,
        overdue_amount: customerId === "3" ? 2450000 : 0,
        next_due_date: nextDueDate.toISOString(),
        credit_status: customerId === "3" ? "overdue" : (customerId === "2" ? "near_due" : "ok")
      },
      proactive_recommendation: this.getRecommendation(customerId, customer.commercial_name),
      suggested_repurchase_items: [
        {
          product_id: "P1",
          product_name: "Ron Medellín Añejo 750ml",
          last_quantity: 12,
          suggested_quantity: 12,
          last_purchase_date: lastOrderDate.toISOString(),
          days_since_last_purchase: customerId === "2" ? 15 : 4,
          average_frequency_days: 8,
          confidence: "high"
        },
        {
          product_id: "P2",
          product_name: "Aguardiente Antioqueño Sin Azucar 750ml",
          last_quantity: 24,
          suggested_quantity: 24,
          last_purchase_date: lastOrderDate.toISOString(),
          days_since_last_purchase: customerId === "2" ? 15 : 4,
          average_frequency_days: 8,
          confidence: "high"
        }
      ],
      cross_sell_opportunities: [
        {
          product_id: "P3",
          product_name: "Ginebra Juniper 750ml",
          reason: "Alta rotación en el segmento Premium de su zona.",
          estimated_value: 450000
        },
        {
          product_id: "P4",
          product_name: "Tónica Fever Tree 4-pack",
          reason: "Complemento ideal para Ginebras en canal Horeca.",
          estimated_value: 120000
        }
      ],
      orders: {
        open_orders_count: 1,
        last_orders: lastOrders,
        pending_delivery_count: 1
      }
    };

    return demoData;
  }

  private getRecommendation(customerId: string, commercialName: string): any {
    if (customerId === "2") {
      return {
        priority: "high",
        title: "Recompra Atrazada",
        reason: `${commercialName} suele comprar cada 8 días y lleva 15 días sin realizar pedido. Riesgo de quiebre de stock.`,
        recommended_action: "Llamar para preparar pedido sugerido y validar estado de cartera (próximo vencimiento).",
        suggested_message: `${commercialName}, buenos días. Revisando su rotación, es probable que esta semana necesite reponer Ron Medellín y Aguardiente Antioqueño. ¿Le preparo el mismo pedido anterior o desea ajustar cantidades?`,
        action_type: "create_order"
      };
    }
    if (customerId === "3") {
      return {
        priority: "high",
        title: "Bloqueo por Cartera",
        reason: "Cliente tiene factura vencida por $2.450.000 hace 5 días. Cupo agotado al 95%.",
        recommended_action: "Gestionar pago inmediato antes de tomar nuevos pedidos.",
        suggested_message: `${commercialName}, buenos días. Me pongo en contacto para informarle que su cuenta presenta un saldo vencido. Es importante regularizarlo hoy para evitar bloqueos en sus próximos despachos.`,
        action_type: "collect_payment"
      };
    }
    return {
      priority: "medium",
      title: "Oportunidad de Crecimiento",
      reason: "Baja participación en la categoría de Ginebras a pesar de ser un cliente Premium.",
      recommended_action: "Ofrecer Portafolio de Ginebras Juniper con descuento de lanzamiento.",
      suggested_message: `${commercialName}, buenos días. Tenemos una promoción especial en Ginebras Juniper para nuestros clientes top. ¿Le gustaría que incluyera un kit de degustación en su pedido de hoy?`,
      action_type: "whatsapp"
    };
  }
}

export const customer360Service = new Customer360Service();
