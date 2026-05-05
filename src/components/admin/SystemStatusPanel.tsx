import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Database, 
  Zap, 
  Search, 
  Brain, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  ExternalLink,
  Info,
  SearchCode,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { getGeminiApiKey } from '../../services/aiConfig';
import { probeFirebaseKeyForGeminiAccess, ProbeResult } from '../../utils/securityProbes';

interface SystemStatus {
  firebase: {
    admin: boolean;
    projectId: string | null;
    databaseId: string | null;
  };
  gemini: {
    configured: boolean;
    keyMasked: string | null;
  };
  vertex: {
    projectId: string | null;
    searchEngineId: string | null;
    dataStoreId: string | null;
    location: string;
    lobkowiczEndpointId: string | null;
    financeEndpointId: string | null;
    techEndpointId: string | null;
    medlmModelId: string | null;
  };
}

interface DiscoveryResult {
  projectId: string | null;
  location: string;
  searchEngines: Array<{ id: string; displayName: string }>;
  dataStores: Array<{ id: string; displayName: string }>;
  endpoints: Array<{ id: string; displayName: string; matchingKey?: string }>;
  buckets: Array<{ name: string; matchingKey?: string }>;
  suggestions: Record<string, string>;
}

export const SystemStatusPanel: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [discovery, setDiscovery] = useState<DiscoveryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null);
  const [mapsProbeResult, setMapsProbeResult] = useState<ProbeResult | null>(null);
  const [probing, setProbing] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/system-status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDiscovery = async () => {
    setScanning(true);
    try {
      const response = await fetch('/api/admin/vertex/discover');
      const data = await response.json();
      setDiscovery(data);
    } catch (error) {
      console.error('Discovery failed:', error);
    } finally {
      setScanning(false);
    }
  };

  const copyToClipboard = () => {
    if (!discovery) return;
    const envString = Object.entries(discovery.suggestions)
      .map(([key, val]) => `${key}=${val}`)
      .join('\n');
    navigator.clipboard.writeText(envString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runProbe = async () => {
    setProbing(true);
    try {
      // Probe Firebase Key (Client-side probe)
      const fbResult = await probeFirebaseKeyForGeminiAccess();
      setProbeResult(fbResult);

      // Probe Maps Key (Backend-side probe)
      const mapsResp = await fetch('/api/admin/probe-maps-key');
      if (mapsResp.ok) {
        const mapsData = await mapsResp.json();
        setMapsProbeResult(mapsData);
      }
    } catch (error) {
      console.error('Probe failed:', error);
    } finally {
      setProbing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    runProbe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 text-neon-cyan animate-spin" />
      </div>
    );
  }

  if (!status) return null;

  const StatusCard = ({ title, icon: Icon, children, isConfigured }: any) => (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isConfigured ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white">{title}</h3>
        </div>
        {isConfigured ? (
          <div className="flex items-center gap-1.5 text-green-400 text-[10px] font-bold uppercase tracking-widest">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-yellow-400 text-[10px] font-bold uppercase tracking-widest">
            <AlertTriangle className="w-3 h-3" />
            Pending
          </div>
        )}
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );

  const StatusItem = ({ label, value, isMissing }: { label: string; value: string | null; isMissing?: boolean }) => (
    <div className="flex items-center justify-between text-xs">
      <span className="text-white/40">{label}</span>
      <span className={isMissing ? 'text-red-400 italic' : 'text-white/80 font-mono'}>
        {value || 'Not Configured'}
      </span>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">System Status</h2>
          <p className="text-white/40 text-sm">Monitor core infrastructure and AI service health</p>
        </div>
        <button
          onClick={fetchStatus}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Firebase Status */}
        <StatusCard title="Firebase Admin" icon={Shield} isConfigured={status.firebase.admin}>
          <StatusItem label="Project ID" value={status.firebase.projectId} />
          <StatusItem label="Database ID" value={status.firebase.databaseId} />
          <StatusItem label="Admin SDK" value={status.firebase.admin ? 'Connected' : 'Missing Service Account'} isMissing={!status.firebase.admin} />
        </StatusCard>

        {/* Gemini Status */}
        <StatusCard title="Gemini AI" icon={Zap} isConfigured={status.gemini.configured}>
          <StatusItem label="API Key" value={status.gemini.keyMasked} isMissing={!status.gemini.configured} />
          <StatusItem label="Status" value={status.gemini.configured ? 'Ready' : 'Key Missing'} isMissing={!status.gemini.configured} />
        </StatusCard>

        {/* Vertex AI Status */}
        <StatusCard title="Vertex AI" icon={Brain} isConfigured={!!status.vertex.searchEngineId}>
          <StatusItem label="Project ID" value={status.vertex.projectId} />
          <StatusItem label="Location" value={status.vertex.location} />
          <StatusItem label="Search Engine" value={status.vertex.searchEngineId} isMissing={!status.vertex.searchEngineId} />
          <StatusItem label="MedLM Model" value={status.vertex.medlmModelId || 'medlm-medium (Default)'} />
          <StatusItem label="Lobkowicz EP" value={status.vertex.lobkowiczEndpointId} />
          <StatusItem label="Finance EP" value={status.vertex.financeEndpointId} />
          <StatusItem label="Tech EP" value={status.vertex.techEndpointId} />
        </StatusCard>
      </div>

      {/* Security Probes / Vulnerability Check */}
      <div className={`border rounded-2xl p-6 transition-all ${
        (probeResult?.isVulnerable || mapsProbeResult?.isVulnerable)
          ? 'bg-red-500/5 border-red-500/20' 
          : (probeResult?.status === 'secure' && mapsProbeResult?.status === 'secure')
            ? 'bg-green-500/5 border-green-500/20'
            : 'bg-white/5 border-white/10'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              (probeResult?.isVulnerable || mapsProbeResult?.isVulnerable) ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
            }`}>
              {(probeResult?.isVulnerable || mapsProbeResult?.isVulnerable) ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-white">Vulnerability Assessment</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-display font-bold">March 2026 Disclosure Check</p>
            </div>
          </div>
          <button
            onClick={runProbe}
            disabled={probing}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold rounded-lg transition-all"
          >
            {probing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Rescan Keys
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Key Checklist */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">Monitored Keys</h4>
            
            {/* Firebase Key */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/5">
              <div className="flex items-start gap-3">
                <div className={`mt-1 p-1 rounded-full ${probeResult?.isVulnerable ? 'bg-red-500/20 text-red-500' : probeResult?.status === 'secure' ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white/20'}`}>
                  {probeResult?.isVulnerable ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Firebase Web Key</p>
                  <p className={`text-sm font-bold ${probeResult?.isVulnerable ? 'text-red-400' : probeResult?.status === 'secure' ? 'text-green-400' : 'text-white/20'}`}>
                    {probeResult?.isVulnerable ? 'OVER-PRIVILEGED' : probeResult?.status === 'secure' ? 'Properly Restricted' : 'Scanning...'}
                  </p>
                  <p className="text-[10px] font-mono text-white/30 truncate">AIzaSyC3RR...d8dU</p>
                </div>
              </div>
            </div>

            {/* Maps Key */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/5">
              <div className="flex items-start gap-3">
                <div className={`mt-1 p-1 rounded-full ${mapsProbeResult?.isVulnerable ? 'bg-red-500/20 text-red-500' : mapsProbeResult?.status === 'secure' ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white/20'}`}>
                  {mapsProbeResult?.isVulnerable ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Google Maps API Key</p>
                  <p className={`text-sm font-bold ${mapsProbeResult?.isVulnerable ? 'text-red-400' : mapsProbeResult?.status === 'secure' ? 'text-green-400' : 'text-white/20'}`}>
                    {mapsProbeResult?.isVulnerable ? 'OVER-PRIVILEGED' : mapsProbeResult?.status === 'secure' ? 'Properly Restricted' : mapsProbeResult?.status === 'missing' ? 'Not Configured' : 'Scanning...'}
                  </p>
                  <p className="text-[10px] font-mono text-white/30 truncate">GOOGLE_MAPS_API_KEY</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-white/20" />
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">Vulnerability Details</h4>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              Following the March 2026 disclosure, Google Cloud API keys (Maps, Firebase, etc.) were retroactively granted Gemini access. 
              This probe attempts a <strong>limited token-count operation</strong> via the Generative Language API using your keys.
            </p>
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
              <p className="text-[10px] text-white/60 leading-relaxed italic">
                {mapsProbeResult?.message || probeResult?.message || "All keys are checked for the 'Gemini Probe' response. If any key returns a 200 OK, it means it can be used to drain your GenAI quota."}
              </p>
            </div>
            <a href="https://www.upguard.com/news/google-data-breach-2026-03-01" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-neon-cyan hover:underline font-bold uppercase tracking-widest">
              Read Disclosure <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Configuration Guide / Call to Action */}
      <div className="bg-gradient-to-br from-neon-cyan/10 to-transparent border border-neon-cyan/20 rounded-2xl p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-neon-cyan/20 text-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.2)]">
            <Info className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Configuration Required</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              To enable full enterprise intelligence, including Vertex AI Search and fine-tuned models, 
              you must provide your Google Cloud credentials in the **AI Studio Settings**.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Step 1: Service Account</p>
            <p className="text-xs text-white/80">
              Provide your <code className="text-neon-cyan">FIREBASE_SERVICE_ACCOUNT_JSON</code> to enable the Admin SDK.
            </p>
          </div>
          <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Step 2: Vertex IDs</p>
            <p className="text-xs text-white/80">
              Configure <code className="text-neon-cyan">VERTEX_AI_SEARCH_ENGINE_ID</code> to enable Wavvault Search.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button 
            onClick={runDiscovery}
            disabled={scanning || !status.firebase.admin}
            className="flex items-center gap-2 px-6 py-3 bg-neon-cyan text-black font-bold rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)]"
          >
            {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <SearchCode className="w-4 h-4" />}
            Scan for Resources
          </button>
          <a 
            href="https://console.cloud.google.com/vertex-ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
          >
            Google Cloud Console
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Discovery Results */}
      {discovery && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 border border-white/10 rounded-2xl p-8 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <SearchCode className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Discovery Report</h3>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs font-bold rounded-xl transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Env Block'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">Suggested Configuration</h4>
              <div className="bg-black/60 rounded-xl p-4 font-mono text-xs text-purple-300 border border-purple-500/20 overflow-x-auto">
                {Object.entries(discovery.suggestions).map(([key, val]) => (
                  <div key={key} className="py-1">
                    <span className="text-purple-500">{key}</span>
                    <span className="text-white/40">=</span>
                    <span className="text-white/80">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">Resources Found</h4>
              <div className="space-y-4">
                {discovery.searchEngines.length > 0 && (
                  <div>
                    <p className="text-[10px] text-white/20 uppercase font-bold mb-1">Search Engines</p>
                    {discovery.searchEngines.map(e => (
                      <div key={e.id} className="text-xs text-white/60 flex justify-between">
                        <span>{e.displayName}</span>
                        <span className="text-white/20 font-mono">{e.id}</span>
                      </div>
                    ))}
                  </div>
                )}
                {discovery.endpoints.length > 0 && (
                  <div>
                    <p className="text-[10px] text-white/20 uppercase font-bold mb-1">Vertex Endpoints</p>
                    {discovery.endpoints.map(ep => (
                      <div key={ep.id} className="text-xs text-white/60 flex justify-between">
                        <span className={ep.matchingKey ? 'text-neon-cyan' : ''}>{ep.displayName}</span>
                        <span className="text-white/20 font-mono">{ep.id}</span>
                      </div>
                    ))}
                  </div>
                )}
                {discovery.buckets.length > 0 && (
                  <div>
                    <p className="text-[10px] text-white/20 uppercase font-bold mb-1">Storage Buckets</p>
                    {discovery.buckets.map(b => (
                      <div key={b.name} className="text-xs text-white/60 flex justify-between">
                        <span className={b.matchingKey ? 'text-neon-cyan' : ''}>{b.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
