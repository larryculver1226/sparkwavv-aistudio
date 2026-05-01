import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Navigation, Settings2, Loader2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

interface LocalEvent {
  title: string;
  location: string;
  date?: string;
  url: string;
  type: 'event' | 'location';
}

import { getGeminiApiKey } from '../../../services/aiConfig';

export const LocalIntelligenceWidget: React.FC = () => {
  const [radius, setRadius] = useState(25);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LocalEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showRadiusControl, setShowRadiusControl] = useState(false);

  const fetchLocalIntelligence = async () => {
    setLoading(true);
    setError(null);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            reject(new Error("Location permission denied. Please allow location access."));
          } else {
            reject(new Error(err.message || "Failed to retrieve location due to a browser restriction."));
          }
        });
      });

      const { latitude, longitude } = position.coords;

      const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find networking events, conferences, and industry meetups within ${radius} miles of my location (${latitude}, ${longitude}). Prioritize events over static locations like co-working spaces or company headquarters.`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: { latitude, longitude },
            },
          },
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const mappedResults: LocalEvent[] = chunks
          .filter((chunk: any) => chunk.maps)
          .map((chunk: any) => ({
            title: chunk.maps.title,
            location: chunk.maps.title, // Maps tool usually returns title as location in simple cases
            url: chunk.maps.uri,
            type:
              chunk.maps.title.toLowerCase().includes('event') ||
              chunk.maps.title.toLowerCase().includes('meetup')
                ? 'event'
                : 'location',
          }));

        // Sort to prioritize events
        mappedResults.sort((a, b) => (a.type === 'event' ? -1 : 1));
        setResults(mappedResults);
      } else {
        setResults([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch local intelligence:', err);
      setError(err.message || 'Failed to access location or fetch data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalIntelligence();
  }, [radius]);

  return (
    <div className="glass-panel p-6 h-full flex flex-col gap-6 relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-neon-cyan/10 transition-all duration-700" />

      <header className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">
              Local Intelligence
            </h3>
            <p className="text-[10px] text-white/40 font-mono uppercase">
              Grounding Advice in Reality
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRadiusControl(!showRadiusControl)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all"
            title="Adjust Radius"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={fetchLocalIntelligence}
            disabled={loading}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all disabled:opacity-50"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Radius Control Overlay */}
      <AnimatePresence>
        {showRadiusControl && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 right-6 z-20 p-4 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl w-48 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/40 uppercase">Search Radius</span>
              <span className="text-xs font-bold text-neon-cyan">{radius} mi</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full accent-neon-cyan h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar relative z-10">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="w-6 h-6 text-neon-cyan animate-spin" />
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest animate-pulse">
              Triangulating Events...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-xs text-red-200">{error}</p>
            <button
              onClick={fetchLocalIntelligence}
              className="mt-2 text-[10px] font-bold uppercase text-neon-cyan hover:underline"
            >
              Retry
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-40">
            <Calendar className="w-8 h-8 mb-3" />
            <p className="text-xs">No high-resonance events found in your immediate vicinity.</p>
          </div>
        ) : (
          results.map((res, i) => (
            <motion.a
              key={i}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group/item block p-4 rounded-xl bg-white/5 border border-white/10 hover:border-neon-cyan/30 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                        res.type === 'event'
                          ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan'
                          : 'bg-white/10 border-white/20 text-white/40'
                      }`}
                    >
                      {res.type}
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover/item:text-neon-cyan transition-colors line-clamp-1">
                      {res.title}
                    </h4>
                  </div>
                  <p className="text-[10px] text-white/40 line-clamp-1">{res.location}</p>
                </div>
                <ExternalLink className="w-3 h-3 text-white/20 group-hover/item:text-neon-cyan transition-colors shrink-0" />
              </div>
            </motion.a>
          ))
        )}
      </div>

      <footer className="pt-4 border-t border-white/5 relative z-10">
        <p className="text-[9px] text-white/20 italic">
          "Physical proximity to industry hubs accelerates DNA resonance."
        </p>
      </footer>
    </div>
  );
};
