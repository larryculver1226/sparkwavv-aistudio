import React from 'react';
import { motion } from 'motion/react';
import { Search, Palette, Send, ArrowRight, Zap, Star, ChevronRight } from 'lucide-react';

const steps = [
  {
    id: 'ignition',
    number: '01',
    title: 'Ignition: Onboarding',
    description:
      'Begin your journey with a streamlined onboarding process and secure your spot via our premium paywall.',
    proTip: 'Secure your spot in the next cohort to begin your transformation.',
    coreActivity: 'Account Setup & Goal Alignment',
    icon: <Zap className="w-8 h-8" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    accent: 'from-amber-500/20 to-transparent',
  },
  {
    id: 'discovery',
    number: '02',
    title: 'Discovery: Launchpad',
    description: 'Intensive internal assessments to identify core strengths and extinguishers.',
    proTip:
      "The '13-20' Rule: Your most instructive insights surface after the first 12 accomplishments.",
    coreActivity: '20 Accomplishments Exercise',
    icon: <Search className="w-8 h-8" />,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    accent: 'from-orange-500/20 to-transparent',
  },
  {
    id: 'branding',
    number: '03',
    title: 'Branding: Portfolio',
    description: 'Consolidation of insights into a definitive professional brand and assets.',
    proTip: 'Personal Spark Screen: A visual synthesis of your professional DNA and attributes.',
    coreActivity: 'Branding Portfolio Creation',
    icon: <Palette className="w-8 h-8" />,
    color: 'text-orange-400',
    bgColor: 'bg-gradient-to-br from-orange-500/10 to-emerald-500/10',
    borderColor: 'border-orange-500/20',
    accent: 'from-orange-500/20 via-emerald-500/10 to-transparent',
  },
  {
    id: 'outreach',
    number: '04',
    title: 'Outreach: Dashboard',
    description: 'Active execution and market engagement via the strategic dashboard.',
    proTip: 'The Networking Funnel: Target Activators, Mavens, and Halos for maximum impact.',
    coreActivity: 'Network Mapping & Outreach',
    icon: <Send className="w-8 h-8" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    accent: 'from-emerald-500/20 to-transparent',
  },
];

export const Roadmap: React.FC = () => {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="text-center mb-20 space-y-4 relative z-10">
        <h2 className="text-5xl md:text-6xl font-display font-bold tracking-tight">
          Launching Your <span className="text-orange-500">Spark</span>
        </h2>
        <p className="text-white/40 max-w-2xl mx-auto uppercase tracking-[0.3em] text-xs font-bold">
          The Kickspark Career Transformation Method
        </p>
      </div>

      <div className="relative grid md:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.15, duration: 0.6 }}
            viewport={{ once: true }}
            className={`relative z-10 flex flex-col h-full group`}
          >
            {/* Step Number Badge */}
            <div className="absolute -top-4 left-6 z-20 px-3 py-1 rounded-full bg-black border border-white/10 text-[10px] font-bold tracking-widest text-white/40 group-hover:border-white/20 transition-colors">
              STEP {step.number}
            </div>

            <div
              className={`flex-grow glass-panel p-8 rounded-3xl border ${step.borderColor} bg-white/[0.02] flex flex-col space-y-6 transition-all duration-500 group-hover:bg-white/[0.04] group-hover:-translate-y-2`}
            >
              {/* Icon Container */}
              <div
                className={`w-16 h-16 rounded-2xl ${step.bgColor} ${step.color} flex items-center justify-center relative overflow-hidden shadow-2xl group-hover:scale-110 transition-transform duration-500`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${step.accent} opacity-50`} />
                <div className="relative z-10">{step.icon}</div>
              </div>

              {/* Content */}
              <div className="space-y-3 flex-grow">
                <h3 className="text-2xl font-display font-bold group-hover:text-white transition-colors">
                  {step.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">{step.description}</p>
              </div>

              {/* Pro-Tip Block */}
              <div className="pt-6 border-t border-white/5 space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors">
                  <Star
                    className={`w-4 h-4 mt-0.5 shrink-0 ${step.color} fill-current opacity-50`}
                  />
                  <p className="text-[11px] text-white/40 leading-snug italic">
                    <span className="font-bold text-white/60 not-italic uppercase tracking-tighter mr-1">
                      Pro-Tip:
                    </span>
                    {step.proTip}
                  </p>
                </div>

                {/* Core Activity Label */}
                <div className="flex items-center gap-2 px-1">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${step.color.replace('text-', 'bg-')} animate-pulse`}
                  />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">
                    Core Activity: <span className="text-white/60">{step.coreActivity}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Connector Arrow */}
            {index < steps.length - 1 && (
              <div className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
                <ChevronRight className="w-6 h-6 text-white/10 group-hover:text-white/30 transition-colors" />
              </div>
            )}

            {/* Mobile Connector Arrow */}
            {index < steps.length - 1 && (
              <div className="md:hidden flex justify-center py-6">
                <ArrowRight className="w-6 h-6 text-white/10 rotate-90" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom Summary Label */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-16 text-center"
      >
        <p className="text-[11px] text-white/40 uppercase tracking-[0.5em] font-bold">
          A Linear Progression from Internal Assessment to External Market Engagement
        </p>
      </motion.div>
    </section>
  );
};
