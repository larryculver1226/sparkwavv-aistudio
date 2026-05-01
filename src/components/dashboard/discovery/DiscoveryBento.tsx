import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Target,
  TrendingUp,
  Brain,
  Compass,
  Zap,
  Database,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { marketSignalService } from '../../../services/marketSignalService';
import { MarketSignal, DNAGap, ResonanceHistory } from '../../../types/dashboard';
import { ResonanceWidget } from './ResonanceWidget';
import { VelocityWidget } from './VelocityWidget';
import { GapAnalysisWidget } from './GapAnalysisWidget';
import { ResonanceHistoryWidget } from './ResonanceHistoryWidget';
import { LocalIntelligenceWidget } from './LocalIntelligenceWidget';

export const DiscoveryBento: React.FC<{ userId: string }> = ({ userId }) => {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [gaps, setGaps] = useState<DNAGap[]>([]);
  const [history, setHistory] = useState<ResonanceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [s, g, h] = await Promise.all([
        marketSignalService.fetchSignals(userId),
        marketSignalService.getDNAGaps(userId),
        marketSignalService.getResonanceHistory(userId),
      ]);
      setSignals(s);
      setGaps(g);
      setHistory(h);
      setLoading(false);
    };
    loadData();
  }, [userId]);

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold animate-pulse">
            Scanning Market Signals...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 p-8">
      {/* Primary Resonance - Large Widget */}
      <div className="md:col-span-2 lg:col-span-2 row-span-2 h-full">
        <ResonanceWidget signals={signals} />
      </div>

      {/* Market Velocity - Medium Widget */}
      <div className="md:col-span-1 lg:col-span-2">
        <VelocityWidget history={history} />
      </div>

      {/* DNA Gap Analysis - Medium Widget */}
      <div className="md:col-span-2 lg:col-span-2">
        <GapAnalysisWidget gaps={gaps} />
      </div>

      {/* Local Intelligence - New Widget */}
      <div className="md:col-span-1 lg:col-span-2">
        <LocalIntelligenceWidget />
      </div>

      {/* Resonance History - Large Widget */}
      <div className="md:col-span-3 lg:col-span-4">
        <ResonanceHistoryWidget history={history} />
      </div>
    </div>
  );
};
