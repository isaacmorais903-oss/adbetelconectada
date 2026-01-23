import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateAnnouncementContent = async (topic: string, tone: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key is missing. Returning mock data.");
    return "Nota: Configure sua API Key para gerar textos reais. Este é um texto de exemplo gerado localmente.";
  }

  try {
    const prompt = `
      Você é um assistente de comunicação para uma igreja. 
      Escreva um aviso curto, acolhedor e claro para o boletim da igreja.
      
      Tópico: ${topic}
      Tom de voz: ${tone}
      
      O texto deve ter no máximo 3 parágrafos curtos. Não use formatação markdown complexa, apenas texto corrido e quebras de linha.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar o conteúdo.";
  } catch (error) {
    console.error("Error generating content:", error);
    return "Erro ao conectar com a IA. Tente novamente mais tarde.";
  }
};
