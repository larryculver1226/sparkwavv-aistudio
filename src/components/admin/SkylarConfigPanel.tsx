import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, RefreshCw, Plus, Trash2, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import { configService } from '../../services/configService';
import { generateHomeBenefits } from '../../services/geminiService';
import { SkylarGlobalConfig } from '../../types/skylar-config';

export const SkylarConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<SkylarGlobalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (config?.homeBenefits && config.homeBenefits.length > 1) {
      const interval = setInterval(() => {
        setPreviewIndex((prev) => (prev + 1) % config.homeBenefits.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [config?.homeBenefits]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await configService.getSkylarGlobalConfig(true);
      if (data) {
        setConfig(data);
      } else {
        // Initialize default if not found
        const defaultConfig: SkylarGlobalConfig = {
          id: 'skylar_global',
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          avatar: {
            url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800',
            scale: 1
          },
          homeBenefits: [
            "Skylar: Your high-fidelity intelligence partner.",
            "Sparkwavv: Decoding your professional DNA.",
            "Skylar: Identifying patterns you might have missed.",
            "Sparkwavv: Finding the intersection of skills and high-value opportunities.",
            "Wavvault: Dynamic asset generation based on your DNA."
          ]
        };
        setConfig(defaultConfig);
      }
    } catch (err: any) {
      setError('Failed to load configuration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updatedConfig = {
        ...config,
        lastUpdated: new Date().toISOString()
      };
      await configService.updateGlobalConfig(updatedConfig);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError('Failed to save configuration');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const newBenefits = await generateHomeBenefits(5);
      if (newBenefits && config) {
        setConfig({
          ...config,
          homeBenefits: newBenefits
        });
      }
    } catch (err: any) {
      setError('Failed to regenerate benefits. Check your Gemini API key.');
      console.error(err);
    } finally {
      setRegenerating(false);
    }
  };

  const addBenefit = () => {
    if (!config) return;
    setConfig({
      ...config,
      homeBenefits: [...config.homeBenefits, "New Benefit: Description goes here"]
    });
  };

  const updateBenefit = (index: number, value: string) => {
    if (!config) return;
    const newBenefits = [...config.homeBenefits];
    newBenefits[index] = value;
    setConfig({
      ...config,
      homeBenefits: newBenefits
    });
  };

  const removeBenefit = (index: number) => {
    if (!config) return;
    const newBenefits = config.homeBenefits.filter((_, i) => i !== index);
    setConfig({
      ...config,
      homeBenefits: newBenefits
    });
  };

  const resetToDefaults = () => {
    const defaultConfig: SkylarGlobalConfig = {
      id: 'skylar_global',
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      avatar: {
        url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800',
        scale: 1
      },
      homeBenefits: [
        "Skylar: Your high-fidelity intelligence partner.",
        "Sparkwavv: Decoding your professional DNA.",
        "Skylar: Identifying patterns you might have missed.",
        "Sparkwavv: Finding the intersection of skills and high-value opportunities.",
        "Wavvault: Dynamic asset generation based on your DNA."
      ]
    };
    setConfig(defaultConfig);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 text-neon-cyan animate-spin" />
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Skylar Global Configuration</h2>
          <p className="text-white/40 text-sm">Manage Skylar's appearance and home page messaging</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-white/40 hover:text-white transition-colors text-sm font-bold"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-neon-cyan text-black font-bold rounded-xl hover:bg-white transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-neon-lime/10 border border-neon-lime/20 rounded-xl flex items-center gap-3 text-neon-lime">
          <Sparkles className="w-5 h-5" />
          <p className="text-sm">Configuration saved successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Avatar Settings */}
        <div className="glass-panel p-6 border-white/5 bg-white/[0.02] rounded-3xl space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <ImageIcon className="w-5 h-5 text-neon-cyan" />
            <h3 className="text-lg font-bold">Avatar Appearance</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                Avatar URL
              </label>
              <input
                type="text"
                value={config.avatar.url}
                onChange={(e) => setConfig({ ...config, avatar: { ...config.avatar, url: e.target.value } })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan outline-none transition-colors"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                Image Scale ({config.avatar.scale})
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={config.avatar.scale}
                onChange={(e) => setConfig({ ...config, avatar: { ...config.avatar, scale: parseFloat(e.target.value) } })}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
              />
              <div className="flex justify-between text-[10px] text-white/20 mt-1">
                <span>0.5x</span>
                <span>1.0x</span>
                <span>2.0x</span>
              </div>
            </div>

            <div className="pt-4 flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-neon-cyan/30">
                  <img
                    src={config.avatar.url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={{ transform: `scale(${config.avatar.scale})` }}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 bg-zinc-900 border border-neon-cyan/50 rounded-lg">
                  <Sparkles className="w-3 h-3 text-neon-lime" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Home Benefits Settings */}
        <div className="glass-panel p-6 border-white/5 bg-white/[0.02] rounded-3xl space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-neon-lime" />
              <h3 className="text-lg font-bold">Home Page Benefits</h3>
            </div>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-all text-xs font-bold"
            >
              <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Regenerating...' : 'Regenerate with AI'}
            </button>
          </div>

          <div className="space-y-3">
            {config.homeBenefits.map((benefit, index) => (
              <div key={index} className="flex gap-2 group">
                <input
                  type="text"
                  value={benefit}
                  onChange={(e) => updateBenefit(index, e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-neon-cyan outline-none transition-colors"
                />
                <button
                  onClick={() => removeBenefit(index)}
                  className="p-2 text-white/20 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              onClick={addBenefit}
              className="w-full py-3 border border-dashed border-white/10 rounded-xl text-white/40 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Benefit Item
            </button>
          </div>

          <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Live Preview</p>
            <div className="h-12 flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={previewIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-white/60 italic text-center"
                >
                  {config.homeBenefits[previewIndex] || "No benefits configured..."}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
