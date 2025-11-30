import { Macros, RecommendationRequest, AiResponse, FoodItem, DailyRecord } from "../types";

// Helper to call our backend API
const callProxy = async (action: string, payload: any) => {
  try {
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error calling proxy for ${action}:`, error);
    throw error;
  }
};

export const getMealRecommendation = async (
  request: RecommendationRequest,
  currentIntake: Macros
): Promise<AiResponse> => {
  // Delegate to backend
  return callProxy('recommendation', { request, currentIntake });
};

export const analyzeManualEntry = async (text: string, imageBase64?: string): Promise<FoodItem[]> => {
  // Delegate to backend
  return callProxy('manualEntry', { text, imageBase64 });
};

export const getDailySummary = async (dayLog: Macros): Promise<string> => {
  // Delegate to backend
  const result = await callProxy('summary', { dayLog });
  return result.text || "记录完成！";
};

export const generateWeeklyReport = async (records: DailyRecord[]): Promise<string> => {
  // Delegate to backend
  const result = await callProxy('report', { records });
  return result.text || "无法生成报告。";
};
