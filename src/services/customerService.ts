import apiClient from './apiClient';
import { Customer, CustomerDashboardData } from '../types';

export const customerService = {
  /**
   * Obtiene la lista de clientes asignados al asesor autenticado
   */
  async getAdvisorCustomers(): Promise<Customer[]> {
    const response = await apiClient.get('/advisor/customers');
    return response.data;
  },

  /**
   * Obtiene el dashboard 360 de un cliente específico
   */
  async getCustomerDashboard(customerId: string): Promise<CustomerDashboardData> {
    const response = await apiClient.get(`/advisor/customers/${customerId}/dashboard`);
    return response.data;
  }
};
