import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
async function test() {
  try {
    const resp = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: ['Say "Hello world! This is a test of the audio output."'],
      config: { responseModalities: ['AUDIO'] }
    });
    const inl = resp.candidates[0].content.parts[0].inlineData;
    fs.writeFileSync('test_audio_raw.bin', Buffer.from(inl.data, 'base64'));
    console.log('MIME:', inl.mimeType);
  } catch (err) {
    console.error(err);
  }
}
test();
