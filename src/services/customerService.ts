import apiClient from './apiClient';
import { Customer, CustomerDashboardData } from '../types';
import { responseNormalizer } from './responseNormalizer';
import { idNormalizer } from '../utils/idNormalizer';

export const customerService = {
  /**
   * Obtiene la lista de clientes asignados al asesor autenticado
   */
  async getAdvisorCustomers(): Promise<Customer[]> {
    try {
      const response = await apiClient.get('/advisor/customers');
      const customers = responseNormalizer.normalizeArrayResponse<Customer>(response.data, ["customers", "data"]);
      
      // Normalize IDs
      return customers.map(c => ({
        ...c,
        id: idNormalizer.normalizeCustomerId(c) || c.id
      }));
    } catch (error) {
      console.warn("Backend customers no disponible, usando demo data", error);
      return [
        {
          id: "1",
          nit: "900.123.456-1",
          name: "LICORERA DON PEPE SAS",
          commercial_name: "Licorera Don Pepe",
          address: "Calle 10 # 43-21",
          phone: "3001234567",
          totalDebt: 0,
          priceList: "P01",
          city: "Medellín"
        },
        {
          id: "2",
          nit: "800.987.654-2",
          name: "HOTEL CARIBE INTERNACIONAL",
          commercial_name: "Hotel Caribe",
          address: "Av. Santander # 5-10",
          phone: "3109876543",
          totalDebt: 1250000,
          priceList: "P02",
          city: "Cartagena"
        },
        {
          id: "3",
          nit: "700.456.789-3",
          name: "BAR SEVEN NIGHTS",
          commercial_name: "Bar Seven",
          address: "Cra 15 # 82-01",
          phone: "3204567890",
          totalDebt: 2450000,
          priceList: "P01",
          city: "Bogotá"
        },
        {
          id: "4",
          nit: "600.321.654-4",
          name: "RESTAURANTE AZUL MEDITERRANEO",
          commercial_name: "Restaurante Azul",
          address: "Cl 9 # 34-12",
          phone: "3153216544",
          totalDebt: 0,
          priceList: "P03",
          city: "Cali"
        },
        {
          id: "5",
          nit: "500.654.321-5",
          name: "TIENDA LA 10 BARRIO CALDAS",
          commercial_name: "Tienda La 10",
          address: "Circular 4 # 78-09",
          phone: "3186543215",
          totalDebt: 450000,
          priceList: "P02",
          city: "Envigado"
        }
      ];
    }
  },

  /**
   * Obtiene el dashboard 360 de un cliente específico
   * @deprecated Usar customer360Service.getCustomer360
   */
  async getCustomerDashboard(customerId: string): Promise<CustomerDashboardData> {
    const response = await apiClient.get(`/advisor/customers/${customerId}/dashboard`);
    return responseNormalizer.normalizeObjectResponse<CustomerDashboardData>(response.data, ["data"])!;
  }
};
