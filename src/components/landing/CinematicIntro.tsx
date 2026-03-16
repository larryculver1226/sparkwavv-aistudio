import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Anchor, Compass, Sun } from 'lucide-react';

const panels = [
  {
    quote: "Until you know what harbor you seek, you don’t know what wind to seek.",
    author: "Seneca",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1920",
    icon: <Anchor className="w-12 h-12 text-neon-cyan" />,
    visual: "A lone ship navigating a vast, mist-covered sea at dawn."
  },
  {
    quote: "Make no little plans: they have no magic to stir men’s blood... Make big plans, aim high in hope and work.",
    author: "Daniel H. Burnham",
    image: "https://images.unsplash.com/photo-1503387762-592dee58c460?auto=format&fit=crop&q=80&w=1920",
    icon: <Compass className="w-12 h-12 text-neon-cyan" />,
    visual: "Rapid-fire montage of grand architectural blueprints being unrolled and sketched."
  },
  {
    quote: "Your time is limited, so don't waste it living someone else's life... have the courage to follow your heart and intuition.",
    author: "Steve Jobs",
    image: "https://images.unsplash.com/photo-1493246507139-91e8bef99c02?auto=format&fit=crop&q=80&w=1920",
    icon: <Sun className="w-12 h-12 text-neon-cyan" />,
    visual: "Close-up on a person’s face as they step out of the shadows into bright sunlight."
  }
];

export const CinematicIntro: React.FC = () => {
  return (
    <div className="relative">
      {panels.map((panel, index) => (
        <section 
          key={index} 
          className="relative h-screen flex items-center justify-center overflow-hidden sticky top-0"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-0"
          >
            <img 
              src={panel.image} 
              alt={panel.visual}
              className="w-full h-full object-cover opacity-40"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
          </motion.div>

          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 100 }}
              className="inline-block p-4 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 mb-4"
            >
              {panel.icon}
            </motion.div>
            
            <motion.h2 
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl md:text-6xl font-display font-bold leading-tight italic text-white"
            >
              "{panel.quote}"
            </motion.h2>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-neon-cyan font-display uppercase tracking-[0.4em] text-sm font-bold"
            >
              — {panel.author}
            </motion.p>
          </div>
        </section>
      ))}
    </div>
  );
};
