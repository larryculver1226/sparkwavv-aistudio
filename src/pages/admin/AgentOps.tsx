import React, { useState, useEffect } from 'react';
import { useSkylarConfig } from '../../contexts/SkylarConfigContext';
import { configService } from '../../services/configService';
import { SkylarGlobalConfig, SkylarStageConfig } from '../../types/skylar-config';

import { STAGE_MANAGEMENT_GUIDANCE } from '../../config/defaultStageContent';
import { HelpCircle, Info, Target, Check } from 'lucide-react';

export const AgentOps: React.FC = () => {
  const { global, refreshConfig } = useSkylarConfig();
  
  // Local state for editing before saving
  const [editGlobal, setEditGlobal] = useState<SkylarGlobalConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Stage Management State
  const [stages, setStages] = useState<Record<string, SkylarStageConfig>>({});
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [editStage, setEditStage] = useState<SkylarStageConfig | null>(null);
  const [isStageSaving, setIsStageSaving] = useState(false);
  const [showGuidance, setShowGuidance] = useState<string | null>(null);

  // Sync local state when global context loads
  useEffect(() => {
    if (global) {
      setEditGlobal(global);
    } else {
      // Initialize with default if it doesn't exist in Firestore
      setEditGlobal({
        id: "skylar_global",
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        avatar: {
          url: "/skylar-avatar.png",
          scale: 1.0
        },
        homeBenefits: ["Welcome to SPARKWavv"]
      });
    }
  }, [global]);

  const PREDEFINED_STAGES = [
    { id: 'dive-in', title: 'Dive-In' },
    { id: 'ignition', title: 'Ignition' },
    { id: 'discovery', title: 'Discovery' },
    { id: 'branding', title: 'Branding' },
    { id: 'outreach', title: 'Outreach' }
  ];

  // Load stages on mount
  useEffect(() => {
    const loadStages = async () => {
      try {
        const fetchedStages = await configService.getJourneyStages();
        setStages(fetchedStages);
        
        // Default to dive-in
        setSelectedStageId('dive-in');
        if (fetchedStages['dive-in']) {
          setEditStage(fetchedStages['dive-in']);
        } else {
          setEditStage({
            stageId: 'dive-in',
            stageTitle: 'Dive-In',
            description: '',
            systemPromptTemplate: '',
            requiredArtifacts: [],
            allowedModalities: { text: true, audio: false, image: false, video: false },
            uiConfig: { theme: 'dark', layout: 'split' }
          });
        }
      } catch (error) {
        console.error("Failed to load stages", error);
      }
    };
    loadStages();
  }, []);

  const handleGlobalSave = async () => {
    if (!editGlobal) return;
    setIsSaving(true);
    try {
      await configService.updateGlobalConfig(editGlobal);
      await refreshConfig();
      alert('Global Settings saved successfully.');
    } catch (error) {
      console.error("Failed to save config", error);
      alert('Error saving configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBenefitChange = (index: number, value: string) => {
    if (!editGlobal) return;
    const newBenefits = [...editGlobal.homeBenefits];
    newBenefits[index] = value;
    setEditGlobal({ ...editGlobal, homeBenefits: newBenefits });
  };

  const handleStageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedStageId(id);
    if (stages[id]) {
      setEditStage(stages[id]);
    } else {
      const predefined = PREDEFINED_STAGES.find(s => s.id === id);
      setEditStage({
        stageId: id,
        stageTitle: predefined ? predefined.title : id,
        description: '',
        systemPromptTemplate: '',
        requiredArtifacts: [],
        allowedModalities: { text: true, audio: false, image: false, video: false },
        uiConfig: { theme: 'dark', layout: 'split' }
      });
    }
  };

  const handleStageSave = async () => {
    if (!editStage || !selectedStageId) return;
    setIsStageSaving(true);
    try {
      await configService.updateStageConfig(selectedStageId, editStage);
      setStages(prev => ({ ...prev, [selectedStageId]: editStage }));
      await refreshConfig();
      alert('Stage Settings saved successfully.');
    } catch (error) {
      console.error("Failed to save stage config", error);
      alert('Error saving stage configuration.');
    } finally {
      setIsStageSaving(false);
    }
  };

  const handleModalityToggle = (modality: keyof SkylarStageConfig['allowedModalities']) => {
    if (!editStage) return;
    setEditStage({
      ...editStage,
      allowedModalities: {
        ...editStage.allowedModalities,
        [modality]: !editStage.allowedModalities[modality]
      }
    });
  };

  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedDefaults = async () => {
    if (!window.confirm('This will overwrite existing stage configurations with default values. Continue?')) return;
    setIsSeeding(true);
    try {
      const { DEFAULT_STAGE_CONTENT } = await import('../../config/defaultStageContent');
      for (const [stageId, content] of Object.entries(DEFAULT_STAGE_CONTENT)) {
        const modalities = Array.isArray(content.allowedModalities) 
          ? {
              text: content.allowedModalities.includes('text'),
              audio: content.allowedModalities.includes('audio'),
              image: content.allowedModalities.includes('image'),
              video: content.allowedModalities.includes('video'),
            }
          : content.allowedModalities;

        const config: SkylarStageConfig = {
          stageId,
          stageTitle: content.title,
          description: content.description,
          systemPromptTemplate: content.systemPromptTemplate,
          requiredArtifacts: content.requiredArtifacts,
          allowedModalities: modalities as any,
          uiConfig: content.uiConfig as any
        };
        await configService.updateStageConfig(stageId, config);
      }
      // Refresh stages
      const fetchedStages = await configService.getJourneyStages(true);
      setStages(fetchedStages);
      if (fetchedStages[selectedStageId]) {
        setEditStage(fetchedStages[selectedStageId]);
      }
      alert('Default stage content seeded successfully.');
    } catch (error) {
      console.error("Failed to seed defaults", error);
      alert('Error seeding default content.');
    } finally {
      setIsSeeding(false);
    }
  };

  if (!editGlobal) return <div className="p-8 text-white">Loading Agent Ops...</div>;

  return (
    <div className="max-w-5xl mx-auto p-8 text-white space-y-12">
      <h1 className="text-3xl font-bold text-cyan-400 font-display tracking-tight">Agent Operations Panel</h1>

      {/* GLOBAL SETTINGS SECTION */}
      <section className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800 space-y-6 shadow-2xl">
        <h2 className="text-xl font-semibold border-b border-gray-700 pb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-cyan-400" />
          Global UI & Branding
        </h2>
        
        {/* Avatar Scale */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-300">
            Avatar Scale Multiplier ({editGlobal.avatar.scale}x)
          </label>
          <input 
            type="range" min="0.5" max="2.0" step="0.05"
            value={editGlobal.avatar.scale}
            onChange={(e) => setEditGlobal({
              ...editGlobal, 
              avatar: { ...editGlobal.avatar, scale: parseFloat(e.target.value) }
            })}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        {/* Scrolling Benefits */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-300">Scrolling Benefit Statements</label>
          <div className="space-y-3">
            {editGlobal.homeBenefits.map((benefit, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={benefit}
                  onChange={(e) => handleBenefitChange(index, e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none transition-colors"
                />
                <button 
                  onClick={() => setEditGlobal({
                    ...editGlobal, 
                    homeBenefits: editGlobal.homeBenefits.filter((_, i) => i !== index)
                  })}
                  className="px-4 py-2 bg-red-900/20 text-red-400 rounded-xl hover:bg-red-900/40 transition border border-red-900/30"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setEditGlobal({
              ...editGlobal, 
              homeBenefits: [...editGlobal.homeBenefits, "New Benefit Statement"]
            })}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition font-bold uppercase tracking-widest"
          >
            + Add Statement
          </button>
        </div>

        <button 
          onClick={handleGlobalSave}
          disabled={isSaving}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-xl transition disabled:opacity-50 shadow-lg shadow-cyan-600/20"
        >
          {isSaving ? 'Saving...' : 'Save Global Settings'}
        </button>
      </section>
      
      {/* STAGE MANAGEMENT SECTION */}
      <section className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800 space-y-8 shadow-2xl">
        <div className="flex justify-between items-center border-b border-gray-700 pb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Stage Management
          </h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSeedDefaults}
              disabled={isSeeding}
              className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-cyan-400 transition"
            >
              {isSeeding ? 'Seeding...' : 'Seed Defaults'}
            </button>
            <div className="h-4 w-px bg-gray-700 mx-2" />
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Select Stage</label>
            <select 
              value={selectedStageId} 
              onChange={handleStageSelect}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none text-white min-w-[200px]"
            >
              {PREDEFINED_STAGES.map(stage => (
                <option key={stage.id} value={stage.id}>
                  {stage.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {editStage && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Stage Title */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Stage Title</label>
                <input 
                  type="text"
                  value={editStage.stageTitle}
                  onChange={(e) => setEditStage({ ...editStage, stageTitle: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none text-white"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-300">Description</label>
                </div>
                <textarea 
                  value={editStage.description}
                  onChange={(e) => setEditStage({ ...editStage, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none text-white h-24 resize-none"
                />
              </div>

              {/* System Prompt Template */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-300">System Prompt Template</label>
                  <button 
                    onClick={() => setShowGuidance(showGuidance === 'prompt' ? null : 'prompt')}
                    className="text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 text-xs font-bold uppercase tracking-widest"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Guidance
                  </button>
                </div>
                <textarea 
                  value={editStage.systemPromptTemplate}
                  onChange={(e) => setEditStage({ ...editStage, systemPromptTemplate: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none text-white font-mono h-96 resize-none leading-relaxed"
                  placeholder="Enter Skylar's persona and instructions for this stage..."
                />
              </div>

              {/* Required Artifacts */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Required Artifacts (comma-separated)</label>
                <input 
                  type="text"
                  value={editStage.requiredArtifacts.join(', ')}
                  onChange={(e) => setEditStage({ 
                    ...editStage, 
                    requiredArtifacts: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none text-white"
                  placeholder="e.g. Resume, Strengths Analysis, Target Role"
                />
              </div>

              {/* Modality Toggles */}
              <div className="space-y-4 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
                <label className="block text-sm font-medium text-gray-300">Allowed Modalities</label>
                <div className="flex flex-wrap gap-6">
                  {(['text', 'audio', 'image', 'video'] as const).map(modality => (
                    <label key={modality} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${editStage.allowedModalities[modality] ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600 group-hover:border-gray-400'}`}>
                        <input 
                          type="checkbox"
                          checked={editStage.allowedModalities[modality]}
                          onChange={() => handleModalityToggle(modality)}
                          className="hidden"
                        />
                        {editStage.allowedModalities[modality] && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-gray-300 capitalize group-hover:text-white transition-colors">{modality}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleStageSave}
                disabled={isStageSaving}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-10 rounded-xl transition disabled:opacity-50 shadow-lg shadow-cyan-600/20 w-full lg:w-auto"
              >
                {isStageSaving ? 'Saving...' : 'Save Stage Settings'}
              </button>
            </div>

            {/* Guidance Sidebar */}
            <div className="lg:col-span-1">
              {showGuidance === 'prompt' ? (
                <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-2xl p-6 sticky top-8 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    {STAGE_MANAGEMENT_GUIDANCE.systemPromptTemplate.title}
                  </h3>
                  <div className="text-sm text-gray-300 space-y-4 prose prose-invert prose-cyan max-w-none">
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {STAGE_MANAGEMENT_GUIDANCE.systemPromptTemplate.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800/30 border border-gray-700 border-dashed rounded-2xl p-8 text-center sticky top-8">
                  <HelpCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">
                    Select a field to see guidance and best practices for stage management.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
