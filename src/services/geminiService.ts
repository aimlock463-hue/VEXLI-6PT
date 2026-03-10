import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const geminiService = {
  async generateChatResponse(messages: { role: 'user' | 'model', content: string }[]) {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "You are Velix AI, a premium, helpful, and sophisticated AI assistant. Your responses should be concise yet informative, with a modern and professional tone.",
      },
    });

    // Send the last message and get response
    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessageStream({ message: lastMessage });
    return result;
  },

  async generateImage(prompt: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  },

  async analyzeData(data: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following data and provide a concise summary with key insights:\n\n${data}`,
    });
    return response.text;
  },

  async textToSpeech(text: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/mp3;base64,${base64Audio}`;
    }
    throw new Error("Failed to generate audio");
  }
};
