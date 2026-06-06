import apiClient from './apiClient';
import { 
  RouteTodayResponse, 
  VisitCheckInPayload, 
  VisitCheckOutPayload,
  LocationCoordinates
} from '../types';
import { responseNormalizer } from './responseNormalizer';

export const routeService = {
  /**
   * Obtiene la ruta planeada para el día de hoy
   */
  async getTodayRoute(params?: { date?: string }): Promise<RouteTodayResponse> {
    try {
      const response = await apiClient.get('/advisor/route/today', { params });
      return responseNormalizer.normalizeObjectResponse<RouteTodayResponse>(response.data, ["data", "route"])!;
    } catch (error) {
       console.warn("Backend route no disponible, usando demo data", error);
       return {
         ok: true,
         demo: true,
         date: new Date().toISOString(),
         summary: {
           total_planned: 5,
           completed: 2,
           in_progress: 1,
           pending: 2,
           skipped: 0,
           orders_created: 1,
           validated_visits: 2
         },
         items: [
           {
             id: "v1",
             customer_id: "1",
             customer_name: "LICORERA DON PEPE SAS",
             address: "Calle 10 # 43-21",
             planned_date: new Date().toISOString(),
             planned_sequence: 1,
             status: "completed",
             checkin_time: new Date().toISOString(),
             checkout_time: new Date().toISOString(),
             result_type: "order_created"
           },
           {
             id: "v2",
             customer_id: "2",
             customer_name: "HOTEL CARIBE INTERNACIONAL",
             address: "Av. Santander # 5-10",
             planned_date: new Date().toISOString(),
             planned_sequence: 2,
             status: "completed"
           },
           {
             id: "v3",
             customer_id: "3",
             customer_name: "BAR SEVEN NIGHTS",
             address: "Cra 15 # 82-01",
             planned_date: new Date().toISOString(),
             planned_sequence: 3,
             status: "in_progress",
             checkin_time: new Date().toISOString(),
             credit_status: { status: "blocked", label: "Bloqueado por Mora", overdue_total: 2450000 }
           },
           {
             id: "v4",
             customer_id: "4",
             customer_name: "RESTAURANTE AZUL MEDITERRANEO",
             address: "Cl 9 # 34-12",
             planned_date: new Date().toISOString(),
             planned_sequence: 4,
             status: "planned"
           },
           {
             id: "v5",
             customer_id: "5",
             customer_name: "TIENDA LA 10 BARRIO CALDAS",
             address: "Circular 4 # 78-09",
             planned_date: new Date().toISOString(),
             planned_sequence: 5,
             status: "planned"
           }
         ]
       };
    }
  },

  /**
   * Registra el inicio de una visita (Check-in)
   */
  async checkInVisit(visitId: string, payload: VisitCheckInPayload): Promise<any> {
    const response = await apiClient.post(`/advisor/visits/${visitId}/check-in`, payload);
    return response.data;
  },

  /**
   * Registra el fin de una visita (Check-out)
   */
  async checkOutVisit(visitId: string, payload: VisitCheckOutPayload): Promise<any> {
    const response = await apiClient.post(`/advisor/visits/${visitId}/check-out`, payload);
    return response.data;
  },

  /**
   * Actualiza las coordenadas GPS de un cliente
   */
  async updateCustomerLocation(customerId: string, location: LocationCoordinates): Promise<any> {
    const response = await apiClient.post(`/advisor/customers/${customerId}/location`, location);
    return response.data;
  }
};
