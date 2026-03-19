import React from 'react';
import { motion } from 'motion/react';
import { Search, Palette, Send, ArrowRight, Zap } from 'lucide-react';

const steps = [
  {
    id: 'ignition',
    title: 'Ignition: Onboarding',
    description: 'Begin your journey with a streamlined onboarding process and secure your spot via our premium paywall.',
    icon: <Zap className="w-8 h-8" />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20'
  },
  {
    id: 'discovery',
    title: 'Discovery: Launchpad',
    description: 'Intensive internal assessments to identify core strengths and attributes.',
    icon: <Search className="w-8 h-8" />,
    color: 'text-neon-cyan',
    bgColor: 'bg-neon-cyan/10',
    borderColor: 'border-neon-cyan/20'
  },
  {
    id: 'branding',
    title: 'Branding: Portfolio',
    description: 'Consolidation of insights into a definitive professional brand and assets.',
    icon: <Palette className="w-8 h-8" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20'
  },
  {
    id: 'outreach',
    title: 'Outreach: Dashboard',
    description: 'Active execution and market engagement via the strategic dashboard.',
    icon: <Send className="w-8 h-8" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20'
  }
];

export const Roadmap: React.FC = () => {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-4xl md:text-5xl font-display font-bold">The Four-Step Framework</h2>
        <p className="text-white/60 max-w-2xl mx-auto uppercase tracking-[0.2em] text-sm">
          A linear progression from internal assessment to external market engagement.
        </p>
      </div>

      <div className="relative grid md:grid-cols-4 gap-8">
        {/* Connection Line */}
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0" />

        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.2 }}
            className={`relative z-10 glass-panel p-8 ${step.borderColor} flex flex-col items-center text-center space-y-6 group hover:scale-105 transition-transform duration-500`}
          >
            <div className={`p-6 rounded-2xl ${step.bgColor} ${step.color} group-hover:rotate-6 transition-transform`}>
              {step.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{step.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className="md:hidden flex justify-center py-4">
                <ArrowRight className="w-6 h-6 text-white/20 rotate-90" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
};
