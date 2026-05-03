import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, RefreshCw, AlertTriangle, CheckCircle2, Brain } from 'lucide-react';
import { agentOpsService } from '../../services/agentOpsService';
import { JourneyStageDefinition, Modality } from '../../types/skylar';

export const AgentOpsPanel: React.FC = () => {
  const [configs, setConfigs] = useState<Record<string, JourneyStageDefinition>>({});
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const data = await agentOpsService.getAllConfigs();
      setConfigs(data);
      if (Object.keys(data).length > 0 && !selectedStage) {
        setSelectedStage(Object.keys(data)[0]);
      }
    } catch (error) {
      console.error('Failed to load agent configs:', error);
      showToast('Failed to load configurations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!selectedStage || !configs[selectedStage]) return;
    
    setIsSaving(true);
    try {
      await agentOpsService.saveConfig(selectedStage, configs[selectedStage]);
      showToast('Configuration saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save config:', error);
      showToast('Failed to save configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfigChange = (field: keyof JourneyStageDefinition, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [selectedStage]: {
        ...prev[selectedStage],
        [field]: value
      }
    }));
  };

  const handleUiConfigChange = (field: keyof JourneyStageDefinition['uiConfig'], value: string) => {
    setConfigs(prev => ({
      ...prev,
      [selectedStage]: {
        ...prev[selectedStage],
        uiConfig: {
          ...prev[selectedStage].uiConfig,
          [field]: value
        }
      }
    }));
  };

  const isModalityAllowed = (modality: string) => {
    const mods = configs[selectedStage]?.allowedModalities;
    if (!mods) return false;
    if (Array.isArray(mods)) return mods.includes(modality as any);
    return !!(mods as any)[modality];
  };

  const toggleModality = (modality: Modality) => {
    const current = configs[selectedStage].allowedModalities;
    let updated;
    if (Array.isArray(current)) {
      updated = current.includes(modality)
        ? current.filter(m => m !== modality)
        : [...current, modality];
    } else {
      updated = {
        ...(current as any),
        [modality]: !(current as any)[modality]
      };
    }
    handleConfigChange('allowedModalities', updated);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-neon-cyan animate-spin" />
      </div>
    );
  }

  const currentConfig = configs[selectedStage];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-neon-cyan" />
            Agent Operations
          </h2>
          <p className="text-white/60 mt-2">Manage Skylar's prompts, modalities, and UI configurations per journey stage.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !currentConfig}
          className="px-6 py-3 rounded-xl bg-neon-cyan text-black font-bold flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Configuration
        </button>
      </div>

      {toast && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${toast.type === 'success' ? 'bg-neon-lime/10 text-neon-lime border border-neon-lime/20' : 'bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/20'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Stage Selector */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Journey Stages</h3>
          {Object.keys(configs).map(stageId => (
            <button
              key={stageId}
              onClick={() => setSelectedStage(stageId)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                selectedStage === stageId
                  ? 'bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan'
                  : 'bg-white/5 border border-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <div className="font-bold">{configs[stageId].title}</div>
              <div className="text-[10px] opacity-60 truncate">{configs[stageId].description}</div>
            </button>
          ))}
        </div>

        {/* Main Editor */}
        {currentConfig && (
          <div className="lg:col-span-3 space-y-8">
            <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Stage Title</label>
                  <input
                    type="text"
                    value={currentConfig.title}
                    onChange={(e) => handleConfigChange('title', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Description</label>
                  <input
                    type="text"
                    value={currentConfig.description}
                    onChange={(e) => handleConfigChange('description', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">System Prompt Template</label>
                <textarea
                  value={currentConfig.systemPromptTemplate}
                  onChange={(e) => handleConfigChange('systemPromptTemplate', e.target.value)}
                  rows={12}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan outline-none font-mono text-sm leading-relaxed"
                />
                <p className="text-xs text-white/40 mt-2">Use <code className="text-neon-cyan">{'{{user.displayName}}'}</code> for variable interpolation.</p>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Required Artifacts (comma separated)</label>
                <input
                  type="text"
                  value={currentConfig.requiredArtifacts.join(', ')}
                  onChange={(e) => handleConfigChange('requiredArtifacts', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4">Allowed Modalities</label>
                <div className="flex gap-4">
                  {(['text', 'audio', 'image', 'video'] as Modality[]).map(mod => (
                    <button
                      key={mod}
                      onClick={() => toggleModality(mod)}
                      className={`px-4 py-2 rounded-lg border text-sm font-bold capitalize transition-all ${
                        isModalityAllowed(mod)
                          ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                          : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      {mod}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h4 className="text-sm font-bold text-white mb-4">UI Configuration</h4>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Theme</label>
                    <select
                      value={currentConfig.uiConfig.theme}
                      onChange={(e) => handleUiConfigChange('theme', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan outline-none"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="neon">Neon</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Layout</label>
                    <select
                      value={currentConfig.uiConfig.layout}
                      onChange={(e) => handleUiConfigChange('layout', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan outline-none"
                    >
                      <option value="chat-first">Chat First</option>
                      <option value="artifact-first">Artifact First</option>
                      <option value="split">Split</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Primary Color</label>
                    <input
                      type="text"
                      value={currentConfig.uiConfig.primaryColor || ''}
                      onChange={(e) => handleUiConfigChange('primaryColor', e.target.value)}
                      placeholder="e.g. neon-cyan"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
