import { 
  CommercialPerformanceSummary, 
  CommercialFeedbackEvent
} from '../types';
import { feedbackService } from './feedbackService';
import { buildCommercialPerformanceSummary } from '../utils/commercialPerformanceAnalyzer';

class CommercialPerformanceService {
  async getCommercialPerformance(period: "today" | "week" | "month" = "today"): Promise<{ ok: boolean, performance?: CommercialPerformanceSummary, error?: string }> {
    try {
      const resp = await feedbackService.getFeedbackEvents();
      if (!resp.ok) return { ok: false, error: resp.error };
      
      const events = resp.events || [];
      const performance = buildCommercialPerformanceSummary(events, { period, advisor_id: "demo-advisor" });
      
      return { ok: true, performance };
    } catch (error) {
      console.error("Error fetching commercial performance:", error);
      return { ok: false, error: String(error) };
    }
  }

  async getAdvisorGoalAlignment(period: "today" | "week" | "month" = "month") {
    const resp = await this.getCommercialPerformance(period);
    if (resp.ok && resp.performance) {
      return { ok: true, alignment: resp.performance.advisor_goal_alignment };
    }
    return { ok: false, error: resp.error };
  }
}

export const commercialPerformanceService = new CommercialPerformanceService();
