import React, { useState, useEffect } from 'react';
import { useSkylarConfig } from '../../contexts/SkylarConfigContext';
import { configService } from '../../services/configService';
import { SkylarGlobalConfig, SkylarStageConfig } from '../../types/skylar-config';

import { STAGE_MANAGEMENT_GUIDANCE } from '../../config/defaultStageContent';
import { genkitTracer } from '../../services/agentOpsService';
import {
  HelpCircle,
  Info,
  Target,
  Check,
  X,
  TerminalSquare,
  Activity,
  Settings2,
  ShieldAlert,
} from 'lucide-react';

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

  // Genkit Traces State
  const [genkitTraces, setGenkitTraces] = useState<any[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<number | null>(null);

  useEffect(() => {
    // Bind to the genkitTracer to get real-time traces from the frontend client runs
    const unsubscribe = genkitTracer.subscribe((traces) => {
      setGenkitTraces([...traces]);
    });
    setGenkitTraces([...genkitTracer.getTraces()]);
    return () => unsubscribe();
  }, []);

  // Sync local state when global context loads
  useEffect(() => {
    if (global) {
      setEditGlobal(global);
    } else {
      // Initialize with default if it doesn't exist in Firestore
      setEditGlobal({
        id: 'skylar_global',
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        avatar: {
          url: '/skylar-avatar.png',
          scale: 1.0,
        },
        homeBenefits: ['Welcome to SPARKWavv'],
      });
    }
  }, [global]);

  const PREDEFINED_STAGES = [
    { id: 'dive-in', title: 'Dive-In' },
    { id: 'ignition', title: 'Ignition' },
    { id: 'discovery', title: 'Discovery' },
    { id: 'branding', title: 'Branding' },
    { id: 'outreach', title: 'Outreach' },
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
          import('../../config/defaultStageContent').then(({ DEFAULT_JOURNEY_STAGES }) => {
            const content = DEFAULT_JOURNEY_STAGES['dive-in'];
            const modalities = Array.isArray(content.allowedModalities)
              ? {
                  text: content.allowedModalities.includes('text'),
                  audio: content.allowedModalities.includes('audio'),
                  image: content.allowedModalities.includes('image'),
                  video: content.allowedModalities.includes('video'),
                }
              : content.allowedModalities;
            setEditStage({
              stageId: 'dive-in',
              stageTitle: content.title,
              description: content.description,
              systemPromptTemplate: content.systemPromptTemplate,
              requiredArtifacts: content.requiredArtifacts,
              allowedModalities: modalities as any,
              uiConfig: content.uiConfig as any,
            });
          });
        }
      } catch (error) {
        console.error('Failed to load stages', error);
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
      console.error('Failed to save config', error);
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
      let fallbackConfig: SkylarStageConfig;

      // Try to load from DEFAULT_JOURNEY_STAGES dynamically or hardcode import at top
      // Fortunately we already import it inside handleSeedDefaults,
      // let's do a hardcode import at the top of the file!
      import('../../config/defaultStageContent').then(({ DEFAULT_JOURNEY_STAGES }) => {
        const content = DEFAULT_JOURNEY_STAGES[id as keyof typeof DEFAULT_JOURNEY_STAGES];
        if (content) {
          const modalities = Array.isArray(content.allowedModalities)
            ? {
                text: content.allowedModalities.includes('text'),
                audio: content.allowedModalities.includes('audio'),
                image: content.allowedModalities.includes('image'),
                video: content.allowedModalities.includes('video'),
              }
            : content.allowedModalities;

          fallbackConfig = {
            stageId: id,
            stageTitle: content.title,
            description: content.description,
            systemPromptTemplate: content.systemPromptTemplate,
            requiredArtifacts: content.requiredArtifacts,
            allowedModalities: modalities as any,
            uiConfig: content.uiConfig as any,
          };
        } else {
          const predefined = PREDEFINED_STAGES.find((s) => s.id === id);
          fallbackConfig = {
            stageId: id,
            stageTitle: predefined ? predefined.title : id,
            description: '',
            systemPromptTemplate: '',
            requiredArtifacts: [],
            allowedModalities: { text: true, audio: false, image: false, video: false },
            uiConfig: { theme: 'dark', layout: 'split' },
          };
        }
        setEditStage(fallbackConfig);
      });
    }
  };

  const handleStageSave = async () => {
    if (!editStage || !selectedStageId) return;
    setIsStageSaving(true);
    try {
      await configService.updateStageConfig(selectedStageId, editStage);
      setStages((prev) => ({ ...prev, [selectedStageId]: editStage }));
      await refreshConfig();
      alert('Stage Settings saved successfully.');
    } catch (error) {
      console.error('Failed to save stage config', error);
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
        [modality]: !editStage.allowedModalities[modality],
      },
    });
  };

  const [isSeeding, setIsSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState<'global' | 'traces' | 'phase'>('global');

  const handleSeedDefaults = async () => {
    if (
      !window.confirm(
        'This will overwrite existing stage configurations with default values. Continue?'
      )
    )
      return;
    setIsSeeding(true);
    try {
      const { DEFAULT_JOURNEY_STAGES } = await import('../../config/defaultStageContent');
      for (const [stageId, content] of Object.entries(DEFAULT_JOURNEY_STAGES)) {
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
          uiConfig: content.uiConfig as any,
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
      console.error('Failed to seed defaults', error);
      alert('Error seeding default content.');
    } finally {
      setIsSeeding(false);
    }
  };

  if (!editGlobal) return <div className="p-8 text-white">Loading Agent Ops...</div>;

  return (
    <div className="max-w-5xl mx-auto p-8 text-white space-y-8">
      <h1 className="text-3xl font-bold text-cyan-400 font-display tracking-tight">
        Agent Operations Panel
      </h1>

      <div className="flex space-x-4 border-b border-gray-800 pb-4">
        <button
          onClick={() => setActiveTab('global')}
          className={`px-4 py-2 font-bold uppercase tracking-wider text-sm transition-colors ${activeTab === 'global' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Global Settings
        </button>
        <button
          onClick={() => setActiveTab('phase')}
          className={`px-4 py-2 font-bold uppercase tracking-wider text-sm transition-colors ${activeTab === 'phase' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Phase Management
        </button>
        <button
          onClick={() => setActiveTab('traces')}
          className={`px-4 py-2 font-bold uppercase tracking-wider text-sm transition-colors ${activeTab === 'traces' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Genkit Traces
        </button>
      </div>

      {activeTab === 'global' && (
        <section className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800 space-y-6 shadow-2xl">
          <h2 className="text-xl font-semibold border-b border-gray-700 pb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-cyan-400" />
            Global UI & Branding
          </h2>

          {/* Avatar Setup */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Avatar Image URL</label>
              <input
                type="text"
                value={editGlobal.avatar.url}
                onChange={(e) =>
                  setEditGlobal({
                    ...editGlobal,
                    avatar: { ...editGlobal.avatar, url: e.target.value },
                  })
                }
                placeholder="e.g. https://images.unsplash.com/..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none transition-colors text-white"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">
                Avatar Scale Multiplier ({editGlobal.avatar.scale}x)
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={editGlobal.avatar.scale}
                onChange={(e) =>
                  setEditGlobal({
                    ...editGlobal,
                    avatar: { ...editGlobal.avatar, scale: parseFloat(e.target.value) },
                  })
                }
                className="w-full h-2 mt-3 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>

          {/* Scrolling Benefits */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">
              Scrolling Benefit Statements
            </label>
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
                    onClick={() =>
                      setEditGlobal({
                        ...editGlobal,
                        homeBenefits: editGlobal.homeBenefits.filter((_, i) => i !== index),
                      })
                    }
                    className="px-4 py-2 bg-red-900/20 text-red-400 rounded-xl hover:bg-red-900/40 transition border border-red-900/30"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                setEditGlobal({
                  ...editGlobal,
                  homeBenefits: [...editGlobal.homeBenefits, 'New Benefit Statement'],
                })
              }
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
      )}

      {activeTab === 'traces' && (
        <section className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800 space-y-6 shadow-2xl">
          <h2 className="text-xl font-semibold border-b border-gray-700 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Live Genkit Trace Debugger
            </div>
            {genkitTraces.length > 0 && (
              <span className="text-xs bg-cyan-900/30 text-cyan-400 px-3 py-1 rounded-full font-bold">
                {genkitTraces.length} Traces Session
              </span>
            )}
          </h2>
          <div className="space-y-4 text-sm text-gray-300">
            <p>
              Sparkwavv dynamically runs Genkit client-side. Interact with Skylar in your app to
              capture live input/output JSON traces.
            </p>

            {genkitTraces.length === 0 ? (
              <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/50">
                <span className="text-gray-500 font-medium">
                  Waiting for Genkit activity... Talk to Skylar to generate a trace.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1 space-y-2 max-h-96 overflow-y-auto pr-2">
                  {genkitTraces.map((trace, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedTraceId(idx)}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition ${
                        selectedTraceId === idx
                          ? 'bg-cyan-900/40 border-cyan-500 text-cyan-50'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-300'
                      }`}
                    >
                      <div className="font-bold mb-1">[{trace.stageId}] Flow Trigger</div>
                      <div className="text-gray-500 truncate">
                        {new Date(trace.timestamp).toLocaleTimeString()}
                      </div>
                      {trace.executedActions?.length > 0 && (
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {trace.executedActions.map((a: any, i: number) => (
                            <span
                              key={i}
                              className="bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded text-[10px]"
                            >
                              {a.action}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="lg:col-span-3 bg-black rounded-xl border border-gray-700 overflow-hidden flex flex-col h-96">
                  {selectedTraceId !== null && genkitTraces[selectedTraceId] ? (
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                      <pre className="text-[11px] font-mono text-green-400">
                        {JSON.stringify(genkitTraces[selectedTraceId], null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-600 italic">
                      Select a trace to view payload
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'phase' && (
        <section className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800 space-y-8 shadow-2xl">
          <div className="flex justify-between items-center border-b border-gray-700 pb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Phase Management
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
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Select Stage
              </label>
              <select
                value={selectedStageId}
                onChange={handleStageSelect}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none text-white min-w-[200px]"
              >
                {PREDEFINED_STAGES.map((stage) => (
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
                    <label className="block text-sm font-medium text-gray-300">
                      System Prompt Template
                    </label>
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
                    onChange={(e) =>
                      setEditStage({ ...editStage, systemPromptTemplate: e.target.value })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none text-white font-mono h-96 resize-none leading-relaxed"
                    placeholder="Enter Skylar's persona and instructions for this stage..."
                  />
                </div>

                {/* Required Artifacts */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Required Artifacts (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editStage.requiredArtifacts.join(', ')}
                    onChange={(e) =>
                      setEditStage({
                        ...editStage,
                        requiredArtifacts: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none text-white"
                    placeholder="e.g. Resume, Strengths Analysis, Target Role"
                  />
                </div>

                {/* Modality Toggles */}
                <div className="space-y-4 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
                  <label className="block text-sm font-medium text-gray-300">
                    Allowed Modalities
                  </label>
                  <div className="flex flex-wrap gap-6">
                    {(['text', 'audio', 'image', 'video'] as const).map((modality) => (
                      <label
                        key={modality}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${editStage.allowedModalities[modality] ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600 group-hover:border-gray-400'}`}
                        >
                          <input
                            type="checkbox"
                            checked={editStage.allowedModalities[modality]}
                            onChange={() => handleModalityToggle(modality)}
                            className="hidden"
                          />
                          {editStage.allowedModalities[modality] && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm text-gray-300 capitalize group-hover:text-white transition-colors">
                          {modality}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Dynamic Widgets Builder */}
                <div className="space-y-4 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-300">
                      Page Widgets (Dynamic Layout)
                    </label>
                    <button
                      onClick={() => {
                        const newWidget = {
                          id: `w-${Date.now()}`,
                          type: 'CustomMarkdown' as any,
                          position: 'main' as any,
                          order: (editStage.uiConfig.widgets?.length || 0) + 1,
                          props: { content: 'New custom content block' },
                        };
                        setEditStage({
                          ...editStage,
                          uiConfig: {
                            ...editStage.uiConfig,
                            widgets: [...(editStage.uiConfig.widgets || []), newWidget],
                          },
                        });
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition font-bold uppercase tracking-widest"
                    >
                      + Add Widget
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(editStage.uiConfig.widgets || [])
                      .sort((a, b) => a.order - b.order)
                      .map((widget, idx) => (
                        <div
                          key={widget.id}
                          className="flex flex-col md:flex-row gap-3 bg-gray-900 p-4 rounded-xl border border-gray-700 items-start md:items-center"
                        >
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                            <select
                              value={widget.type}
                              onChange={(e) => {
                                const newWidgets = [...(editStage.uiConfig.widgets || [])];
                                newWidgets[idx].type = e.target.value as any;
                                setEditStage({
                                  ...editStage,
                                  uiConfig: { ...editStage.uiConfig, widgets: newWidgets },
                                });
                              }}
                              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                            >
                              <option value="ActionCenter">Action Center</option>
                              <option value="NeuralSynthesisEngine">Neural Engine</option>
                              <option value="ActivityFeed">Activity Feed</option>
                              <option value="SectorIntelligence">Sector Intelligence</option>
                              <option value="WavvaultHighlights">Wavvault Highlights</option>
                              <option value="StrengthsProfile">Strengths Profile</option>
                              <option value="JobMatchesPreview">Job Matches Preview</option>
                              <option value="SynthesisLabEntry">Synthesis Lab Entry</option>
                              <option value="CustomMarkdown">Custom Markdown</option>
                            </select>
                            <select
                              value={widget.position}
                              onChange={(e) => {
                                const newWidgets = [...(editStage.uiConfig.widgets || [])];
                                newWidgets[idx].position = e.target.value as any;
                                setEditStage({
                                  ...editStage,
                                  uiConfig: { ...editStage.uiConfig, widgets: newWidgets },
                                });
                              }}
                              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                            >
                              <option value="header">Header</option>
                              <option value="main">Main Content</option>
                              <option value="sidebar">Sidebar</option>
                            </select>
                            <input
                              type="number"
                              value={widget.order}
                              onChange={(e) => {
                                const newWidgets = [...(editStage.uiConfig.widgets || [])];
                                newWidgets[idx].order = parseInt(e.target.value) || 0;
                                setEditStage({
                                  ...editStage,
                                  uiConfig: { ...editStage.uiConfig, widgets: newWidgets },
                                });
                              }}
                              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                              placeholder="Order"
                            />
                          </div>

                          {widget.type === 'CustomMarkdown' && (
                            <input
                              type="text"
                              value={widget.props?.content || ''}
                              onChange={(e) => {
                                const newWidgets = [...(editStage.uiConfig.widgets || [])];
                                newWidgets[idx].props = {
                                  ...newWidgets[idx].props,
                                  content: e.target.value,
                                };
                                setEditStage({
                                  ...editStage,
                                  uiConfig: { ...editStage.uiConfig, widgets: newWidgets },
                                });
                              }}
                              placeholder="Markdown Content"
                              className="w-full md:w-auto flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                            />
                          )}

                          <button
                            onClick={() => {
                              const newWidgets = editStage.uiConfig.widgets?.filter(
                                (w) => w.id !== widget.id
                              );
                              setEditStage({
                                ...editStage,
                                uiConfig: { ...editStage.uiConfig, widgets: newWidgets },
                              });
                            }}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    {(!editStage.uiConfig.widgets || editStage.uiConfig.widgets.length === 0) && (
                      <div className="text-sm text-gray-500 text-center py-4">
                        No widgets configured for this stage.
                      </div>
                    )}
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
      )}
    </div>
  );
};
