import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { getGeminiApiKey } from '../services/aiConfig';
import { useIdentity } from '../contexts/IdentityContext';
import { skylarTools } from '../services/skylarService';

export interface UseSkylarLiveResult {
  isLive: boolean;
  isConnecting: boolean;
  error: string | null;
  startLiveSession: (systemInstruction?: string) => Promise<void>;
  stopLiveSession: () => void;
  lastTranscript: string | null;
}

export const useSkylarLive = (): UseSkylarLiveResult => {
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const { user } = useIdentity();

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const playContextRef = useRef<AudioContext | null>(null);

  const stopLiveSession = useCallback(() => {
    setIsLive(false);

    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.error('Error closing session:', e);
      }
      sessionRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (playContextRef.current) {
      playContextRef.current.close();
      playContextRef.current = null;
    }
  }, []);

  const base64ToAudioBuffer = async (audioCtx: AudioContext, base64: string): Promise<AudioBuffer> => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    const buffer = new ArrayBuffer(bytes.byteLength);
    const view = new Uint8Array(buffer);
    view.set(bytes);
    
    // The Live API returns raw 16-bit PCM at 24000 Hz for audio
    // Wait, the documentation says "Implement manual PCM encoding/decoding. Do not use AudioContext.decodeAudioData on raw streams."
    // Let's decode raw PCM:
    const dataView = new DataView(buffer);
    const numSamples = buffer.byteLength / 2;
    const audioBuffer = audioCtx.createBuffer(1, numSamples, 24000);
    const channelData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < numSamples; i++) {
        const intSample = dataView.getInt16(i * 2, true); // little-endian
        channelData[i] = intSample / 32768.0;
    }
    return audioBuffer;
  };

  const startLiveSession = useCallback(async (systemInstruction: string = 'You are Skylar, an insightful, strategic, and empowering AI Career Coach.') => {
    setIsConnecting(true);
    setError(null);
    setLastTranscript(null);

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      setError('Gemini API Key is missing. Please configure it in AI Studio settings.');
      setIsConnecting(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      playContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          tools: skylarTools,
          systemInstruction,
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: async () => {
            setIsLive(true);
            setIsConnecting(false);

            try {
              const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { channelCount: 1, sampleRate: 16000 } 
              });
              mediaStreamRef.current = stream;

              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
              audioContextRef.current = audioCtx;

              const source = audioCtx.createMediaStreamSource(stream);
              const processor = audioCtx.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;

              source.connect(processor);
              processor.connect(audioCtx.destination);

              const session = await sessionPromise;
              sessionRef.current = session;

              processor.onaudioprocess = (e) => {
                if (!isLive && !sessionRef.current) return;
                const inputBuffer = e.inputBuffer;
                const rawData = inputBuffer.getChannelData(0);
                
                const pcm16 = new Int16Array(rawData.length);
                for (let i = 0; i < rawData.length; ++i) {
                  const s = Math.max(-1, Math.min(1, rawData[i]));
                  pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                
                const pcmBytes = new Uint8Array(pcm16.buffer);
                let binary = '';
                for (let i = 0; i < pcmBytes.byteLength; i++) {
                  binary += String.fromCharCode(pcmBytes[i]);
                }
                const base64Data = btoa(binary);
                
                session.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              };
            } catch (err) {
              console.error('Error getting audio stream:', err);
              setError('Microphone access denied or audio issue.');
              stopLiveSession();
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && playContextRef.current) {
              try {
                const audioBuffer = await base64ToAudioBuffer(playContextRef.current, base64Audio);
                const source = playContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(playContextRef.current.destination);
                source.start();
              } catch (err) {
                console.error('Error playing audio chunk:', err);
              }
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
               // ... Optional: stop current playback
            }

            // Handle toolCall
            if (message.toolCall && sessionRef.current) {
               console.log('Skylar Live asked to call tool:', message.toolCall);
               // Simple dummy ack so it doesn't hang
               const functionResponses = message.toolCall.functionCalls?.map(call => ({
                  id: call.id,
                  name: call.name,
                  response: { result: "Tool executed successfully (Live API dummy)." }
               })) || [];
               
               if (functionResponses.length > 0) {
                 sessionRef.current.sendToolResponse({ functionResponses });
               }
            }
          },
          onerror: (err: any) => {
            console.error('Live API Error:', err);
            setError(err instanceof Error ? err.message : String(err));
            stopLiveSession();
          },
          onclose: () => {
            stopLiveSession();
          }
        }
      });
    } catch (err) {
      console.error('Failed to start Live API:', err);
      setError(err instanceof Error ? err.message : String(err));
      setIsConnecting(false);
      stopLiveSession();
    }
  }, [stopLiveSession, user]);

  return {
    isLive,
    isConnecting,
    error,
    startLiveSession,
    stopLiveSession,
    lastTranscript
  };
};
