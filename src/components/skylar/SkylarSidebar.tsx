import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Mic, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  Loader2,
  Zap,
  Award,
  Compass,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { skylar, ChatMessage, SkylarPersona, PERSONA_CONFIG } from '../../services/skylarService';
import { useAuthContext } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export const SkylarSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [persona, setPersona] = useState<SkylarPersona>('discovery');
  const [isListening, setIsListening] = useState(false);
  const { user, mockUser } = useAuthContext();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        alert("Speech recognition is not supported in your browser.");
        return;
      }
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Listen for external toggle events
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-skylar-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-skylar-sidebar', handleToggle);
  }, []);

  // Auto-switch persona based on route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('onboarding') || path.includes('discovery')) {
      setPersona('discovery');
    } else if (path.includes('branding') || path.includes('wavvault')) {
      setPersona('branding');
    } else if (path.includes('outreach') || path.includes('dashboard')) {
      setPersona('outreach');
    } else if (path.includes('rpp')) {
      setPersona('rpp');
    }
  }, [location.pathname]);

  // Load chat history
  useEffect(() => {
    const loadHistory = async () => {
      const uid = user?.uid || mockUser?.uid;
      if (uid) {
        const history = await skylar.getChatHistory(uid);
        setMessages(history);
      }
    };
    if (isOpen && (user || mockUser)) {
      loadHistory();
    }
  }, [isOpen, user, mockUser]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || (!user && !mockUser)) return;

    const userMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: input }]
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await skylar.generateResponse(persona, input, messages);
      const modelMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: response }]
      };
      
      setMessages(prev => {
        const updatedMessages = [...prev, modelMessage];
        // Save to Wavvault
        skylar.saveChatToWavvault(user?.uid || mockUser?.uid || '', updatedMessages);
        return updatedMessages;
      });
      
      // Auto-speak if it's a short response or a proactive nudge
      if (response.length < 200) {
        handleSpeak(response);
      }
    } catch (error) {
      console.error("Error generating response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (text: string) => {
    if (isSpeaking) {
      audioRef.current?.pause();
      setIsSpeaking(false);
      return;
    }

    try {
      const audioUrl = await skylar.generateSpeech(text, persona);
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(err => {
          console.warn("Audio play failed (user interaction required):", err);
          setIsSpeaking(false);
        });
        setIsSpeaking(true);
      }
    } catch (error) {
      console.error("Error generating speech:", error);
    }
  };

  const getPersonaIcon = () => {
    switch (persona) {
      case 'discovery': return <Compass className="w-5 h-5" />;
      case 'branding': return <Award className="w-5 h-5" />;
      case 'outreach': return <Briefcase className="w-5 h-5" />;
      case 'rpp': return <ShieldCheck className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <>
      {/* Toggle Button - Only visible when sidebar is closed */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-neon-cyan text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-transform group"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-neon-magenta rounded-full border-2 border-[#050505] animate-pulse" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-40 w-full sm:w-[400px] h-full bg-[#0a0a0a] border-l border-white/10 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSpeaking ? 'bg-neon-cyan text-black animate-pulse' : 'bg-white/5 text-neon-cyan'}`}>
                  {getPersonaIcon()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{PERSONA_CONFIG[persona].name}</h3>
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Voice: {PERSONA_CONFIG[persona].voice}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
                title="Close Chat"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
            >
              {messages.length === 0 && (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-neon-cyan/10 flex items-center justify-center mx-auto">
                    <Sparkles className="w-8 h-8 text-neon-cyan" />
                  </div>
                  <p className="text-xs text-white/40 italic px-8">
                    "Hello! I'm Skylar, your AI Career Assistant. I'm currently in {PERSONA_CONFIG[persona].name} mode. How can I help you with your {persona} phase today?"
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-neon-cyan text-black font-medium' 
                      : 'bg-white/5 text-white/80 border border-white/10'
                  }`}>
                    {msg.parts[0].text}
                    {msg.role === 'model' && (
                      <button 
                        onClick={() => handleSpeak(msg.parts[0].text)}
                        className="mt-2 flex items-center gap-1 text-[10px] uppercase font-bold text-white/40 hover:text-neon-cyan transition-colors"
                      >
                        {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        {isSpeaking ? 'Stop' : 'Listen'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-white/10 bg-white/[0.02]">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ask Skylar anything..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-neon-cyan outline-none pr-24"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSend()}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button 
                    onClick={toggleListening}
                    className={`p-2 transition-colors ${isListening ? 'text-neon-cyan animate-pulse' : 'text-white/20 hover:text-neon-cyan'}`}
                    title={isListening ? 'Listening...' : 'Start Voice-to-Text'}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-neon-cyan text-black rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-white/20 mt-4 text-center">
                Skylar uses the entire Wavvault as a semantic index for your career.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} hidden />
    </>
  );
};
