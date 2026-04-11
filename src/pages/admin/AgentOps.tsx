import React, { useState, useEffect } from 'react';
import { useSkylarConfig } from '../../contexts/SkylarConfigContext';
import { configService } from '../../services/configService';
import { SkylarGlobalConfig, SkylarStageConfig } from '../../types/skylar-config';

export const AgentOps: React.FC = () => {
  const { global, currentStage, refreshConfig } = useSkylarConfig();
  
  // Local state for editing before saving
  const [editGlobal, setEditGlobal] = useState<SkylarGlobalConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Stage Management State
  const [stages, setStages] = useState<Record<string, SkylarStageConfig>>({});
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [editStage, setEditStage] = useState<SkylarStageConfig | null>(null);
  const [isStageSaving, setIsStageSaving] = useState(false);

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
            allowedModalities: { text: true, audio: false, image: false, video: false }
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
        allowedModalities: { text: true, audio: false, image: false, video: false }
      });
    }
  };

  const handleStageSave = async () => {
    if (!editStage || !selectedStageId) return;
    setIsStageSaving(true);
    try {
      await configService.updateStageConfig(selectedStageId, editStage);
      setStages(prev => ({ ...prev, [selectedStageId]: editStage }));
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

  if (!editGlobal) return <div className="p-8 text-white">Loading Agent Ops...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 text-white space-y-12">
      <h1 className="text-3xl font-bold text-cyan-400">Agent Operations Panel</h1>

      {/* GLOBAL SETTINGS SECTION */}
      <section className="bg-gray-900 p-6 rounded-lg border border-gray-800 space-y-6">
        <h2 className="text-xl font-semibold border-b border-gray-700 pb-2">Global UI & Branding</h2>
        
        {/* Avatar Scale */}
        <div className="space-y-2">
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
            className="w-full accent-cyan-500"
          />
        </div>

        {/* Scrolling Benefits */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">Scrolling Benefit Statements</label>
          {editGlobal.homeBenefits.map((benefit, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={benefit}
                onChange={(e) => handleBenefitChange(index, e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              />
              <button 
                onClick={() => setEditGlobal({
                  ...editGlobal, 
                  homeBenefits: editGlobal.homeBenefits.filter((_, i) => i !== index)
                })}
                className="px-3 py-2 bg-red-900/50 text-red-400 rounded hover:bg-red-900 transition"
              >
                Remove
              </button>
            </div>
          ))}
          <button 
            onClick={() => setEditGlobal({
              ...editGlobal, 
              homeBenefits: [...editGlobal.homeBenefits, "New Benefit Statement"]
            })}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition"
          >
            + Add Statement
          </button>
        </div>

        <button 
          onClick={handleGlobalSave}
          disabled={isSaving}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded transition disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Global Settings'}
        </button>
      </section>
      
      {/* STAGE MANAGEMENT SECTION */}
      <section className="bg-gray-900 p-6 rounded-lg border border-gray-800 space-y-6">
        <h2 className="text-xl font-semibold border-b border-gray-700 pb-2">Stage Management</h2>
        
        {/* Stage Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Select Stage</label>
          <select 
            value={selectedStageId} 
            onChange={handleStageSelect}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none text-white"
          >
            {PREDEFINED_STAGES.map(stage => (
              <option key={stage.id} value={stage.id}>
                {stage.title} ({stage.id}) {stages[stage.id] ? '' : ' - (Not Created)'}
              </option>
            ))}
            {/* Add any custom stages that might exist in the DB but aren't predefined */}
            {Object.keys(stages)
              .filter(id => !PREDEFINED_STAGES.some(s => s.id === id))
              .map(id => (
                <option key={id} value={id}>
                  {stages[id].stageTitle} ({id})
                </option>
              ))}
          </select>
        </div>

        {editStage && (
          <div className="space-y-4">
            {/* Stage Title */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Stage Title</label>
              <input 
                type="text"
                value={editStage.stageTitle}
                onChange={(e) => setEditStage({ ...editStage, stageTitle: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none text-white"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Description</label>
              <textarea 
                value={editStage.description}
                onChange={(e) => setEditStage({ ...editStage, description: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none text-white h-24"
              />
            </div>

            {/* System Prompt Template */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">System Prompt Template</label>
              <textarea 
                value={editStage.systemPromptTemplate}
                onChange={(e) => setEditStage({ ...editStage, systemPromptTemplate: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none text-white font-mono h-64"
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
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none text-white"
              />
            </div>

            {/* Modality Toggles */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Allowed Modalities</label>
              <div className="flex gap-4">
                {(['text', 'audio', 'image', 'video'] as const).map(modality => (
                  <label key={modality} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={editStage.allowedModalities[modality]}
                      onChange={() => handleModalityToggle(modality)}
                      className="accent-cyan-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-300 capitalize">{modality}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={handleStageSave}
              disabled={isStageSaving}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded transition disabled:opacity-50 mt-4"
            >
              {isStageSaving ? 'Saving...' : 'Save Stage Settings'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
