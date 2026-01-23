import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;

export const generateAnnouncementContent = async (topic: string, tone: string): Promise<string> => {
  // Verificação de segurança: Se não tiver chave, retorna texto falso sem tentar conectar
  if (!apiKey) {
    console.warn("API Key is missing. Returning mock data.");
    return "Nota: Configure sua API Key para gerar textos reais. Este é um texto de exemplo gerado localmente simulando a resposta da Inteligência Artificial.";
  }

  try {
    // Inicializa a IA apenas quando for usar, evitando erros no carregamento da página
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Você é um assistente de comunicação para uma igreja. 
      Escreva um aviso curto, acolhedor e claro para o boletim da igreja.
      
      Tópico: ${topic}
      Tom de voz: ${tone}
      
      O texto deve ter no máximo 3 parágrafos curtos. Não use formatação markdown complexa, apenas texto corrido e quebras de linha.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar o conteúdo.";
  } catch (error) {
    console.error("Error generating content:", error);
    return "Erro ao conectar com a IA. Verifique sua chave API ou tente novamente mais tarde.";
  }
};