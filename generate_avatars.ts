import { GoogleGenAI } from "@google/genai";
import fs from 'fs';

async function generate() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const imageBase64 = fs.readFileSync('attached_image.jpg', { encoding: 'base64' });

  const prompts = [
    "A realistic, high-fidelity close-up headshot of the man in the attached image as the 'Skylar Discovery Architect'. Focus on his face, no hands visible. He is wearing a sharp, modern charcoal suit. He has a calm, analytical expression. The background is an abstract, atmospheric digital space with deep cyan and blue nebulous clouds and a faint, subtle digital shimmer across his skin. High-tech, structured feel.",
    "A realistic, high-fidelity close-up headshot of the man in the attached image as the 'Skylar Narrative Journalist'. Focus on his face, no hands visible. He is wearing a sophisticated dark navy turtleneck sweater and his glasses. He has a warm, reflective, and encouraging expression. The background is an abstract, atmospheric space with warm amber and gold gradients and a soft, ethereal glow. Storytelling, deep feel.",
    "A realistic, high-fidelity close-up headshot of the man in the attached image as the 'Skylar Drill Master'. Focus on his face, no hands visible. He is wearing a sharp, high-contrast black suit with a thin neon-magenta tie. He has an intense, direct, and unblinking gaze, looking straight into the camera with absolute focus. The background is a dynamic, abstract atmospheric space with vibrant magenta and purple energy streaks and a subtle digital pulse effect. Execution, high-energy feel."
  ];

  for (let i = 0; i < prompts.length; i++) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: "image/jpeg"
            }
          },
          { text: prompts[i] }
        ]
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        fs.writeFileSync(`option_${i+1}.png`, Buffer.from(part.inlineData.data, 'base64'));
        console.log(`Generated option_${i+1}.png`);
      }
    }
  }
}

generate().catch(console.error);
