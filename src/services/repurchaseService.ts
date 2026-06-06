import apiClient from './apiClient';
import { RepurchaseSuggestionsResponse } from '../types';
import { responseNormalizer } from './responseNormalizer';
import { idNormalizer } from '../utils/idNormalizer';

export interface RepurchaseParams {
  customer_id?: string;
  limit?: number;
  urgency?: string;
  include_unavailable?: boolean;
}

export const repurchaseService = {
  /**
   * Obtiene las sugerencias de recompra comerciales
   */
  async getRepurchaseSuggestions(params: RepurchaseParams = {}): Promise<RepurchaseSuggestionsResponse> {
    try {
      const response = await apiClient.get('/advisor/repurchase-suggestions', { params });
      const items = responseNormalizer.normalizeArrayResponse<any>(response.data, ["items", "data"]);
      
      // Normalize IDs
      const normalizedItems = items.map(item => ({
        ...item,
        customer_id: idNormalizer.normalizeCustomerId({ 
          customer_id: item.customer_id, 
          partner_id: item.partner_id,
          customer_partner_id: item.customer_partner_id,
          id: item.id // careful here as id might be item id not customer id
        }) || item.customer_id
      }));

      return { ok: true, items: normalizedItems };
    } catch (error) {
      console.warn("Backend repurchase no disponible, usando demo data", error);
      return {
        ok: true,
        demo: true,
        items: [
          {
            id: "s1",
            customer_id: "1",
            customer_name: "LICORERA DON PEPE SAS",
            product_id: "1",
            sku: "REF-001",
            product_name: "U.L.C. AV00274 GFA X 20 LTS",
            category: "Limpieza",
            last_purchase_date: "2026-05-01",
            avg_frequency_days: 7,
            days_since_last_purchase: 12,
            urgency: "high",
            urgency_label: "Crítico",
            reason: "Frecuencia de compra superada",
            score: 0.95,
            suggested_qty: 2,
            current_price: 224387,
            can_add_to_order: true
          },
          {
            id: "s2",
            customer_id: "2",
            customer_name: "HOTEL CARIBE INTERNACIONAL",
            product_id: "2",
            sku: "REF-002",
            product_name: "SUMA GRILL AV00771 GAL X 5 LTS",
            category: "Cocina",
            last_purchase_date: "2026-05-05",
            avg_frequency_days: 15,
            days_since_last_purchase: 8,
            urgency: "medium",
            urgency_label: "Pronto",
            reason: "Próximo a agotar stock",
            score: 0.75,
            suggested_qty: 1,
            current_price: 131222,
            can_add_to_order: true
          }
        ]
      };
    }
  },

  /**
   * Obtiene las sugerencias específicas de un cliente
   */
  async getCustomerRepurchaseSuggestions(customerId: string, limit: number = 5): Promise<RepurchaseSuggestionsResponse> {
    return this.getRepurchaseSuggestions({ customer_id: customerId, limit });
  }
};
