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
  Lock,
  FileText,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { skylar, ChatMessage, SkylarPersona, PERSONA_CONFIG } from '../../services/skylarService';
import { useIdentity } from '../../contexts/IdentityContext';
import { useSkylarConfig } from '../../contexts/SkylarConfigContext';
import { useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

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
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [persona, setPersona] = useState<SkylarPersona>('discovery');
  const [methodology, setMethodology] = useState<Methodology>('lobkowicz');
  const [isListening, setIsListening] = useState(false);
  const [proposals, setProposals] = useState<Record<number, SkylarProposal>>({});
  const [executedActions, setExecutedActions] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'alerts'>('chat');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<{
    data: string;
    mimeType: string;
    name: string;
  } | null>(null);
  const [atsProposal, setAtsProposal] = useState<{ content: string; format: string } | null>(null);
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: 'success' | 'info' | 'warning' }[]
  >([]);
  const { user, profile } = useIdentity();
  const { global } = useSkylarConfig();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const playChime = () => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1); // E6
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (err) {
      console.warn('Failed to play chime:', err);
    }
  };

  const toggleListening = async (isAuto = false) => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        if (!isAuto) alert('Speech recognition is not supported in your browser.');
        return;
      }

      try {
        // Request microphone access explicitly if not already granted
        await navigator.mediaDevices.getUserMedia({ audio: true });

        if (isAuto) {
          playChime();
        }

        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        if (isAuto) {
           console.warn('Auto-listen restricted by browser (user interaction required for microphone).');
        } else {
           console.error('Microphone access denied:', err);
           setError(
             'Microphone access is required for voice-to-text. Please enable it in your browser settings.'
           );
        }
      }
    }
  };

  // Auto-listen when sidebar opens if voiceMode is enabled
  useEffect(() => {
    if (isOpen && profile?.voiceMode && !isListening) {
      // Small delay to ensure UI is ready and not jarring
      const timer = setTimeout(() => {
        toggleListening(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, profile?.voiceMode]);

  // Listen for external toggle events
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
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
        const token = await user.getIdToken();
        const history = await skylar.getChatHistory(uid, token);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB for Gemini)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      setSelectedFile({
        data: base64,
        mimeType: file.type,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;

    const parts: any[] = [];
    if (input.trim()) parts.push({ text: input });
    if (selectedFile) {
      parts.push({
        inlineData: {
          data: selectedFile.data,
          mimeType: selectedFile.mimeType,
        },
      });
    }

    const userMessage: ChatMessage = {
      role: 'user',
      parts: parts,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    const currentFile = selectedFile;
    setInput('');
    setSelectedFile(null);
    setIsLoading(true);
    setError(null);

    try {
      const uid = user?.uid || 'anonymous';
      const token = user ? await user.getIdToken() : undefined;

      // Convert history to Vertex format
      const vertexHistory = messages.map((msg) => ({
        role: msg.role,
        parts: msg.parts,
      }));

      let responseText = '';
      let executedActions = [];

      if (user) {
        // Use the new in-app orchestrator
        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            message: currentInput,
            history: vertexHistory,
            wavvaultContext: profile
          })
        });

        // Ensure the response is actually JSON before parsing to avoid generic errors
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          if (text.includes('Starting Server...</title>')) {
            throw new Error('The backend server is currently starting up. Please wait a few seconds and try again.');
          } else if (text.includes('Cookie check')) {
            throw new Error('Please authenticate in a new window or enable cookies for this preview to continue.');
          }
          throw new Error('Skylar response was obstructed by a network or proxy restriction.');
        }

        if (!res.ok) throw new Error('Failed to communicate with Skylar');
        
        const data = await res.json();
        responseText = data.text;
        
        if (data.toolCalls && data.toolCalls.length > 0) {
          executedActions = data.toolCalls.map((call: any) => ({
            action: call.name,
            data: call.args
          }));
        }
      } else {
        // Fallback for unauthenticated users
        const result = await skylar.chatWithVertex(
          uid === 'anonymous' ? '' : uid,
          currentInput,
          vertexHistory,
          undefined, // stageConfig not available here, will fallback to dive-in
          token,
          currentFile || undefined
        );
        responseText = result.response.text || result.response.candidates?.[0]?.content?.parts?.filter((part: any) => part.text)?.map((part: any) => part.text)?.join('') || '';
        executedActions = result.executedActions || [];
      }

      if (executedActions && executedActions.length > 0) {
        executedActions.forEach((action: any) => {
          // Show toast for auto-executed actions
          console.log(`[SKYLAR] Auto-executed: ${action.action}`, action.data);

          let toastMessage = `✨ Skylar auto-updated: ${action.data.field} to "${action.data.value}"`;
          if (action.action === 'save_dive_in_commitments') {
            toastMessage = `✨ Skylar saved your Dive-In commitments (${action.data.effortTier})`;
          } else if (action.action === 'save_ignition_exercises') {
            toastMessage = `✨ Skylar saved your Pie of Life and Perfect Day timeline`;
          } else if (action.action === 'save_career_dna_hypothesis') {
            toastMessage = `✨ Skylar saved your Career DNA Hypothesis`;
          } else if (action.action === 'update_journey_stage') {
            toastMessage = `✨ Skylar advanced your journey to ${action.data.newStage}`;
          }

          // 1. Add to toasts
          const newToast = {
            id: Date.now() + Math.random(),
            message: toastMessage,
            type: 'success' as const,
          };
          setToasts((prev) => [...prev, newToast]);

          // 2. Auto-remove toast after 5 seconds
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
          }, 5000);

          // 3. Add a system message to the chat
          const toastMsg: ChatMessage = {
            role: 'model',
            type: 'system',
            parts: [{ text: toastMessage }],
          };
          setMessages((prev) => [...prev, toastMsg]);

          // 4. Verbal confirmation if voice is enabled
          if (isVoiceEnabled) {
            let speakText = `I've updated your ${action.data.field} to ${action.data.value}.`;
            if (action.action === 'save_dive_in_commitments') {
              speakText = `I've saved your Dive-In commitments.`;
            } else if (action.action === 'save_ignition_exercises') {
              speakText = `I've saved your Pie of Life and Perfect Day timeline.`;
            } else if (action.action === 'save_career_dna_hypothesis') {
              speakText = `I've saved your Career DNA Hypothesis.`;
            } else if (action.action === 'update_journey_stage') {
              speakText = `I've advanced your journey to ${action.data.newStage}.`;
            }
            handleSpeak(speakText);
          }
        });
      }

      // Note: In the new architecture, proposals are handled differently. 
      // For now, we skip the 'calls' logic since the orchestrator handles execution.

      const modelMessage: ChatMessage = {
        role: 'model',
        type: 'chat',
        parts: [{ text: responseText || "I've processed your request. How else can I help?" }],
      };

      // Play chime on model reply
      playChime();

      setMessages((prev) => {
        const updatedMessages = [...prev, modelMessage];
        if (user) {
          user.getIdToken().then((token) => {
            skylar.saveChatToWavvault(user.uid, updatedMessages, token);
          });
        }

        // Auto-speak if voice is enabled
        if (isVoiceEnabled && responseText) {
          handleSpeak(responseText);
        }

        return updatedMessages;
      });

      // Check for warning phrase
      const warningPhrase =
        'I have some concerns about your current direction. Please review the notifications in the sidebar before proceeding.';
      if (responseText.includes(warningPhrase)) {
        // 1. Trigger TTS automatically
        handleSpeak(warningPhrase);

        // 2. Add to alerts
        const newAlert = {
          id: Date.now(),
          type: 'validation_warning',
          message:
            responseText.split(warningPhrase)[1]?.trim() ||
            'Validation Gate misalignment detected. Skylar recommends a strategic review.',
          timestamp: new Date().toISOString(),
          status: 'pending',
        };
        setAlerts((prev) => [newAlert, ...prev]);

        // 3. Switch to alerts tab
        setActiveTab('alerts');
      } else if (responseText && responseText.length < 200) {
        handleSpeak(responseText);
      }
    } catch (error: any) {
      console.error('Error generating response:', error);
      setError(error.message || 'Skylar is currently unavailable.');
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
          type: proposal.data?.type || 'strength',
          content: proposal.data?.content || 'New insight identified',
          evidence: proposal.data?.evidence || 'Conversation context',
          tags: proposal.data?.tags || [],
          status: 'confirmed',
          timestamp: new Date().toISOString(),
        };
        await fetch('/api/user-insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ insight }),
        });
      } else if (proposal.action === 'flag_dna_conflict') {
        // 1. Mark existing as superseded
        const existingInsightId = proposal.data?.existingInsightId;
        if (existingInsightId) {
          const existingResponse = await fetch(`/api/user-insights`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const allInsights = await existingResponse.json();
          const existing = allInsights.find((i: any) => i.id === existingInsightId);

          if (existing) {
            await fetch('/api/user-insights', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                insight: { ...existing, status: 'superseded' },
              }),
            });
          }
        }

        // 2. Add new insight as confirmed
        const newInsight = {
          ...(proposal.data?.newInsight || {}),
          status: 'confirmed',
          timestamp: new Date().toISOString(),
          conflictWith: existingInsightId,
        };
        await fetch('/api/user-insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ insight: newInsight }),
        });
      } else {
        await skylar.executeAction(uid, proposal.action, proposal.data || {}, token);
      }

      setExecutedActions((prev) => ({ ...prev, [index]: true }));

      // Add a confirmation message from Skylar
      const confirmationMsg: ChatMessage = {
        role: 'model',
        parts: [
          {
            text: `✅ Action confirmed: ${
              proposal.action === 'update_dashboard'
                ? 'Dashboard updated'
                : proposal.action === 'add_milestone'
                  ? 'Milestone added'
                  : proposal.action === 'propose_major_shift'
                    ? 'New insight confirmed'
                    : 'Conflict resolved and insight updated'
            }.`,
          },
        ],
      };
      setMessages((prev) => [...prev, confirmationMsg]);
    } catch (error: any) {
      console.error('Action execution failed:', error);
      setError(error.message || 'Failed to execute action.');
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.uid, reason: 'User bypassed soft gate warning.' }),
      });

      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: 'bypassed' } : a)));

      // Add a confirmation message from Skylar
      const confirmationMsg: ChatMessage = {
        role: 'model',
        parts: [
          {
            text: "⚠️ Validation bypassed. A human mentor has been notified to review your progress. You may continue, but please check the 'Human Mentor' section on your dashboard for feedback later.",
          },
        ],
      };
      setMessages((prev) => [...prev, confirmationMsg]);
      setActiveTab('chat');
    } catch (error) {
      console.error('Bypass failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAts = async () => {
    if (!atsProposal) return;
    const { content, format } = atsProposal;
    const filename = `Sparkwavv_ATS_Optimized_${new Date().toISOString().split('T')[0]}`;

    try {
      if (format === 'text') {
        const blob = new Blob([content], { type: 'text/plain' });
        saveAs(blob, `${filename}.txt`);
      } else if (format === 'markdown') {
        const blob = new Blob([content], { type: 'text/markdown' });
        saveAs(blob, `${filename}.md`);
      } else if (format === 'pdf') {
        const doc = new jsPDF();
        const splitText = doc.splitTextToSize(content, 180);
        doc.text(splitText, 15, 20);
        doc.save(`${filename}.pdf`);
      } else if (format === 'word') {
        const doc = new Document({
          sections: [
            {
              properties: {},
              children: content.split('\n').map(
                (line) =>
                  new Paragraph({
                    children: [new TextRun(line)],
                  })
              ),
            },
          ],
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${filename}.docx`);
      }
      setAtsProposal(null);
    } catch (err) {
      console.error('Download Error:', err);
      setError('Failed to generate download.');
    }
  };

  const handleSpeak = async (text: string) => {
    if (!text) return;
    if (isSpeaking) {
      audioRef.current?.pause();
      setIsSpeaking(false);
      return;
    }

    try {
      const audioUrl = await skylar.generateSpeech(text, persona);
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch((err) => {
          console.warn('Audio play failed (user interaction required):', err);
          setIsSpeaking(false);
        });
        setIsSpeaking(true);
      }
    } catch (error) {
      console.error('Error generating speech:', error);
    }
  };

  const getPersonaIcon = () => {
    switch (persona) {
      case 'discovery':
        return <Compass className="w-5 h-5" />;
      case 'branding':
        return <Award className="w-5 h-5" />;
      case 'outreach':
        return <Briefcase className="w-5 h-5" />;
      case 'rpp':
        return <ShieldCheck className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getSkylarAvatar = () => {
    return global?.avatar?.url || PERSONA_CONFIG[persona].avatar;
  };

  const getSkylarScale = () => {
    return global?.avatar?.scale || 1;
  };

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={clsx(
                'pointer-events-auto px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 min-w-[280px] backdrop-blur-md',
                toast.type === 'success'
                  ? 'bg-green-500/20 border-green-500/30 text-green-400'
                  : toast.type === 'warning'
                    ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                    : 'bg-neon-cyan/20 border-neon-cyan/30 text-neon-cyan'
              )}
            >
              <Zap className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-medium">{toast.message}</p>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="ml-auto p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Toggle Button - Only visible when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-50 w-20 h-20 rounded-full bg-[#0a0a0a] border-2 border-neon-cyan/50 text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:scale-110 transition-transform group overflow-hidden"
        >
          <img
            src={getSkylarAvatar()}
            alt="Skylar"
            className="w-full h-full object-cover object-[center_20%]"
            style={{ transform: `scale(${getSkylarScale()})` }}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-neon-magenta rounded-full border-2 border-[#050505] animate-pulse z-10" />
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
                  <div className="relative group">
                    <div
                      className={`w-[60px] h-[60px] rounded-xl overflow-hidden border-2 ${isSpeaking ? 'border-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.3)]' : 'border-white/10'}`}
                    >
                      <img
                        src={getSkylarAvatar()}
                        alt={PERSONA_CONFIG[persona].name}
                        className="w-full h-full object-cover object-[center_20%]"
                        style={{ transform: `scale(${getSkylarScale()})` }}
                        referrerPolicy="no-referrer"
                      />
                      {/* AI Shimmer Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
                      {/* Active Pulse */}
                      {isSpeaking && (
                        <div className="absolute inset-0 border-2 border-neon-cyan rounded-xl animate-ping opacity-20" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center">
                      <div className="text-neon-cyan">{getPersonaIcon()}</div>
                    </div>
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
                        <option value="lobkowicz" className="bg-[#0a0a0a]">
                          Philip Lobkowicz
                        </option>
                        <option value="feynman" disabled className="bg-[#0a0a0a]">
                          Richard Feynman (Coming Soon)
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mr-6 sm:mr-8">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
                    title="Close Chat"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isVoiceEnabled ? 'text-neon-cyan bg-neon-cyan/10 shadow-[0_0_10px_rgba(0,255,255,0.2)]' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
                    title={isVoiceEnabled ? 'Disable Voice' : 'Enable Voice'}
                  >
                    {isVoiceEnabled ? (
                      <Volume2 className="w-5 h-5" />
                    ) : (
                      <VolumeX className="w-5 h-5" />
                    )}
                  </button>
                </div>
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
                  {alerts.some((a) => a.status === 'pending') && (
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
                        <div className="w-16 h-16 rounded-full bg-neon-cyan/10 flex items-center justify-center mx-auto overflow-hidden border border-neon-cyan/20">
                          <img
                            src={getSkylarAvatar()}
                            alt="Skylar"
                            className="w-full h-full object-cover"
                            style={{ transform: `scale(${getSkylarScale()})` }}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <p className="text-xs text-white/40 italic px-8">
                          "Hello! I'm Skylar, your AI Career Assistant. I'm currently in{' '}
                          {PERSONA_CONFIG[persona].name} mode. How can I help you with your{' '}
                          {persona} phase today?"
                        </p>
                      </div>
                    )}

                    {atsProposal && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mx-6 my-4 p-4 rounded-2xl bg-gradient-to-br from-neon-cyan/10 to-transparent border border-neon-cyan/30 flex flex-col gap-4 shadow-[0_0_20px_rgba(0,255,255,0.1)]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-neon-cyan/20 flex items-center justify-center text-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.2)]">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">
                              ATS-Optimized Content Ready
                            </h4>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                              Format: {atsProposal.format.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAtsProposal(null)}
                            className="flex-1 py-2.5 text-xs font-bold text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={handleDownloadAts}
                            className="flex-[2] py-2.5 bg-neon-cyan text-black text-xs font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                          >
                            <Download className="w-4 h-4" />
                            Download Artifact
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {messages.map((msg, i) => (
                      <div key={i} className="space-y-4">
                        {msg.type === 'system' ? (
                          <div className="w-full flex justify-center my-4">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 flex items-center gap-3 shadow-lg"
                            >
                              <div className="w-6 h-6 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                                <Zap className="w-3 h-3 text-neon-cyan" />
                              </div>
                              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                                {msg.parts?.[0]?.text}
                              </span>
                            </motion.div>
                          </div>
                        ) : (
                          <div
                            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            {msg.role === 'model' && (
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 mt-1">
                                <img
                                  src={getSkylarAvatar()}
                                  alt="Skylar"
                                  className="w-full h-full object-cover object-[center_20%]"
                                  style={{ transform: `scale(${getSkylarScale()})` }}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                            {msg.role === 'user' && (
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 shrink-0 mt-1">
                                {user?.photoURL ? (
                                  <img
                                    src={user.photoURL}
                                    alt="User"
                                    className="w-full h-full object-cover rounded-lg"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="text-[10px] font-bold text-white/40 uppercase">
                                    {user?.displayName?.charAt(0) || 'U'}
                                  </div>
                                )}
                              </div>
                            )}
                            <div
                              className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                                msg.role === 'user'
                                  ? 'bg-neon-cyan text-black font-medium'
                                  : 'bg-white/5 text-white/80 border border-white/10'
                              }`}
                            >
                              {msg.parts?.[0]?.text}
                              {msg.role === 'model' && msg.parts?.[0]?.text && (
                                <button
                                  onClick={() => handleSpeak(msg.parts?.[0]?.text || '')}
                                  className="mt-2 flex items-center gap-1 text-[10px] uppercase font-bold text-white/40 hover:text-neon-cyan transition-colors"
                                >
                                  {isSpeaking ? (
                                    <VolumeX className="w-3 h-3" />
                                  ) : (
                                    <Volume2 className="w-3 h-3" />
                                  )}
                                  {isSpeaking ? 'Stop' : 'Listen'}
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Proposal Widget */}
                        {msg.role === 'model' && proposals[i] && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="ml-4 mr-12 p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-neon-cyan/20 space-y-4 shadow-xl"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-neon-cyan">
                                <BrainCircuit className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                  Strategic Proposal
                                </span>
                              </div>
                              <div className="px-2 py-0.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20">
                                <span className="text-[8px] font-bold text-neon-cyan uppercase tracking-tighter">
                                  Requires Concurrence
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <p className="text-xs font-bold text-white leading-snug">
                                  {proposals[i].action === 'update_dashboard'
                                    ? `Update ${proposals[i].data?.field || 'field'} to "${proposals[i].data?.value || 'new value'}"`
                                    : proposals[i].action === 'add_milestone'
                                      ? `Add Milestone: ${proposals[i].data?.title || 'New Milestone'}`
                                      : proposals[i].action === 'propose_major_shift'
                                        ? `Strategic Pivot: ${proposals[i].data?.content || 'New Insight'}`
                                        : `Resolve Conflict: ${proposals[i].data?.newInsight?.content || 'Updated Truth'}`}
                                </p>
                              </div>

                              {proposals[i].action === 'flag_dna_conflict' && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                  <div className="flex items-center gap-2 mb-1">
                                    <AlertCircle className="w-3 h-3 text-red-400" />
                                    <p className="text-[10px] text-red-400 font-bold uppercase">
                                      DNA Conflict Detected
                                    </p>
                                  </div>
                                  <p className="text-[10px] text-white/40 line-through italic">
                                    Old:{' '}
                                    {proposals[i].data?.existingInsightContent || 'Existing Truth'}
                                  </p>
                                </div>
                              )}

                              <div className="flex gap-2 items-start">
                                <div className="mt-1 w-1 h-1 rounded-full bg-neon-cyan shrink-0" />
                                <p className="text-[11px] text-white/60 leading-relaxed italic">
                                  "{proposals[i].reasoning}"
                                </p>
                              </div>
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
                                    onClick={() =>
                                      setProposals((prev) => {
                                        const next = { ...prev };
                                        delete next[i];
                                        return next;
                                      })
                                    }
                                    className="flex-1 py-2 text-[10px] font-bold text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                  >
                                    Decline
                                  </button>
                                  <button
                                    onClick={() => handleExecuteAction(i)}
                                    disabled={isLoading}
                                    className="flex-[2] py-2 bg-neon-cyan text-black text-[10px] font-bold rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                                  >
                                    Confirm & Execute
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
                          <button
                            onClick={() => setError(null)}
                            className="text-white/40 hover:text-white"
                          >
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
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">
                      System Alerts
                    </h4>
                    <span className="text-[10px] text-white/20">{alerts.length} total</span>
                  </div>

                  {alerts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-6 h-6 text-white/20" />
                      </div>
                      <p className="text-sm text-white/40">
                        No active alerts. Your career path is currently aligned.
                      </p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-xl border ${alert.status === 'pending' ? 'bg-neon-magenta/5 border-neon-magenta/20' : 'bg-white/5 border-white/10 opacity-60'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 p-1.5 rounded-lg ${alert.status === 'pending' ? 'bg-neon-magenta text-white' : 'bg-white/10 text-white/40'}`}
                          >
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider ${alert.status === 'pending' ? 'text-neon-magenta' : 'text-white/40'}`}
                              >
                                {alert.type.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-white/20">
                                {new Date(alert.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
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
                <div className="flex flex-col gap-3">
                  {selectedFile && (
                    <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="p-1.5 bg-neon-cyan/10 rounded text-neon-cyan shrink-0">
                          <Briefcase className="w-3 h-3" />
                        </div>
                        <span className="text-[10px] text-white/60 truncate">
                          {selectedFile.name}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-white/20 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {!user && (
                    <div className="flex items-center justify-center gap-2 text-[9px] text-white/20 uppercase font-bold tracking-widest mb-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Login to save chat history</span>
                    </div>
                  )}
                  <div className="relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <input
                      type="text"
                      placeholder="Ask Skylar anything..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-neon-cyan outline-none pr-32"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-white/20 hover:text-neon-cyan transition-colors"
                        title="Upload Resume or Image"
                      >
                        <Zap className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => toggleListening(false)}
                        className={`p-2 transition-colors ${isListening ? 'text-neon-cyan animate-pulse' : 'text-white/20 hover:text-neon-cyan'}`}
                        title={isListening ? 'Listening...' : 'Start Voice-to-Text'}
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={(!input.trim() && !selectedFile) || isLoading}
                        className="p-2 bg-neon-cyan text-black rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
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
