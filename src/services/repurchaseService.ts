import apiClient from './apiClient';
import { RepurchaseSuggestionsResponse } from '../types';

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
    const response = await apiClient.get('/advisor/repurchase-suggestions', { params });
    return response.data;
  },

  /**
   * Obtiene las sugerencias específicas de un cliente
   */
  async getCustomerRepurchaseSuggestions(customerId: string, limit: number = 5): Promise<RepurchaseSuggestionsResponse> {
    return this.getRepurchaseSuggestions({ customer_id: customerId, limit });
  }
};
