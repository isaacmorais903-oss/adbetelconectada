
export const generateAnnouncementContent = async (topic: string, tone: string): Promise<string> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, tone }),
    });

    if (!response.ok) {
      throw new Error('Falha na comunicação com o servidor');
    }

    const data = await response.json();
    return data.text || "Não foi possível gerar o conteúdo.";
  } catch (error) {
    console.error("Error generating content:", error);
    return "Erro ao conectar com a IA. Verifique sua conexão ou tente novamente mais tarde.";
  }
};
