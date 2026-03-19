import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Moon, RefreshCw, ChevronRight, Loader2, Quote } from 'lucide-react';
import { Button } from './Button';
import { useIdentity } from '../contexts/IdentityContext';
import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey } from '../services/aiConfig';

interface SparkPrompt {
  title: string;
  prompt: string;
  protocolStage: string;
  skylarMessage: string;
}

export const EveningSpark: React.FC<{ currentStage: string }> = ({ currentStage }) => {
  const { user, profile } = useIdentity();
  const [loading, setLoading] = useState(false);
  const [sparkData, setSparkData] = useState<SparkPrompt | null>(null);
  const [mood, setMood] = useState('reflective');

  const generateSpark = async () => {
    setLoading(true);
    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        throw new Error("Gemini API key is missing. Please check your AI Studio settings.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";
      
      const prompt = `
        You are the Sparkwavv AI Companion, Skylar. 
        The user, ${profile?.displayName || 'Sparker'}, is currently in the "${currentStage || 'Discovery'}" stage of their career journey.
        Their current mood is "${mood || 'reflective'}".
        Their strengths include: ${profile?.brandDNAAttributes?.join(', ') || 'not yet defined'}.
        
        Generate a personalized "Evening Spark" prompt based on the R4 protocol (Reflect, Recharge, Refocus, Reignite).
        The prompt should be concise, encouraging, and deeply relevant to their current stage.
        Format the response as a JSON object with the following structure:
        {
          "title": "A catchy title for the session",
          "prompt": "The main reflection question or exercise",
          "protocolStage": "Reflect | Recharge | Refocus | Reignite",
          "skylarMessage": "A brief, supportive message from Skylar"
        }
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Skylar");
      
      const result = JSON.parse(text);
      setSparkData(result);
    } catch (err: any) {
      console.error("Error generating spark:", err);
      // Fallback if AI fails
      setSparkData({
        title: "Quiet Reflection",
        prompt: "Take a moment to breathe and acknowledge one small win from today, no matter how small.",
        protocolStage: "Reflect",
        skylarMessage: "I'm here with you. Even small steps are progress."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-neon-lime/5 blur-[100px] -mr-32 -mt-32 group-hover:bg-neon-lime/10 transition-colors duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neon-cyan/10 rounded-xl">
              <Moon className="w-6 h-6 text-neon-cyan" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Evening Spark</h3>
              <p className="text-zinc-500 text-sm">R4 Protocol Reflection</p>
            </div>
          </div>
          {!sparkData && (
            <Button 
              onClick={generateSpark} 
              disabled={loading}
              variant="outline" 
              className="gap-2 border-zinc-700 hover:border-neon-lime/50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-neon-lime" />}
              Ignite
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!sparkData ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <p className="text-zinc-400 leading-relaxed">
                Ready for your nightly R4 reflection? Skylar will generate a personalized prompt based on your current journey stage.
              </p>
              <div className="flex flex-wrap gap-2">
                {['reflective', 'tired', 'inspired', 'uncertain', 'focused'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      mood === m 
                        ? 'bg-neon-lime text-black shadow-[0_0_15px_rgba(0,255,159,0.3)]' 
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-neon-lime/10 text-neon-lime text-[10px] font-bold uppercase tracking-widest rounded border border-neon-lime/20">
                  {sparkData.protocolStage}
                </span>
              </div>
              
              <h4 className="text-2xl font-bold text-white leading-tight">
                {sparkData.title}
              </h4>

              <div className="relative p-6 bg-zinc-800/30 rounded-2xl border border-zinc-700/30">
                <Quote className="absolute -top-3 -left-3 w-8 h-8 text-neon-lime/20" />
                <p className="text-lg text-zinc-300 italic leading-relaxed">
                  {sparkData.prompt}
                </p>
              </div>

              <div className="flex items-start gap-4 p-4 bg-neon-cyan/5 rounded-2xl border border-neon-cyan/10">
                <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-neon-cyan" />
                </div>
                <p className="text-sm text-neon-cyan/80 italic">
                  "{sparkData.skylarMessage}" — Skylar
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => setSparkData(null)} 
                  variant="outline" 
                  className="flex-1 gap-2 border-zinc-800"
                >
                  <RefreshCw className="w-4 h-4" />
                  New Spark
                </Button>
                <Button className="flex-1 bg-neon-lime hover:bg-neon-lime/90 text-black gap-2">
                  Complete
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
