import React, { useState } from 'react';
import { Upload, FileText, Loader2, Link as LinkIcon, User, Save } from 'lucide-react';
import { useIdentity } from '../../../contexts/IdentityContext';
import { skylar } from '../../../services/skylarService';

interface WavvaultSeedingWidgetProps {
  onSeedingComplete: () => void;
}

export const WavvaultSeedingWidget: React.FC<WavvaultSeedingWidgetProps> = ({ onSeedingComplete }) => {
  const { user } = useIdentity();
  const [linkedin, setLinkedin] = useState('');
  const [targetRoles, setTargetRoles] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!user) return;
    setIsProcessing(true);

    try {
      // In a real implementation this would:
      // 1. Upload resume file
      // 2. Parse file content using Gemini/Vertex via a backend route
      // 3. Extract skills, identities, and structural parameters

      // For now, simulate parsing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Construct seeded baseline data
      const rolesArray = targetRoles.split(',').map(r => r.trim()).filter(Boolean);

      const seededData = {
        userId: user.uid,
        identity: "Driven professional entering a transition phase.",
        strengths: ["Analytical Thinking", "Strategic Planning", "Adaptability"],
        skills: ["Project Management", "Stakeholder Communication"],
        metadata: {
          linkedinUrl: linkedin,
          targetRoles: rolesArray,
          resumeParsedAt: new Date().toISOString()
        },
        graph: { nodes: [], links: [] },
        logs: [],
        journeyEvents: [],
        artifacts: [],
        lastSynthesis: new Date().toISOString(),
        isDiscoveryUnlocked: false
      };

      await skylar.saveWavvaultData(seededData, true);

      // Create an artifact for the resume explicitly to seed it
      import('../../../services/wavvaultService').then(async ({ writeArtifact }) => {
        await writeArtifact({
            id: crypto.randomUUID(),
            userId: user.uid,
            type: 'Resume Summary',
            title: 'Initial Resume Parse',
            content: {
                rawRoles: targetRoles,
                linkedin,
                status: 'Parsed successfully'
            },
            summary: 'Initial parsing of the uploaded resume and contact information.',
            relatedStage: 'ignition'
        });
        
        setIsProcessing(false);
        onSeedingComplete();
      });

    } catch (err) {
      console.error('Failed to seed WavVault data', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-panel p-8 rounded-[2.5rem] border border-neon-cyan/20 bg-black/60 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,243,255,0.05),transparent_50%)]" />
      <div className="relative z-10 max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-neon-cyan" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">Seed Your Wavvault</h2>
          <p className="text-white/60 text-sm">
            To generate accurate phase insights, Skylar requires foundational metadata. Let's start with your baseline.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
            <label className="block text-sm font-bold text-white/80 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-neon-cyan" /> Resume Upload
            </label>
            <input 
              type="file" 
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="block w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-neon-cyan/10 file:text-neon-cyan hover:file:bg-neon-cyan/20 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
              <label className="block text-sm font-bold text-white/80 mb-2 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-neon-cyan" /> LinkedIn Profile
              </label>
              <input 
                type="url"
                value={linkedin}
                onChange={e => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan/50"
              />
            </div>
            <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
              <label className="block text-sm font-bold text-white/80 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-neon-cyan" /> Target Roles
              </label>
              <input 
                type="text"
                value={targetRoles}
                onChange={e => setTargetRoles(e.target.value)}
                placeholder="e.g. Product Manager, CTO"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan/50"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleProcess}
          disabled={isProcessing || !file}
          className="w-full py-4 bg-neon-cyan text-black font-bold uppercase tracking-widest rounded-2xl hover:bg-neon-cyan/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Parsing & Seeding...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Initialize Wavvault
            </>
          )}
        </button>
      </div>
    </div>
  );
};
