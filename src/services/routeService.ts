import apiClient from './apiClient';
import { 
  RouteTodayResponse, 
  VisitCheckInPayload, 
  VisitCheckOutPayload,
  LocationCoordinates
} from '../types';

export const routeService = {
  /**
   * Obtiene la ruta planeada para el día de hoy
   */
  async getTodayRoute(params?: { date?: string }): Promise<RouteTodayResponse> {
    const response = await apiClient.get('/advisor/route/today', { params });
    return response.data;
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
