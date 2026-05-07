import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: 'hello',
    });
    console.log("Success");
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
