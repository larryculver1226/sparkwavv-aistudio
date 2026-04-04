import React from 'react';
import { motion } from 'motion/react';
import { DashboardData } from '../../types/dashboard';

export const MiniGauge: React.FC<{ value: number; label: string; color: string }> = ({
  value,
  label,
  color,
}) => {
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const circumference = 2 * Math.PI * 32;
  const offset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="32"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-white/5"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="32"
            stroke={color}
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
          {value}%
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-bold text-center leading-tight max-w-[90px]">
        {label}
      </span>
    </div>
  );
};

export const GaugeChart: React.FC<{ value: number; matrix?: DashboardData['alignmentMatrix'] }> = ({
  value,
  matrix,
}) => {
  const stroke = 14;
  const normalizedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 xl:gap-12 w-full">
        {/* Main Gauge */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="relative">
            <svg width="220" height="130" viewBox="0 0 240 140">
              {/* Background Arc */}
              <path
                d="M 30 120 A 90 90 0 0 1 210 120"
                fill="none"
                stroke="#ffffff08"
                strokeWidth={stroke}
                strokeLinecap="round"
              />
              {/* Value Arc */}
              <path
                d="M 30 120 A 90 90 0 0 1 210 120"
                fill="none"
                stroke="url(#cyanNeonGradient)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${(normalizedValue / 100) * 283} 283`}
                className="drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]"
              />
              <defs>
                <linearGradient id="cyanNeonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0088ff" />
                  <stop offset="50%" stopColor="#00f3ff" />
                  <stop offset="100%" stopColor="#00ffff" />
                </linearGradient>
              </defs>
            </svg>

            {/* Centered Value */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
              <div className="text-5xl font-display font-bold text-neon-cyan neon-text-cyan">
                {value}
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-neon-cyan/80 font-bold neon-text-cyan whitespace-nowrap">
                Happiness Meter
              </p>
            </div>
          </div>
        </div>

        {/* Alignment Matrix */}
        <div className="flex gap-4 sm:gap-8 lg:border-l lg:border-white/10 lg:pl-6 xl:pl-12">
          <MiniGauge
            value={matrix?.identityClarity || 0}
            label="Identity Clarity"
            color="#00f3ff"
          />
          <MiniGauge
            value={matrix?.strengthsAlignment || 0}
            label="Strengths Alignment"
            color="#ff00ff"
          />
          <MiniGauge
            value={matrix?.marketResonance || 0}
            label="Market Resonance"
            color="#39ff14"
          />
        </div>
      </div>
    </div>
  );
};
