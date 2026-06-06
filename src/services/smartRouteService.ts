import apiClient from './apiClient';
import { SmartRoute, SmartRouteResponse, SmartRouteVisit, VisitResult } from '../types';
import { responseNormalizer } from './responseNormalizer';

class SmartRouteService {
  async getTodaySmartRoute(): Promise<SmartRouteResponse> {
    try {
      const response = await apiClient.get('/advisor/smart-route/today');
      return responseNormalizer.normalizeObjectResponse<SmartRouteResponse>(response.data, ["data", "route"])!;
    } catch (error) {
      console.warn("Backend smart route not available, using demo", error);
      return { ok: true, demo: true, route: this.getDemoRoute() };
    }
  }

  async generateSmartRoute(): Promise<SmartRouteResponse> {
    try {
      const response = await apiClient.post('/advisor/smart-route/generate');
      return responseNormalizer.normalizeObjectResponse<SmartRouteResponse>(response.data, ["data", "route"])!;
    } catch (error) {
      console.warn("Backend route generation not available", error);
      return { ok: true, demo: true, route: this.getDemoRoute() };
    }
  }

  async reorderRouteVisits(routeId: string, visits: SmartRouteVisit[]): Promise<SmartRouteResponse> {
    try {
      const response = await apiClient.post(`/advisor/smart-route/${routeId}/reorder`, { visits });
      return responseNormalizer.normalizeObjectResponse<SmartRouteResponse>(response.data, ["data"])!;
    } catch (error) {
      return { ok: true, demo: true };
    }
  }

  async startVisit(visitId: string, payload: { latitude?: number; longitude?: number }): Promise<SmartRouteResponse> {
    try {
      const response = await apiClient.post(`/advisor/smart-route/visits/${visitId}/check-in`, payload);
      return responseNormalizer.normalizeObjectResponse<SmartRouteResponse>(response.data, ["data"])!;
    } catch (error) {
      return { ok: true, demo: true };
    }
  }

  async completeVisit(visitId: string, payload: { outcome: string; notes: string; next_step: string; [key: string]: any }): Promise<SmartRouteResponse> {
    try {
      const response = await apiClient.post(`/advisor/smart-route/visits/${visitId}/check-out`, payload);
      return responseNormalizer.normalizeObjectResponse<SmartRouteResponse>(response.data, ["data"])!;
    } catch (error) {
      return { ok: true, demo: true };
    }
  }

  async skipVisit(visitId: string, reason: string): Promise<SmartRouteResponse> {
    try {
      const response = await apiClient.post(`/advisor/smart-route/visits/${visitId}/skip`, { reason });
      return responseNormalizer.normalizeObjectResponse<SmartRouteResponse>(response.data, ["data"])!;
    } catch (error) {
      return { ok: true, demo: true };
    }
  }

  async rescheduleVisit(visitId: string, newDate: string): Promise<SmartRouteResponse> {
    try {
      const response = await apiClient.post(`/advisor/smart-route/visits/${visitId}/reschedule`, { new_date: newDate });
      return responseNormalizer.normalizeObjectResponse<SmartRouteResponse>(response.data, ["data"])!;
    } catch (error) {
      return { ok: true, demo: true };
    }
  }

  private getDemoRoute(): SmartRoute {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const visits: SmartRouteVisit[] = [
      {
        id: "V1",
        route_id: "R-001",
        customer_id: "1",
        customer_name: "LICORERA DON PEPE SAS",
        commercial_name: "Don Pepe",
        channel: "Licorera",
        city: "Medellín",
        address: "Calle 10 # 43-21",
        phone: "3001234567",
        latitude: 6.2084,
        longitude: -75.5670,
        sequence: 1,
        suggested_sequence: 1,
        status: "pending",
        priority: "high",
        visit_type: "sales",
        reason: "Recompra atrasada",
        recommended_action: "Crear pedido sugerido",
        estimated_sales_value: 1250000,
        estimated_collection_value: 0,
        has_repurchase_opportunity: true,
        has_credit_issue: false,
        has_sales_drop: false,
        has_pending_order: false,
        has_delivery_issue: false,
        next_best_action_id: "2"
      },
      {
        id: "V2",
        route_id: "R-001",
        customer_id: "2",
        customer_name: "HOTEL CARIBE INTERNACIONAL",
        commercial_name: "Hotel Caribe",
        channel: "Horeca",
        city: "Medellín",
        address: "Carrera 45 # 50-10",
        phone: "3109876543",
        latitude: 6.2442,
        longitude: -75.5714,
        sequence: 2,
        suggested_sequence: 2,
        status: "pending",
        priority: "high",
        visit_type: "collection",
        reason: "Cartera vencida",
        recommended_action: "Gestionar pago atrasado",
        estimated_sales_value: 0,
        estimated_collection_value: 4500000,
        has_repurchase_opportunity: true,
        has_credit_issue: true,
        has_sales_drop: false,
        has_pending_order: false,
        has_delivery_issue: false,
        next_best_action_id: "3"
      },
      {
        id: "V3",
        route_id: "R-001",
        customer_id: "3",
        customer_name: "BAR SEVEN NIGHTS",
        commercial_name: "Seven Nights",
        channel: "Bar",
        city: "Medellín",
        address: "Calle 33 # 78-45",
        phone: "3204567890",
        latitude: 6.2345,
        longitude: -75.5921,
        sequence: 3,
        suggested_sequence: 3,
        status: "pending",
        priority: "medium",
        visit_type: "retention",
        reason: "Caída de compra",
        recommended_action: "Visita de reactivación",
        estimated_sales_value: 800000,
        estimated_collection_value: 0,
        has_repurchase_opportunity: false,
        has_credit_issue: false,
        has_sales_drop: true,
        has_pending_order: false,
        has_delivery_issue: false,
        next_best_action_id: "1"
      },
      {
        id: "V4",
        route_id: "R-001",
        customer_id: "4",
        customer_name: "RESTAURANTE AZUL MEDITERRANEO",
        commercial_name: "Azul Mediterráneo",
        channel: "Restaurante",
        city: "Medellín",
        address: "Vía Las Palmas Km 2",
        phone: "3156781234",
        latitude: 6.2101,
        longitude: -75.5450,
        sequence: 4,
        suggested_sequence: 4,
        status: "pending",
        priority: "low",
        visit_type: "new_opportunity",
        reason: "Cross-sell Mixers",
        recommended_action: "Ofrecer combo Mixers Premium",
        estimated_sales_value: 450000,
        estimated_collection_value: 0,
        has_repurchase_opportunity: false,
        has_credit_issue: false,
        has_sales_drop: false,
        has_pending_order: false,
        has_delivery_issue: false
      },
      {
        id: "V5",
        route_id: "R-001",
        customer_id: "5",
        customer_name: "TIENDA LA 10 BARRIO CALDAS",
        commercial_name: "La 10 Caldas",
        channel: "Tradicional",
        city: "Medellín",
        address: "Calle 11Sur # 50-80",
        phone: "3123456789",
        latitude: 6.1822,
        longitude: -75.5890,
        sequence: 5,
        suggested_sequence: 5,
        status: "pending",
        priority: "medium",
        visit_type: "delivery_issue",
        reason: "Pedido con novedad",
        recommended_action: "Resolver retraso logístico",
        estimated_sales_value: 0,
        estimated_collection_value: 0,
        has_repurchase_opportunity: false,
        has_credit_issue: false,
        has_sales_drop: false,
        has_pending_order: true,
        has_delivery_issue: true
      }
    ];

    return {
      id: "R-001",
      advisor_id: "A-01",
      date: dateStr,
      status: "in_progress",
      total_visits: visits.length,
      completed_visits: 0,
      pending_visits: visits.length,
      estimated_sales_value: visits.reduce((acc, v) => acc + v.estimated_sales_value, 0),
      estimated_collection_value: visits.reduce((acc, v) => acc + v.estimated_collection_value, 0),
      route_score: 85,
      generated_at: now.toISOString(),
      visits: visits
    };
  }
}

export const smartRouteService = new SmartRouteService();
