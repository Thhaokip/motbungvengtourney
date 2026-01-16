import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    // In a real app, strict error handling for missing key
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }
  return aiClient;
};

export const askAiReferee = async (question: string, sport: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "AI Referee is offline (Missing API Key). Please set the API_KEY environment variable.";
  }

  try {
    const ai = getAiClient();
    const model = 'gemini-3-flash-preview'; 

    const systemPrompt = `You are an expert sports referee and rule consultant for the "Motbung Veng Tournament". 
    The user is asking a question about ${sport}. 
    Provide a clear, concise, and accurate explanation of the rules based on standard FIFA (for Football) or FIVB (for Volleyball) regulations.
    Keep the tone professional but helpful. Maximum 100 words.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: question,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text || "I couldn't clarify that rule at the moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to the AI Referee. Please try again later.";
  }
};