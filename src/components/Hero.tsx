import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, Target, Heart, DollarSign, Bird } from 'lucide-react';

export const Hero: React.FC = () => {
  const visionPanels = [
    {
      id: 1,
      title: "Wellness",
      description: "We believe career satisfaction is essential to overall wellbeing. Skylar helps you find work that energizes rather than depletes you, creating harmony between your professional and personal life.",
      icon: <Heart className="w-6 h-6 text-neon-cyan" />,
      color: "from-neon-cyan/20 to-transparent"
    },
    {
      id: 2,
      title: "Wealth",
      description: "Building financial security and growth through strategic career choices. Financial security enables freedom. Skylar identifies high-value opportunities aligned with your skills and negotiates compensation packages that reflect your true worth in the market.",
      icon: <DollarSign className="w-6 h-6 text-neon-cyan" />,
      color: "from-neon-cyan/20 to-transparent"
    },
    {
      id: 3,
      title: "Freedom",
      description: "Achieving the flexibility to live and work on your own terms. Achieving the flexibility to live and work on your own terms.",
      icon: <Bird className="w-6 h-6 text-neon-cyan" />,
      color: "from-neon-cyan/20 to-transparent"
    }
  ];

  const panels = [
    {
      id: 1,
      title: "Placeholder Panel 1",
      description: "This is a placeholder for the first hero panel. We will add specific content here in the next step.",
      icon: <Sparkles className="w-6 h-6 text-neon-cyan" />,
      color: "from-neon-cyan/20 to-transparent"
    },
    {
      id: 2,
      title: "Placeholder Panel 2",
      description: "This is a placeholder for the second hero panel. We will add specific content here in the next step.",
      icon: <Zap className="w-6 h-6 text-neon-magenta" />,
      color: "from-neon-magenta/20 to-transparent"
    },
    {
      id: 3,
      title: "Placeholder Panel 3",
      description: "This is a placeholder for the third hero panel. We will add specific content here in the next step.",
      icon: <Target className="w-6 h-6 text-neon-lime" />,
      color: "from-neon-lime/20 to-transparent"
    }
  ];

  return (
    <div className="w-full py-12 space-y-32">
      {/* Vision Section */}
      <div className="text-center space-y-12">
        <div className="space-y-6">
          <h2 className="text-5xl md:text-6xl font-display font-bold text-white tracking-tight">
            Our <span className="text-neon-cyan italic">Vision</span>
          </h2>
          <p className="text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
            SPARKWavv redefines job search into a Career Happiness Journey, focusing on what truly matters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {visionPanels.map((panel, index) => (
            <motion.div
              key={panel.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, y: -5 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.4 }}
              className="glass-panel p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl relative group hover:border-neon-cyan/50 transition-all duration-500 cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${panel.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`} />
              <div className="relative z-10 space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500 mx-auto">
                  {panel.icon}
                </div>
                <h3 className="text-2xl font-display font-bold text-white group-hover:text-neon-cyan transition-colors">
                  {panel.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {panel.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Experience Section */}
      <div className="text-center space-y-6">
        <h2 className="text-5xl md:text-6xl font-display font-bold text-white tracking-tight">
          The <span className="text-neon-cyan italic">SPARKWavv-Skylar</span> Experience
        </h2>
        <p className="text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
          A visual walkthrough of your journey to career happiness with SPARKWavv's AI-powered platform and secure Wavvault data storage.
        </p>
        
        <div className="pt-12">
          <div className="max-h-[700px] overflow-y-auto pr-4 no-scrollbar scroll-smooth rounded-3xl border-2 border-neon-cyan/40 p-6 bg-white/[0.02]">
            {/* Phase 1: Dive In Phase */}
            <div className="w-full">
              <div className="w-full rounded-3xl border border-white/10 bg-black/60 overflow-hidden relative p-8 md:p-12">
                <div className="absolute top-0 left-0 w-full h-full bg-neon-cyan/5 blur-[100px] rounded-full -z-10" />
                <div className="relative z-10 space-y-8">
                  <h3 className="text-3xl md:text-4xl font-display font-black text-neon-cyan tracking-tighter uppercase italic">
                    Dive-In Phase
                  </h3>
                  <div className="glass-panel p-8 md:p-12 relative border-neon-cyan/20 bg-black/40 backdrop-blur-xl rounded-3xl w-full">
                    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-neon-cyan flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_rgba(0,255,255,0.5)]">
                      1
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-2xl md:text-3xl font-display font-bold text-white">
                        Ride Your Wave
                      </h4>
                      <p className="text-base md:text-lg text-white/60 leading-relaxed">
                        Find your rhythm, build courage, and embrace the ride of career discovery. 
                        Skylar analyzes your profile and presents personalized career paths 
                        that align with your strengths, values, and goals, with interactive 
                        exploration of each option.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 2: Ignite Phase */}
            <div className="w-full">
              <div className="w-full rounded-3xl border border-white/10 bg-black/60 overflow-hidden relative p-8 md:p-12">
                <div className="absolute top-0 left-0 w-full h-full bg-neon-cyan/5 blur-[100px] rounded-full -z-10" />
                <div className="relative z-10 space-y-8">
                  <h3 className="text-3xl md:text-4xl font-display font-black text-neon-cyan tracking-tighter uppercase italic">
                    Ignition Phase
                  </h3>
                  <div className="glass-panel p-8 md:p-12 relative border-neon-cyan/20 bg-black/40 backdrop-blur-xl rounded-3xl w-full">
                    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-neon-cyan flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_rgba(0,255,255,0.5)]">
                      2
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-2xl md:text-3xl font-display font-bold text-white">
                        Awaken Your Spark
                      </h4>
                      <p className="text-base md:text-lg text-white/60 leading-relaxed">
                        Your path is unwritten. Let's light the fire that powers your journey. 
                        Begin with Skylar by completing an engaging strengths assessment 
                        that identifies your unique talents, skills, and career aspirations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 3: Discover Phase */}
            <div className="w-full">
              <div className="w-full rounded-3xl border border-white/10 bg-black/60 overflow-hidden relative p-8 md:p-12">
                <div className="absolute top-0 left-0 w-full h-full bg-neon-cyan/5 blur-[100px] rounded-full -z-10" />
                <div className="relative z-10 space-y-8">
                  <h3 className="text-3xl md:text-4xl font-display font-black text-neon-cyan tracking-tighter uppercase italic">
                    Discovery Phase
                  </h3>
                  <div className="glass-panel p-8 md:p-12 relative border-neon-cyan/20 bg-black/40 backdrop-blur-xl rounded-3xl w-full">
                    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-neon-cyan flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_rgba(0,255,255,0.5)]">
                      3
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-2xl md:text-3xl font-display font-bold text-white">
                        Know Yourself
                      </h4>
                      <p className="text-base md:text-lg text-white/60 leading-relaxed">
                        This is your mirror moment — uncover your strengths and build your purpose. 
                        Explore curated job opportunities that match your profile. 
                        Skylar continuously learns from your preferences to refine 
                        recommendations and identify your ideal roles.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 4: Brand Phase */}
            <div className="w-full">
              <div className="w-full rounded-3xl border border-white/10 bg-black/60 overflow-hidden relative p-8 md:p-12">
                <div className="absolute top-0 left-0 w-full h-full bg-neon-cyan/5 blur-[100px] rounded-full -z-10" />
                <div className="relative z-10 space-y-8">
                  <h3 className="text-3xl md:text-4xl font-display font-black text-neon-cyan tracking-tighter uppercase italic">
                    Branding Phase
                  </h3>
                  <div className="glass-panel p-8 md:p-12 relative border-neon-cyan/20 bg-black/40 backdrop-blur-xl rounded-3xl w-full">
                    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-neon-cyan flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_rgba(0,255,255,0.5)]">
                      4
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-2xl md:text-3xl font-display font-bold text-white">
                        Craft Your Portfolio
                      </h4>
                      <p className="text-base md:text-lg text-white/60 leading-relaxed">
                        Polish your voice, image, and message into a personal brand that opens doors. 
                        Skylar crafts your professional brand with AI-generated resumes, 
                        cover letters, and LinkedIn profiles optimized for each opportunity, 
                        ensuring you stand out to employers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 5: Outreach Phase */}
            <div className="w-full">
              <div className="w-full rounded-3xl border border-white/10 bg-black/60 overflow-hidden relative p-8 md:p-12">
                <div className="absolute top-0 left-0 w-full h-full bg-neon-cyan/5 blur-[100px] rounded-full -z-10" />
                <div className="relative z-10 space-y-8">
                  <h3 className="text-3xl md:text-4xl font-display font-black text-neon-cyan tracking-tighter uppercase italic">
                    Outreach Phase
                  </h3>
                  <div className="glass-panel p-8 md:p-12 relative border-neon-cyan/20 bg-black/40 backdrop-blur-xl rounded-3xl w-full">
                    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-neon-cyan flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_rgba(0,255,255,0.5)]">
                      5
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-2xl md:text-3xl font-display font-bold text-white">
                        Share Your Story
                      </h4>
                      <p className="text-base md:text-lg text-white/60 leading-relaxed">
                        Put your tools to use. Let the world see what only you can offer. 
                        Let Skylar handle applications and initial outreach, connecting you 
                        directly with recruiters and hiring managers while you focus on 
                        preparing for interviews.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Beta Tester Feedback Section */}
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-display font-bold text-white">
            Beta Tester <span className="text-neon-cyan italic">Feedback</span>
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Hear what our early users are saying about their experience with Skylar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {panels.map((panel, index) => (
            <motion.div
              key={panel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ delay: index * 0.2, duration: 0.4 }}
              className="relative group overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-8 hover:border-white/20 transition-all duration-500 cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${panel.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500">
                  {panel.icon}
                </div>
                <h3 className="text-2xl font-display font-bold text-white group-hover:text-neon-cyan transition-colors">
                  {panel.title}
                </h3>
                <p className="text-white/40 leading-relaxed">
                  {panel.description}
                </p>
                <div className="pt-4 flex items-center gap-2 text-xs font-display uppercase tracking-widest text-white/20 group-hover:text-neon-cyan/60 transition-colors">
                  <span>Panel 0{panel.id}</span>
                  <div className="h-px flex-grow bg-white/5 group-hover:bg-neon-cyan/20 transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
