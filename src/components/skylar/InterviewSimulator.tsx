import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, MicOff, Send, Play, Pause, RefreshCw, 
  ShieldCheck, Brain, Target, ChevronRight, 
  MessageSquare, Volume2, VolumeX, Terminal,
  Activity, Zap, Award, History, X, Coffee, UserCheck
} from 'lucide-react';
import { skylar, PERSONA_CONFIG } from '../../services/skylarService';
import { Modality } from '@google/genai';

interface InterviewSimulatorProps {
  userId: string;
}

const PERSONAS = [
  { id: 'skeptical_vc', name: 'The Skeptical VC', description: 'Sharp, data-driven, and looks for flaws in the narrative.', icon: ShieldCheck, voice: 'Charon' },
  { id: 'visionary_founder', name: 'The Visionary Founder', description: 'Passionate, looks for cultural alignment and big-picture thinking.', icon: Zap, voice: 'Zephyr' },
  { id: 'pragmatic_manager', name: 'The Pragmatic Manager', description: 'Focused on execution, technical skills, and team fit.', icon: Target, voice: 'Kore' },
];

export const InterviewSimulator: React.FC<InterviewSimulatorProps> = ({ userId }) => {
  const [activePersona, setActivePersona] = useState<string | null>(null);
  const [interviewMode, setInterviewMode] = useState<'lead' | 'freeform'>('lead');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [resonanceScore, setResonanceScore] = useState(0);
  const [debrief, setDebrief] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isProcessingAudioRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startSession = async (personaId: string) => {
    setIsLoading(true);
    setActivePersona(personaId);
    const persona = PERSONAS.find(p => p.id === personaId);
    
    try {
      // Initialize Audio Context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }

      // Request Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const config = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: persona?.voice || 'Kore' } },
        },
        systemInstruction: `You are Skylar, but for this session, you are masking as ${persona?.name}. 
        Mode: ${interviewMode === 'lead' ? 'Skylar Lead Interview (Structured)' : 'Free-form Mock Coffee Chat (Conversational)'}.
        If the user interrupts you, STOP immediately and listen. 
        Be professional and consistent with the ${persona?.name} archetype.`,
      };

      const callbacks = {
        onopen: () => {
          console.log("Live session opened");
          setIsSessionActive(true);
          setIsLoading(false);
          
          // Start streaming audio
          const source = audioContextRef.current!.createMediaStreamSource(stream);
          const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
          
          source.connect(processor);
          processor.connect(audioContextRef.current!.destination);
          
          processor.onaudioprocess = (e) => {
            if (isListening && sessionRef.current) {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
              sessionRef.current.sendRealtimeInput({
                audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
              });
            }
          };
        },
        onmessage: async (message: any) => {
          if (message.serverContent?.modelTurn?.parts) {
            const audioPart = message.serverContent.modelTurn.parts.find((p: any) => p.inlineData);
            if (audioPart) {
              const binary = atob(audioPart.inlineData.data);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              const pcmData = new Int16Array(bytes.buffer);
              audioQueueRef.current.push(pcmData);
              if (!isProcessingAudioRef.current) {
                playNextChunk();
              }
            }

            const textPart = message.serverContent.modelTurn.parts.find((p: any) => p.text);
            if (textPart) {
              setMessages(prev => [...prev, { role: 'skylar', content: textPart.text }]);
            }
          }

          if (message.serverContent?.interrupted) {
            console.log("Interrupted by user");
            audioQueueRef.current = [];
            setIsSpeaking(false);
            // In "Skylar Lead" mode, we stop and listen
            if (interviewMode === 'lead') {
              setIsListening(true);
            }
          }
        },
        onclose: () => {
          console.log("Live session closed");
          setIsSessionActive(false);
        },
        onerror: (err: any) => {
          console.error("Live session error:", err);
          setIsLoading(false);
        }
      };

      sessionRef.current = await skylar.connectLive(config, callbacks);
      setIsListening(true);
    } catch (error) {
      console.error("Failed to start session:", error);
      setIsLoading(false);
    }
  };

  const playNextChunk = async () => {
    if (audioQueueRef.current.length === 0) {
      isProcessingAudioRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isProcessingAudioRef.current = true;
    setIsSpeaking(true);
    const chunk = audioQueueRef.current.shift()!;
    
    const audioBuffer = audioContextRef.current!.createBuffer(1, chunk.length, 16000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < chunk.length; i++) {
      channelData[i] = chunk[i] / 0x7FFF;
    }

    const source = audioContextRef.current!.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current!.destination);
    source.onended = playNextChunk;
    source.start();
  };

  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim() || !sessionRef.current) return;
    
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    
    sessionRef.current.sendRealtimeInput({ text });
  };

  const endSession = async () => {
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    setIsLoading(true);
    try {
      const result = await skylar.getInterviewDebrief(userId, messages);
      setDebrief(result);
      setIsSessionActive(false);
    } catch (error) {
      console.error("Failed to get debrief:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  if (debrief) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-display font-bold text-white">Strategic Debrief</h2>
          <button 
            onClick={() => setDebrief(null)}
            className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40">
            <h3 className="text-xs font-bold text-neon-cyan uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Narrative Heatmap
            </h3>
            <div className="space-y-6">
              {debrief.heatmap.map((item: any, i: number) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-white/60">{item.pillar}</span>
                    <span className="text-neon-cyan">{item.strength}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.strength}%` }}
                      className="h-full bg-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.5)]"
                    />
                  </div>
                  <p className="text-[10px] text-white/30 italic">{item.insight}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40">
            <h3 className="text-xs font-bold text-neon-magenta uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Overall Verdict
            </h3>
            <p className="text-sm text-white/80 leading-relaxed mb-8">
              {debrief.overallVerdict}
            </p>
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tactical Advice</h4>
              {debrief.tacticalAdvice.map((advice: string, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/60">
                  <ChevronRight className="w-4 h-4 text-neon-cyan shrink-0" />
                  {advice}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] relative overflow-hidden">
      {/* Hardware Surround Aesthetic */}
      <div className="absolute inset-0 pointer-events-none border-[24px] border-[#1a1a1a] z-50 rounded-[3rem] opacity-50" />
      
      {!isSessionActive ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-display font-bold text-white mb-4 tracking-tight">Resonance Chamber</h2>
            <p className="text-white/40 uppercase tracking-[0.4em] text-xs font-bold">High-Fidelity Interview Simulator</p>
          </div>

          <div className="flex items-center gap-4 mb-12 p-2 rounded-2xl bg-white/5 border border-white/10">
            <button 
              onClick={() => setInterviewMode('lead')}
              className={`px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-3 ${
                interviewMode === 'lead' ? 'bg-neon-cyan text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Skylar Lead Interview
            </button>
            <button 
              onClick={() => setInterviewMode('freeform')}
              className={`px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-3 ${
                interviewMode === 'freeform' ? 'bg-neon-cyan text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              <Coffee className="w-4 h-4" />
              Mock Coffee Chat
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
            {PERSONAS.map((persona) => (
              <button
                key={persona.id}
                onClick={() => startSession(persona.id)}
                disabled={isLoading}
                className="group glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-black/40 hover:bg-neon-cyan/5 hover:border-neon-cyan/30 transition-all text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <persona.icon className="w-24 h-24 text-neon-cyan" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <persona.icon className="w-7 h-7 text-neon-cyan" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-neon-cyan transition-colors">{persona.name}</h3>
                <p className="text-sm text-white/40 leading-relaxed font-medium">{persona.description}</p>
                <div className="mt-8 flex items-center gap-2 text-[10px] font-bold text-neon-cyan uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Initiate Session <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full p-12 relative z-10">
          {/* Header / HUD */}
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                {PERSONAS.find(p => p.id === activePersona)?.icon && React.createElement(PERSONAS.find(p => p.id === activePersona)!.icon, { className: "w-8 h-8 text-neon-cyan" })}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{PERSONAS.find(p => p.id === activePersona)?.name}</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  {interviewMode === 'lead' ? 'Structured Interview' : 'Coffee Chat'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-12">
              <div className="text-right">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">DNA Resonance</p>
                <div className="flex items-center gap-4">
                  <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      animate={{ width: `${resonanceScore}%` }}
                      className={`h-full shadow-[0_0_10px_rgba(0,243,255,0.5)] ${resonanceScore > 80 ? 'bg-neon-lime' : resonanceScore > 50 ? 'bg-neon-cyan' : 'bg-neon-magenta'}`}
                    />
                  </div>
                  <span className="text-xl font-mono font-bold text-white">{resonanceScore}%</span>
                </div>
              </div>
              <button 
                onClick={endSession}
                className="px-6 py-3 rounded-xl bg-neon-magenta/10 border border-neon-magenta/20 text-neon-magenta text-[10px] font-bold uppercase tracking-widest hover:bg-neon-magenta/20 transition-all"
              >
                End Session
              </button>
            </div>
          </div>

          {/* Chat Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-4 mb-8"
          >
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'skylar' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[70%] ${msg.role === 'skylar' ? 'bg-white/5 border border-white/10' : 'bg-neon-cyan/10 border border-neon-cyan/20'} p-6 rounded-3xl relative`}>
                  {msg.role === 'skylar' && (
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-lg bg-black border border-white/10 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-neon-cyan" />
                    </div>
                  )}
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="relative">
            <div className="absolute -top-12 left-0 right-0 flex justify-center">
              {isSpeaking && (
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: [4, 12, 4] }}
                      transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                      className="w-1 bg-neon-cyan rounded-full"
                    />
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl p-4 rounded-[2rem] border border-white/10">
              <button 
                onClick={toggleListening}
                className={`p-4 rounded-2xl transition-all ${isListening ? 'bg-neon-magenta text-white animate-pulse' : 'bg-white/5 text-white/40 hover:text-white'}`}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your response or use voice..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 font-medium"
              />

              <button 
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="p-4 rounded-2xl bg-neon-cyan text-black hover:bg-neon-cyan/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
