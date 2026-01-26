
import { GoogleGenAI, Type } from "@google/genai";
import { CategoryData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getStrategicInsights = async (data: CategoryData): Promise<string> => {
  const prompt = `
    As a cosmetic ODM strategy expert, analyze the following performance data for the category: ${data.category}.
    
    Data Summary:
    - Monthly Performance (Actual vs Target vs Last Year)
    - Quarterly Market Share Trends (Cosmax vs Kolmar vs Others)
    
    Full Data: ${JSON.stringify(data)}

    Please provide:
    1. A concise executive summary of current performance (Growth vs Achievement).
    2. Analysis of market share trends (Are we gaining or losing against Kolmar/Others?).
    3. Three actionable strategic recommendations for the next quarter.
    
    Keep the response professional, data-driven, and in Korean.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || '인사이트를 불러올 수 없습니다.';
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "전략 분석을 수행하는 중 오류가 발생했습니다. API 키 및 연결 상태를 확인하세요.";
  }
};
