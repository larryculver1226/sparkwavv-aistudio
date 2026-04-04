import React from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  HelpCircle,
  FileText,
  ChevronRight,
  Search,
  Zap,
  ShieldCheck,
  Target,
  Users,
  MessageSquare,
} from 'lucide-react';

export const Documentation: React.FC = () => {
  const faqs = [
    {
      question: 'What is SPARKWavv?',
      answer:
        'SPARKWavv is an AI-powered career engine designed to transform your professional history into market dominance through a structured, 12-week journey. It combines advanced AI synthesis with proven strategic coaching methodologies.',
    },
    {
      question: 'Who is Skylar?',
      answer:
        "Skylar is your AI Career Partner, a sophisticated AI coach trained in strategic methodologies (like Lobkowicz and Feynman) to guide you through your career evolution. Skylar helps you extract your 'Career DNA' and validates your progress at every step.",
    },
    {
      question: 'What is the Wavvault?',
      answer:
        "The Wavvault is a secure, encrypted data vault where your professional history, accomplishments, and career DNA are stored and synthesized. It serves as the 'source of truth' for your professional identity.",
    },
    {
      question: 'How long does the program take?',
      answer:
        'The core SPARKWavv journey is designed as a 12-week intensive process, divided into five key phases: Dive-In, Ignition, Discovery, Branding, and Outreach. Each phase builds upon the last to ensure a comprehensive career transformation.',
    },
    {
      question: 'Is my data secure?',
      answer:
        'Yes. We use industry-standard encryption and the Wavvault architecture to ensure your personal and professional data remains private and under your control. Your data is anonymized when used for collective insights.',
    },
  ];

  const docOutline = [
    {
      title: 'Getting Started Guide',
      description:
        "Account setup, initial 'Dive-In' phase, and connecting with Skylar for the first time.",
      icon: <Zap className="w-5 h-5 text-neon-cyan" />,
    },
    {
      title: 'The 5-Phase Methodology',
      description:
        "Detailed breakdown of Dive-In, Ignition, Discovery, Branding, and Outreach phases and their 'Validation Gates'.",
      icon: <Target className="w-5 h-5 text-neon-magenta" />,
    },
    {
      title: 'Working with Skylar',
      description:
        'How to provide high-impact stories for DNA synthesis and switching between coaching methodologies.',
      icon: <MessageSquare className="w-5 h-5 text-neon-lime" />,
    },
    {
      title: 'The Wavvault & Data Privacy',
      description:
        'Understanding how your data is stored, used, and how to export your career DNA.',
      icon: <ShieldCheck className="w-5 h-5 text-neon-cyan" />,
    },
    {
      title: 'Market Intelligence Grid (MIG)',
      description:
        'How to interpret real-time market data and align your brand with current market demand.',
      icon: <Search className="w-5 h-5 text-neon-magenta" />,
    },
    {
      title: 'Partner Program Guide',
      description: 'For coaches and mentors using the SPARKWavv platform with their clients.',
      icon: <Users className="w-5 h-5 text-neon-lime" />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-24 space-y-24">
      {/* Header */}
      <header className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-sm font-medium"
        >
          <BookOpen className="w-4 h-4" />
          <span>Documentation Center</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl font-display font-bold text-white tracking-tight"
        >
          Master the <span className="text-neon-cyan italic">Engine</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
        >
          Everything you need to know about navigating your career journey with SPARKWavv and
          Skylar.
        </motion.p>
      </header>

      {/* FAQ Section */}
      <section className="space-y-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-neon-cyan" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-white/40">Quick answers to common questions about the platform.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-panel p-8 space-y-4 hover:border-neon-cyan/40 transition-all group"
            >
              <h3 className="text-lg font-bold text-white group-hover:text-neon-cyan transition-colors">
                {faq.question}
              </h3>
              <p className="text-white/60 leading-relaxed text-sm">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Documentation Roadmap Section */}
      <section className="space-y-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neon-magenta/10 border border-neon-magenta/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-neon-magenta" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-white">Documentation Roadmap</h2>
            <p className="text-white/40">Proposed guides and resources currently in development.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {docOutline.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-neon-cyan/40 transition-all hover:translate-y-[-4px] group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h4 className="text-lg font-bold text-white group-hover:text-neon-cyan transition-colors mb-2">
                {item.title}
              </h4>
              <p className="text-sm text-white/60 leading-relaxed mb-6 flex-grow">
                {item.description}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/20 group-hover:text-neon-cyan/60 transition-colors">
                <span>Coming Soon</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="glass-panel p-12 text-center space-y-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-magenta/5" />
        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl font-display font-bold text-white">Still have questions?</h2>
          <p className="text-white/60 max-w-xl mx-auto">
            Our support team and Skylar are always here to help you navigate your journey.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <button className="px-8 py-3 bg-neon-cyan text-black font-bold rounded-xl hover:bg-neon-cyan/80 transition-all shadow-[0_0_20px_rgba(0,243,255,0.3)]">
              Contact Support
            </button>
            <button className="px-8 py-3 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all">
              Join Community
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
