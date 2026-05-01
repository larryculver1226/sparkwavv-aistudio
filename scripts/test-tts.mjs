import { GoogleGenAI, Modality } from '@google/genai';
import { readFileSync } from 'fs';

async function testTTS() {
  const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
  const apiKey = process.env.VITE_GEMINI_API_KEY || config.apiKey;
  
  if (!apiKey) return;
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-tts-preview',
    contents: ['Say exactly: Hello world'],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inlineData) {
      console.log('No inlineData:', response.text);
      return;
  }
  
  console.log(`TTS Response: mimeType=${inlineData.mimeType}, data length=${inlineData.data?.length}`);
}

testTTS().catch(console.error);
