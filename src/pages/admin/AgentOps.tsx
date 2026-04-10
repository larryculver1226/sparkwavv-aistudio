import React, { useState, useEffect } from 'react';
import { useSkylarConfig } from '../../contexts/SkylarConfigContext';
import { configService } from '../../services/configService';
import { SkylarGlobalConfig, SkylarStageConfig } from '../../types/skylar-config';

export const AgentOps: React.FC = () => {
  const { global, currentStage, refreshConfig } = useSkylarConfig();
  
  // Local state for editing before saving
  const [editGlobal, setEditGlobal] = useState<SkylarGlobalConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when global context loads
  useEffect(() => {
    if (global) setEditGlobal(global);
  }, [global]);

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
      
      {/* Note: Stage Settings to be built by AI Studio based on prompt below */}
    </div>
  );
};
