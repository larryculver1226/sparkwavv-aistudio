import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function removeTextFromImage(base64Image: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg',
          },
        },
        {
          text: 'Remove the text "SPARKWavv" and the blue wave graphic from the image. Repaint the area where the text and graphic were to seamlessly match the surrounding beach sand, gentle waves, and sunset background. The result should be a clean image of the person on the beach at sunset without any text or logos.',
        },
      ],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}
