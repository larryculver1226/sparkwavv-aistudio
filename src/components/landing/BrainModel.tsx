import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Brain,
  TrendingUp,
  Shield,
  Zap,
  DollarSign,
  Heart,
  Lightbulb,
  Users,
  BookOpen,
} from 'lucide-react';

export const BrainModel: React.FC = () => {
  const [salary, setSalary] = useState(100000);

  const calculateROI = (val: number) => {
    return {
      searchSpeed: val * 0.08,
      salaryIncrease: val * 0.18,
      compensation: val * 0.07,
      riskMitigation: val * 0.25,
      taxDeductibility: val * 0.02,
    };
  };

  const roi = calculateROI(salary);
  const totalGain = Object.values(roi).reduce((a, b) => a + b, 0);

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-4xl md:text-5xl font-display font-bold">
          The Dual-Core Value Proposition
        </h2>
        <p className="text-white/60 max-w-2xl mx-auto">
          The Sparkwavv experience is engineered to address the distinct needs of both hemispheres
          of the professional mind.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-stretch">
        {/* Left Brain - The Kick */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          className="glass-panel p-8 border-neon-cyan/20 flex flex-col h-full"
        >
          <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-8">
            <div className="p-3 rounded-xl bg-neon-cyan/10">
              <Brain className="w-8 h-8 text-neon-cyan" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Left Brain: The Kick</h3>
              <p className="text-neon-cyan text-sm uppercase tracking-widest">
                Quantitative Benefits
              </p>
            </div>
          </div>

          <div className="flex-grow space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-sm font-medium text-white/60 uppercase tracking-wider">
                  Current Annual Salary
                </label>
                <span className="text-2xl font-bold text-neon-cyan">
                  ${salary.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="50000"
                max="500000"
                step="5000"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
              />
            </div>

            <div className="grid gap-4">
              <ROICard
                icon={<Zap className="w-4 h-4" />}
                label="Increased Search Speed"
                value={roi.searchSpeed}
                description="Cost savings through efficiency"
              />
              <ROICard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Promotion / Salary Increase"
                value={roi.salaryIncrease}
                description="Direct gain from brand elevation"
              />
              <ROICard
                icon={<DollarSign className="w-4 h-4" />}
                label="Enhanced Compensation"
                value={roi.compensation}
                description="Benefit and equity optimization"
              />
              <ROICard
                icon={<Shield className="w-4 h-4" />}
                label="Risk Mitigation"
                value={roi.riskMitigation}
                description="Avoiding the wrong career move"
              />
            </div>
          </div>

          <div className="pt-6 mt-8 border-t border-white/10 flex justify-between items-center">
            <span className="text-lg font-bold uppercase tracking-widest text-white/40">
              Total Potential Gain
            </span>
            <span className="text-3xl font-bold text-neon-cyan neon-text-cyan">
              ${totalGain.toLocaleString()}
            </span>
          </div>
        </motion.div>

        {/* Right Brain - The Spark */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          className="glass-panel p-8 border-purple-500/20 flex flex-col h-full"
        >
          <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-8">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <Lightbulb className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Right Brain: The Spark</h3>
              <p className="text-purple-400 text-sm uppercase tracking-widest">
                Qualitative Benefits
              </p>
            </div>
          </div>

          <div className="flex-grow grid gap-6">
            <QualitativeCard
              icon={<Heart className="w-6 h-6" />}
              label="Inspiration"
              text="Reconnecting with authentic interests to envision new, untapped career possibilities."
            />
            <QualitativeCard
              icon={<Zap className="w-6 h-6" />}
              label="Stress Reduction"
              text="Minimizing the emotional tax of transition on the individual and their support network."
            />
            <QualitativeCard
              icon={<BookOpen className="w-6 h-6" />}
              label="New Learning"
              text="Cultivating cognitive agility and fresh insights throughout the discovery process."
            />
            <QualitativeCard
              icon={<Users className="w-6 h-6" />}
              label="Peer Sounding Boards"
              text="Leveraging a community of like-minded professionals for feedback and validation."
            />
          </div>

          <div className="pt-8 mt-8 border-t border-white/5 text-center">
            <p className="text-white/40 italic text-sm">
              "Productivity is a shadow of energy. You must learn the art of the reboot." — Skylar
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const ROICard = ({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-neon-cyan/30 transition-all group">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-[10px] text-white/40 uppercase tracking-wider">{description}</p>
      </div>
    </div>
    <span className="text-lg font-mono font-bold text-neon-cyan">
      +${Math.round(value).toLocaleString()}
    </span>
  </div>
);

const QualitativeCard = ({
  icon,
  label,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
}) => (
  <div className="flex gap-4 group">
    <div className="mt-1 p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:rotate-12 transition-transform h-fit">
      {icon}
    </div>
    <div className="space-y-1">
      <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors">
        {label}
      </h4>
      <p className="text-sm text-white/60 leading-relaxed">{text}</p>
    </div>
  </div>
);
