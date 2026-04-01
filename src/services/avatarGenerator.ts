import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey } from "./aiConfig";

export async function generateSkylarOptions(imageBuffer: string) {
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  
  const prompts = [
    "A realistic, high-fidelity professional headshot of the man in the attached image to be used as an AI assistant avatar. He should look friendly, intelligent, and approachable. Background is a blurred modern office with soft blue and white lighting.",
    "A cinematic, slightly futuristic version of the man in the attached image. He is looking directly at the camera with a confident smile. Subtle digital data patterns are visible in the background, suggesting a high-tech environment like the 'Wavvault'.",
    "A realistic avatar of the man in the attached image, but in a more creative and warm setting. He is wearing a stylish sweater instead of a suit, looking like a mentor. The lighting is warm and organic."
  ];

  const results = [];

  for (const prompt of prompts) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBuffer,
              mimeType: "image/jpeg"
            }
          },
          { text: prompt }
        ]
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        results.push(`data:image/png;base64,${part.inlineData.data}`);
      }
    }
  }

  return results;
}
