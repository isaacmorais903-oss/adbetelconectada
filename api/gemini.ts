
import { GoogleGenAI } from "@google/genai";

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { topic, tone } = await request.json();
    
    // API key must be used directly from process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Você é um assistente de comunicação para uma igreja. 
      Escreva um aviso curto, acolhedor e claro para o boletim da igreja.
      
      Tópico: ${topic}
      Tom de voz: ${tone}
      
      O texto deve ter no máximo 3 parágrafos curtos. Não use formatação markdown complexa, apenas texto corrido e quebras de linha.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Updated to recommended model for basic text tasks
      contents: prompt,
    });

    return new Response(JSON.stringify({ text: response.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: 'Failed to generate content' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}