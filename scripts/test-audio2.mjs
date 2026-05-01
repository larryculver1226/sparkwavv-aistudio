import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: 'Hello, this is a test of the audio system' }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Kore'
            }
          }
        }
      }
    });
    const inl = response.candidates[0].content.parts[0].inlineData;
    fs.writeFileSync('test_audio_raw.bin', Buffer.from(inl.data, 'base64'));
    console.log('MIME:', inl.mimeType);
  } catch (err) {
    console.error(err);
  }
}
test();
