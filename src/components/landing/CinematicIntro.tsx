import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Anchor, Compass, Sun } from 'lucide-react';

const panels = [
  {
    quote: "TWENTY YEARS FROM NOW YOU WILL BE MORE DISAPPOINTED BY THE THINGS THAT YOU DIDN'T DO THAN BY THE ONES YOU DID DO.\n\nSO THROW OFF THE BOWLINES. SAIL AWAY FROM THE SAFE HARBOR. CATCH THE TRADE WINDS IN YOUR SAILS.\n\nEXPLORE. DREAM. DISCOVER.",
    author: "Mark Twain",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1920&sat=100&con=30&bri=5&exp=10",
    icon: <Anchor className="w-10 h-10 text-neon-cyan" />,
    visual: "A vibrant red beach sunset with gentle waves crashing on the shore and sun rays on the horizon."
  },
  {
    quote: "Make no little plans: they have no magic to stir men’s blood... Make big plans, aim high in hope and work.",
    author: "Daniel H. Burnham",
    image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&q=80&w=1920",
    icon: <Compass className="w-10 h-10 text-neon-cyan" />,
    visual: "Architectural blueprints being unrolled and sketched."
  },
  {
    quote: "Your time is limited, so don't waste it living someone else's life... have the courage to follow your heart and intuition.",
    author: "Steve Jobs",
    image: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&q=80&w=1920&sat=40&con=20&bri=10&exp=15",
    icon: <Sun className="w-10 h-10 text-neon-cyan" />,
    visual: "A person stepping out of shadows into bright sunlight."
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
            className="absolute inset-0 z-0 bg-black"
          >
            <img 
              src={panel.image} 
              alt={panel.visual}
              className="w-full h-full object-cover opacity-70"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(255,80,0,0.3)_0%,transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(255,200,100,0.1)_0%,transparent_40%)]" />
          </motion.div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 100 }}
              className="inline-block p-3 rounded-full bg-neon-cyan/10 border border-neon-cyan/20"
            >
              {panel.icon}
            </motion.div>
            
            <motion.h2 
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-lg md:text-2xl lg:text-3xl xl:text-4xl font-display font-bold leading-tight italic text-white whitespace-pre-line"
            >
              "{panel.quote}"
            </motion.h2>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-neon-cyan font-display uppercase tracking-[0.4em] text-xs md:text-sm font-bold"
            >
              — {panel.author}
            </motion.p>
          </div>
        </section>
      ))}
    </div>
  );
};
