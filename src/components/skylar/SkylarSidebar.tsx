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
  Briefcase,
  BrainCircuit,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { skylar, ChatMessage, SkylarPersona, PERSONA_CONFIG } from '../../services/skylarService';
import { useIdentity } from '../../contexts/IdentityContext';
import { useLocation } from 'react-router-dom';

type Methodology = 'lobkowicz' | 'feynman';

interface SkylarProposal {
  type: 'PROPOSAL' | 'CONFLICT';
  action: 'update_dashboard' | 'add_milestone' | 'propose_major_shift' | 'flag_dna_conflict';
  data: any;
  reasoning: string;
}

interface SkylarSidebarProps {
  onLogin?: () => void;
}

export const SkylarSidebar: React.FC<SkylarSidebarProps> = ({ onLogin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [persona, setPersona] = useState<SkylarPersona>('discovery');
  const [methodology, setMethodology] = useState<Methodology>('lobkowicz');
  const [isListening, setIsListening] = useState(false);
  const [proposals, setProposals] = useState<Record<number, SkylarProposal>>({});
  const [executedActions, setExecutedActions] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'alerts'>('chat');
  const [alerts, setAlerts] = useState<any[]>([]);
  const { user } = useIdentity();
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
      const uid = user?.uid;
      if (uid) {
        const history = await skylar.getChatHistory(uid);
        setMessages(history);
      }
    };
    if (isOpen && user) {
      loadHistory();
    }
  }, [isOpen, user]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!user) {
      setError("Authentication required. Please login to chat with Skylar.");
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: input }]
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const uid = user.uid;
      const token = await user.getIdToken();
      
      // Convert history to Vertex format
      const vertexHistory = messages.map(msg => ({
        role: msg.role,
        parts: msg.parts
      }));

      const response = await skylar.chatWithVertex(uid, currentInput, vertexHistory, methodology, token);
      
      const modelParts = response.candidates[0].content.parts;
      const textPart = modelParts.find((p: any) => p.text);
      const functionCallPart = modelParts.find((p: any) => p.functionCall);

      let responseText = textPart?.text || "";
      
      if (functionCallPart) {
        const { name, args } = functionCallPart.functionCall;
        
        if (name.startsWith('propose_') || name === 'flag_dna_conflict') {
          const proposal: SkylarProposal = {
            type: name === 'flag_dna_conflict' ? 'CONFLICT' : 'PROPOSAL',
            action: name as any,
            data: args,
            reasoning: (args as any).reasoning || (args as any).conflictReason || "Skylar suggests this based on your conversation."
          };
          
          const messageIndex = messages.length + 1;
          setProposals(prev => ({ ...prev, [messageIndex]: proposal }));
        }
      }

      const modelMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: responseText || "I've processed your request. How else can I help?" }]
      };
      
      setMessages(prev => {
        const updatedMessages = [...prev, modelMessage];
        skylar.saveChatToWavvault(uid, updatedMessages);
        return updatedMessages;
      });
      
      // Check for warning phrase
      const warningPhrase = "I have some concerns about your current direction. Please review the notifications in the sidebar before proceeding.";
      if (responseText.includes(warningPhrase)) {
        // 1. Trigger TTS automatically
        handleSpeak(warningPhrase);
        
        // 2. Add to alerts
        const newAlert = {
          id: Date.now(),
          type: 'validation_warning',
          message: responseText.split(warningPhrase)[1]?.trim() || "Validation Gate misalignment detected. Skylar recommends a strategic review.",
          timestamp: new Date().toISOString(),
          status: 'pending'
        };
        setAlerts(prev => [newAlert, ...prev]);
        
        // 3. Switch to alerts tab
        setActiveTab('alerts');
      } else if (responseText && responseText.length < 200) {
        handleSpeak(responseText);
      }
    } catch (error: any) {
      console.error("Error generating response:", error);
      setError(error.message || "Skylar is currently unavailable.");
      // Put the input back if it failed
      setInput(currentInput);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async (index: number) => {
    const proposal = proposals[index];
    if (!proposal || !user) return;

    const uid = user.uid;
    setIsLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      
      if (proposal.action === 'propose_major_shift') {
        const insight = {
          type: proposal.data.type,
          content: proposal.data.content,
          evidence: proposal.data.evidence,
          tags: proposal.data.tags || [],
          status: 'confirmed',
          timestamp: new Date().toISOString()
        };
        await fetch('/api/user-insights', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ insight })
        });
      } else if (proposal.action === 'flag_dna_conflict') {
        // 1. Mark existing as superseded
        const existingInsightId = proposal.data.existingInsightId;
        const existingResponse = await fetch(`/api/user-insights`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const allInsights = await existingResponse.json();
        const existing = allInsights.find((i: any) => i.id === existingInsightId);
        
        if (existing) {
          await fetch('/api/user-insights', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
              insight: { ...existing, status: 'superseded' } 
            })
          });
        }

        // 2. Add new insight as confirmed
        const newInsight = {
          ...proposal.data.newInsight,
          status: 'confirmed',
          timestamp: new Date().toISOString(),
          conflictWith: existingInsightId
        };
        await fetch('/api/user-insights', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ insight: newInsight })
        });
      } else {
        await skylar.executeAction(uid, proposal.action, proposal.data, token);
      }
      
      setExecutedActions(prev => ({ ...prev, [index]: true }));
      
      // Add a confirmation message from Skylar
      const confirmationMsg: ChatMessage = {
        role: 'model',
        parts: [{ text: `✅ Action confirmed: ${
          proposal.action === 'update_dashboard' ? 'Dashboard updated' : 
          proposal.action === 'add_milestone' ? 'Milestone added' :
          proposal.action === 'propose_major_shift' ? 'New insight confirmed' :
          'Conflict resolved and insight updated'
        }.` }]
      };
      setMessages(prev => [...prev, confirmationMsg]);
    } catch (error: any) {
      console.error("Action execution failed:", error);
      setError(error.message || "Failed to execute action.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBypass = async (alertId: number) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      await fetch('/api/skylar/request-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.uid, reason: 'User bypassed soft gate warning.' })
      });
      
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'bypassed' } : a));
      
      // Add a confirmation message from Skylar
      const confirmationMsg: ChatMessage = {
        role: 'model',
        parts: [{ text: "⚠️ Validation bypassed. A human mentor has been notified to review your progress. You may continue, but please check the 'Human Mentor' section on your dashboard for feedback later." }]
      };
      setMessages(prev => [...prev, confirmationMsg]);
      setActiveTab('chat');
    } catch (error) {
      console.error("Bypass failed:", error);
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
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSpeaking ? 'bg-neon-cyan text-black animate-pulse' : 'bg-white/5 text-neon-cyan'}`}>
                    {getPersonaIcon()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{PERSONA_CONFIG[persona].name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Settings2 className="w-3 h-3 text-white/20" />
                      <select 
                        value={methodology}
                        onChange={(e) => setMethodology(e.target.value as Methodology)}
                        className="bg-transparent text-[10px] text-white/40 uppercase font-bold tracking-widest outline-none cursor-pointer hover:text-neon-cyan transition-colors"
                      >
                        <option value="lobkowicz" className="bg-[#0a0a0a]">Philip Lobkowicz</option>
                        <option value="feynman" disabled className="bg-[#0a0a0a]">Richard Feynman (Coming Soon)</option>
                      </select>
                    </div>
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

              {/* Tabs */}
              <div className="flex p-1 bg-white/5 rounded-lg">
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${activeTab === 'chat' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </button>
                <button 
                  onClick={() => setActiveTab('alerts')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all relative ${activeTab === 'alerts' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                >
                  <AlertCircle className="w-4 h-4" />
                  Alerts
                  {alerts.some(a => a.status === 'pending') && (
                    <span className="absolute top-1 right-2 w-2 h-2 bg-neon-magenta rounded-full animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'chat' ? (
                <>
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
                <div key={i} className="space-y-4">
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-neon-cyan text-black font-medium' 
                        : 'bg-white/5 text-white/80 border border-white/10'
                    }`}>
                      {msg.parts[0].text}
                      {msg.role === 'model' && msg.parts[0].text && (
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

                  {/* Proposal Widget */}
                  {msg.role === 'model' && proposals[i] && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="ml-4 mr-12 p-4 rounded-2xl bg-white/[0.02] border border-neon-cyan/20 space-y-3"
                    >
                      <div className="flex items-center gap-2 text-neon-cyan">
                        <BrainCircuit className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Skylar Proposal</span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">
                          {proposals[i].action === 'update_dashboard' 
                            ? `Update ${proposals[i].data.field} to "${proposals[i].data.value}"`
                            : proposals[i].action === 'add_milestone'
                            ? `Add Milestone: ${proposals[i].data.title}`
                            : proposals[i].action === 'propose_major_shift'
                            ? `New Insight: ${proposals[i].data.content}`
                            : `Resolve Conflict: ${proposals[i].data.newInsight.content}`
                          }
                        </p>
                        {proposals[i].action === 'flag_dna_conflict' && (
                          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg mb-2">
                            <p className="text-[10px] text-red-400 font-bold uppercase mb-1">Conflict Detected</p>
                            <p className="text-[10px] text-white/40 line-through">Old: {proposals[i].data.existingInsightContent}</p>
                          </div>
                        )}
                        <p className="text-[10px] text-white/60 leading-relaxed italic">
                          "{proposals[i].reasoning}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {executedActions[i] ? (
                          <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase">
                            <CheckCircle2 className="w-3 h-3" />
                            Executed
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleExecuteAction(i)}
                              disabled={isLoading}
                              className="flex-1 py-2 bg-neon-cyan/10 hover:bg-neon-cyan text-neon-cyan hover:text-black border border-neon-cyan/20 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2"
                            >
                              Confirm
                            </button>
                            <button 
                              onClick={() => setProposals(prev => {
                                const next = { ...prev };
                                delete next[i];
                                return next;
                              })}
                              className="px-3 py-2 text-white/20 hover:text-white text-[10px] font-bold uppercase transition-colors"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-center">
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3 max-w-[90%]">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-[10px] text-red-200">{error}</p>
                    <button onClick={() => setError(null)} className="text-white/40 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
            /* Alerts Tab */
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">System Alerts</h4>
                <span className="text-[10px] text-white/20">{alerts.length} total</span>
              </div>
              
              {alerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-6 h-6 text-white/20" />
                  </div>
                  <p className="text-sm text-white/40">No active alerts. Your career path is currently aligned.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-4 rounded-xl border ${alert.status === 'pending' ? 'bg-neon-magenta/5 border-neon-magenta/20' : 'bg-white/5 border-white/10 opacity-60'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 p-1.5 rounded-lg ${alert.status === 'pending' ? 'bg-neon-magenta text-white' : 'bg-white/10 text-white/40'}`}>
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${alert.status === 'pending' ? 'text-neon-magenta' : 'text-white/40'}`}>
                            {alert.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-white/20">
                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-white/80 mb-3 leading-relaxed">
                          {alert.message}
                        </p>
                        
                        {alert.status === 'pending' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setActiveTab('chat')}
                              className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors"
                            >
                              Review in Chat
                            </button>
                            <button 
                              onClick={() => handleBypass(alert.id)}
                              className="flex-1 py-2 bg-neon-magenta/20 hover:bg-neon-magenta/30 text-neon-magenta text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors border border-neon-magenta/30"
                            >
                              Proceed Anyway
                            </button>
                          </div>
                        )}
                        
                        {alert.status === 'bypassed' && (
                          <div className="flex items-center gap-2 text-[10px] text-neon-magenta font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" />
                            Validation Pending (Human Review)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-6 border-t border-white/10 bg-white/[0.02]">
              {activeTab === 'chat' ? (
                !user ? (
                  <div className="flex flex-col items-center gap-4 py-2">
                    <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase font-bold tracking-wider">
                      <Lock className="w-3 h-3" />
                      <span>Authentication Required</span>
                    </div>
                    <button 
                      onClick={onLogin}
                      className="w-full py-3 bg-neon-cyan text-black rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all"
                    >
                      Login to Chat
                    </button>
                  </div>
                ) : (
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
                )
              ) : (
                /* Alerts Tab Footer */
                <div className="text-center py-2">
                  <p className="text-[10px] text-white/20">
                    Validation Gates ensure your career DNA aligns with market reality.
                  </p>
                </div>
              )}
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
