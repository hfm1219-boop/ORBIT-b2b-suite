import apiClient from './apiClient';
import { ScoringResponse, PriorityScore, ScoringConfig, BusinessRule } from '../types';
import { calculatePriorityScore, DEFAULT_SCORING_CONFIG } from '../utils/scoringEngine';
import { responseNormalizer } from './responseNormalizer';

class ScoringService {
  async getAdvisorPriorityScores(): Promise<ScoringResponse> {
    try {
      const response = await apiClient.get('/advisor/scoring/priorities');
      const scores = responseNormalizer.normalizeArrayResponse<PriorityScore>(response.data, ["scores", "data"]);
      return { ok: true, scores };
    } catch (error) {
      console.warn("Backend scoring not available, using demo scores", error);
      return { 
        ok: true, 
        demo: true, 
        scores: this.getDemoScores() 
      };
    }
  }

  async getCustomerScore(customerId: string): Promise<ScoringResponse> {
    try {
      const response = await apiClient.get(`/advisor/customers/${customerId}/score`);
      const score = responseNormalizer.normalizeObjectResponse<PriorityScore>(response.data, ["score", "data"]);
      return { ok: true, score: score! };
    } catch (error) {
      const demoScore = this.getDemoScores().find(s => s.customer_id === customerId);
      return { 
        ok: true, 
        demo: true, 
        score: demoScore || this.getDemoScores()[0]
      };
    }
  }

  async getCustomerSignals(customerId: string): Promise<ScoringResponse> {
    try {
      const response = await apiClient.get(`/advisor/customers/${customerId}/signals`);
      const signals = responseNormalizer.normalizeArrayResponse<any>(response.data, ["signals", "data"]);
      return { ok: true, signals };
    } catch (error) {
      const demoScore = this.getDemoScores().find(s => s.customer_id === customerId);
      return { 
        ok: true, 
        demo: true, 
        signals: demoScore?.signals || []
      };
    }
  }

  async getScoringConfig(): Promise<ScoringResponse> {
    try {
      const response = await apiClient.get('/advisor/scoring/config');
      const config = responseNormalizer.normalizeObjectResponse<ScoringConfig>(response.data, ["config", "data"]);
      return { ok: true, config: config! };
    } catch (error) {
      return { ok: true, demo: true, config: DEFAULT_SCORING_CONFIG };
    }
  }

  recalculateScores() {
    // In demo mode, just notify listeners that data has changed
    window.dispatchEvent(new CustomEvent("scoring:updated"));
    return { ok: true };
  }

  private getDemoScores(): PriorityScore[] {
    const clients = [
      { id: "1", name: "LICORERA DON PEPE SAS", has_sales_drop: false, last_order_days: 12, debt_overdue: 0, sales_drop_pct: 0 },
      { id: "2", name: "HOTEL CARIBE INTERNACIONAL", has_sales_drop: false, last_order_days: 5, debt_overdue: 4500000, credit_status: "Bloqueado", sales_drop_pct: 0 },
      { id: "3", name: "BAR SEVEN NIGHTS", has_sales_drop: true, last_order_days: 20, debt_overdue: 0, sales_drop_pct: 45 },
      { id: "4", name: "RESTAURANTE AZUL MEDITERRANEO", has_sales_drop: false, last_order_days: 4, debt_overdue: 0, sales_drop_pct: 0 },
      { id: "5", name: "TIENDA LA 10 BARRIO CALDAS", has_sales_drop: false, last_order_days: 2, debt_overdue: 0, sales_drop_pct: 0 }
    ];

    return clients.map(c => calculatePriorityScore(c));
  }
}

export const scoringService = new ScoringService();
