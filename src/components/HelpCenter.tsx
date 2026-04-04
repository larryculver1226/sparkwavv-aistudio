import React from 'react';
import { motion } from 'motion/react';
import {
  LifeBuoy,
  Search,
  User,
  CreditCard,
  Shield,
  Zap,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronRight,
  FileText,
} from 'lucide-react';

export const HelpCenter: React.FC = () => {
  const categories = [
    {
      title: 'Account & Billing',
      description: 'Manage your subscription, update payment methods, and account settings.',
      icon: <CreditCard className="w-6 h-6 text-neon-cyan" />,
      articles: [
        'Updating your payment info',
        'How to cancel your subscription',
        'Managing your profile',
      ],
    },
    {
      title: 'Technical Support',
      description: 'Troubleshoot issues with the platform, Skylar AI, and the Wavvault.',
      icon: <Zap className="w-6 h-6 text-neon-magenta" />,
      articles: ['Audio troubleshooting', 'Browser compatibility', 'Wavvault upload errors'],
    },
    {
      title: 'Career Journey',
      description: 'Guidance on navigating the 5 phases and working with Skylar.',
      icon: <Zap className="w-6 h-6 text-neon-lime" />,
      articles: ['Understanding the Dive-In phase', 'How to use the MIG', 'Preparing for Outreach'],
    },
    {
      title: 'Privacy & Security',
      description: 'Learn how we protect your data and manage your privacy settings.',
      icon: <Shield className="w-6 h-6 text-neon-cyan" />,
      articles: ['Wavvault encryption', 'Data anonymization', 'GDPR compliance'],
    },
  ];

  const popularArticles = [
    'How do I reset my password?',
    'Connecting your LinkedIn profile',
    'Understanding your Brand DNA synthesis',
    'How to share your cinematic report',
    'What are Validation Gates?',
    'Switching coaching methodologies',
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-24 space-y-24">
      {/* Hero Section */}
      <header className="text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-sm font-medium"
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Help Center</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl font-display font-bold text-white tracking-tight"
        >
          How can we <span className="text-neon-cyan italic">Help?</span>
        </motion.h1>

        {/* Mock Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto relative group"
        >
          <div className="absolute inset-0 bg-neon-cyan/5 blur-2xl rounded-full -z-10 group-focus-within:bg-neon-cyan/10 transition-all" />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-neon-cyan transition-colors" />
          <input
            type="text"
            placeholder="Search for articles, guides, or troubleshooting..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-6 text-white focus:outline-none focus:border-neon-cyan/50 transition-all placeholder:text-white/20"
          />
        </motion.div>
      </header>

      {/* Categories Grid */}
      <section className="grid md:grid-cols-2 gap-8">
        {categories.map((category, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="glass-panel p-8 space-y-6 hover:border-neon-cyan/40 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                {category.icon}
              </div>
              <h2 className="text-2xl font-display font-bold text-white group-hover:text-neon-cyan transition-colors">
                {category.title}
              </h2>
            </div>
            <p className="text-white/60 leading-relaxed">{category.description}</p>
            <ul className="space-y-3 pt-4 border-t border-white/5">
              {category.articles.map((article, i) => (
                <li key={i}>
                  <button className="flex items-center justify-between w-full text-sm text-white/40 hover:text-white transition-colors group/item">
                    <span>{article}</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover/item:opacity-100 transition-all translate-x-[-10px] group-hover/item:translate-x-0" />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </section>

      {/* Popular Articles */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-display font-bold text-white">Popular Articles</h2>
          <p className="text-white/40">The most frequently accessed resources by our users.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularArticles.map((article, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-neon-cyan/40 hover:bg-white/10 transition-all text-left group"
            >
              <FileText className="w-5 h-5 text-white/20 group-hover:text-neon-cyan transition-colors shrink-0" />
              <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">
                {article}
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="glass-panel p-12 text-center space-y-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-magenta/5 via-transparent to-neon-lime/5" />
        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl font-display font-bold text-white">Still stuck?</h2>
          <p className="text-white/60 max-w-xl mx-auto">
            Our support team is ready to help you get back on your wave.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative z-10">
          <div className="p-8 rounded-3xl bg-black/40 border border-white/10 space-y-4 hover:border-neon-cyan/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-neon-cyan/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-neon-cyan" />
            </div>
            <h3 className="text-xl font-bold text-white">Live Chat</h3>
            <p className="text-sm text-white/40">Average response time: 5 mins</p>
            <button className="text-neon-cyan text-sm font-bold uppercase tracking-widest hover:text-white transition-colors">
              Start Chat
            </button>
          </div>

          <div className="p-8 rounded-3xl bg-black/40 border border-white/10 space-y-4 hover:border-neon-magenta/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-neon-magenta/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6 text-neon-magenta" />
            </div>
            <h3 className="text-xl font-bold text-white">Email Support</h3>
            <p className="text-sm text-white/40">Average response time: 2 hours</p>
            <button className="text-neon-magenta text-sm font-bold uppercase tracking-widest hover:text-white transition-colors">
              Send Email
            </button>
          </div>

          <div className="p-8 rounded-3xl bg-black/40 border border-white/10 space-y-4 hover:border-neon-lime/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-neon-lime/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-neon-lime" />
            </div>
            <h3 className="text-xl font-bold text-white">Community</h3>
            <p className="text-sm text-white/40">Get help from other professionals</p>
            <button className="text-neon-lime text-sm font-bold uppercase tracking-widest hover:text-white transition-colors">
              Visit Forum
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
