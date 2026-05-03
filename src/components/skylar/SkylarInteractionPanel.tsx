import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, Paperclip, Loader2, X, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { JourneyStageDefinition, SkylarArtifact } from '../../types/skylar';
import { skylar } from '../../services/skylarService';

import { agentOpsService } from '../../services/agentOpsService';
import { useSkylarLive } from '../../hooks/useSkylarLive';

interface SkylarInteractionPanelProps {
  stageId: string;
  user: any;
  artifacts?: SkylarArtifact[];
  missingArtifacts?: string[];
  onArtifactCreated?: (artifact: SkylarArtifact) => void;
  onActionTriggered?: (action: string, payload: any) => void;
  initialContext?: string;
}

interface Message {
  id: string;
  role: 'user' | 'skylar';
  content: string;
  timestamp: Date;
  attachments?: File[];
}

export const SkylarInteractionPanel: React.FC<SkylarInteractionPanelProps> = ({
  stageId,
  user,
  artifacts = [],
  missingArtifacts = [],
  onArtifactCreated,
  onActionTriggered,
  initialContext
}) => {
  const [stageConfig, setStageConfig] = useState<JourneyStageDefinition | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { isLive, isConnecting, startLiveSession, stopLiveSession, error: liveError } = useSkylarLive();

  useEffect(() => {
    const loadConfig = async () => {
      const config = await agentOpsService.getConfig(stageId);
      setStageConfig(config);
    };
    loadConfig();
  }, [stageId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Initial greeting based on stage using Genkit
  useEffect(() => {
    let mounted = true;

    const initGenkitGreeting = async () => {
      if (messages.length === 0 && stageConfig) {
        setIsTyping(true);
        try {
          const result = await skylar.chatWithVertex(
            user?.uid || 'anonymous',
            '[SYSTEM_INIT]',
            [], // Empty history
            stageConfig,
            undefined, // No token
            undefined, // No file
            missingArtifacts
          );

          if (mounted && result.response?.candidates?.length) {
            const responseText = result.response.candidates[0].content.parts[0].text;
            setMessages([
              {
                id: `init-${stageId}`,
                role: 'skylar',
                content: responseText,
                timestamp: new Date()
              }
            ]);
            
            if (result.executedActions && result.executedActions.length > 0) {
              result.executedActions.forEach((action: any) => {
                if (onActionTriggered) {
                  onActionTriggered(action.action, action.data);
                }
              });
            }
          }
        } catch (error) {
          console.error("Failed to initialize Genkit interaction:", error);
          if (mounted) {
            setMessages([
              {
                id: `init-${stageId}`,
                role: 'skylar',
                content: `Welcome to the ${stageConfig.title} phase, ${user?.displayName?.split(' ')[0] || 'there'}. Let's get started.`,
                timestamp: new Date()
              }
            ]);
          }
        } finally {
          if (mounted) setIsTyping(false);
        }
      }
    };

    initGenkitGreeting();

    return () => {
      mounted = false;
    };
  }, [stageConfig, user, stageId, missingArtifacts]);

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;

    const newUserMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: [...attachments]
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setAttachments([]);
    setIsTyping(true);

    try {
      // In a real implementation, we would send this to the backend/Gemini
      // using skylar.chatWithVertex or similar, passing the stageConfig.
      // For now, we simulate a response.
      
      const result = await skylar.chatWithVertex(
        user?.uid || 'anonymous',
        initialContext ? `${initialContext}\n\nUser Message: ${input}` : input,
        messages.filter(m => !m.content.includes('[SYSTEM_INIT]')).map(m => ({ role: m.role, content: m.content })),
        stageConfig,
        undefined, // token
        undefined, // file
        missingArtifacts
      );

      const responseText = result.response.candidates?.[0]?.content?.parts?.filter((part: any) => part.text)?.map((part: any) => part.text)?.join('') || '';

      const newSkylarMsg: Message = {
        id: crypto.randomUUID(),
        role: 'skylar',
        content: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newSkylarMsg]);
      
      if (result.executedActions && result.executedActions.length > 0) {
        result.executedActions.forEach((action: any) => {
          if (onActionTriggered) {
            onActionTriggered(action.action, action.data);
          }
        });
      }

    } catch (error) {
      console.error('Error communicating with Skylar:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'skylar',
        content: "I'm having trouble connecting right now. Let's try that again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const isModalityAllowed = (modality: string) => {
    if (!stageConfig?.allowedModalities) return false;
    if (Array.isArray(stageConfig.allowedModalities)) {
      return stageConfig.allowedModalities.includes(modality as any);
    }
    return !!(stageConfig.allowedModalities as any)[modality];
  };

  const getThemeClasses = () => {
    if (!stageConfig) return 'border-white/10 bg-white/5';
    switch (stageConfig.uiConfig.theme) {
      case 'neon': return 'border-neon-magenta/30 bg-black/60';
      case 'light': return 'border-gray-200 bg-white text-black';
      case 'dark':
      default: return 'border-white/10 bg-white/5';
    }
  };

  if (!stageConfig) {
    return (
      <div className="flex items-center justify-center h-full rounded-3xl border border-white/10 bg-black/20">
        <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full rounded-3xl border backdrop-blur-xl overflow-hidden ${getThemeClasses()}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
        <div>
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-${stageConfig.uiConfig.primaryColor || 'neon-cyan'} animate-pulse`} />
            Skylar
          </h2>
          <p className="text-xs text-white/50 uppercase tracking-widest font-bold mt-1">
            {stageConfig.title} Phase
          </p>
        </div>
        
        {/* Modality Indicators */}
        <div className="flex gap-2">
          {isModalityAllowed('audio') && <Mic className="w-4 h-4 text-white/30" />}
          {isModalityAllowed('image') && <ImageIcon className="w-4 h-4 text-white/30" />}
          {isModalityAllowed('video') && <Video className="w-4 h-4 text-white/30" />}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id || `msg-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-white/10 text-white rounded-tr-sm' 
                  : 'bg-black/40 border border-white/5 text-white/90 rounded-tl-sm'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                
                {/* Render Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.attachments.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-black/30 px-2 py-1 rounded-md">
                        <FileText className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-black/40 border border-white/5 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
                <span className="text-xs text-white/50">Skylar is synthesizing...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/40 border-t border-white/10">
        {/* Error Preview */}
        {liveError && (
          <div className="mb-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg text-xs text-red-200">
            {liveError}
          </div>
        )}

        {/* Attachment Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs text-white">
                <span className="truncate max-w-[100px]">{file.name}</span>
                <button onClick={() => removeAttachment(i)} className="hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-end gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl focus-within:border-white/30 transition-colors flex items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 bg-transparent text-white p-4 max-h-32 min-h-[56px] resize-none focus:outline-none text-sm custom-scrollbar"
              rows={1}
            />
            
            <div className="flex items-center p-2 gap-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept={isModalityAllowed('image') ? 'image/*,application/pdf,.doc,.docx' : 'application/pdf,.doc,.docx'}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              {isModalityAllowed('audio') && (
                <button 
                  onClick={() => isLive ? stopLiveSession() : startLiveSession(`You are Skylar, operating in the ${stageConfig.title} stage. ${stageConfig.systemPromptTemplate}`)}
                  disabled={isConnecting}
                  className={`p-2 rounded-xl transition-colors ${
                    isLive 
                      ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' 
                      : isConnecting 
                        ? 'text-neon-cyan animate-pulse bg-neon-cyan/10'
                        : 'text-white/40 hover:text-white hover:bg-white/10'
                  }`}
                  title={isLive ? "Stop Live Session" : "Start Live Session"}
                >
                  {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() && attachments.length === 0 || isTyping}
            className={`p-4 rounded-2xl bg-${stageConfig.uiConfig.primaryColor || 'neon-cyan'} text-black disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
