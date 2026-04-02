import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, Target, Heart, DollarSign, Bird } from 'lucide-react';

export const Hero: React.FC = () => {
  const visionPanels = [
    {
      id: 1,
      title: "Wellness",
      description: "Career satisfaction is the foundation of wellbeing. Skylar identifies roles that energize your spirit, ensuring your work life fuels your personal vitality rather than draining it.",
      icon: <Heart className="w-6 h-6 text-neon-cyan" />,
      color: "from-neon-cyan/20 to-transparent"
    },
    {
      id: 2,
      title: "Wealth",
      description: "Strategic growth is the engine of security. Skylar uncovers high-value opportunities and optimizes your market worth, building the financial foundation for your future.",
      icon: <DollarSign className="w-6 h-6 text-neon-magenta" />,
      color: "from-neon-magenta/20 to-transparent"
    },
    {
      id: 3,
      title: "Freedom",
      description: "Autonomy is the ultimate career goal. We empower you to design a professional life that fits your terms, giving you the flexibility to live where and how you choose.",
      icon: <Bird className="w-6 h-6 text-neon-lime" />,
      color: "from-neon-lime/20 to-transparent"
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: "Sarah J.",
      role: "Tech Lead",
      quote: "Skylar didn't just find me a job; he found my 'Spark'. I'm now leading a team in a role that perfectly aligns with my Career DNA.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
      color: "from-neon-cyan/20 to-transparent"
    },
    {
      id: 2,
      name: "Marcus T.",
      role: "Finance Director",
      quote: "The Wavvault search is a game-changer. Seeing how others with my background pivoted into Fintech gave me the roadmap I needed.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      color: "from-neon-magenta/20 to-transparent"
    },
    {
      id: 3,
      name: "Elena R.",
      role: "Healthcare Admin",
      quote: "MedLM's insights were incredibly precise. Skylar helped me navigate a complex transition into healthcare leadership with ease.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200",
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
            SPARKWavv redefines the career journey into a path of discovery, focusing on the three pillars of a fulfilling life.
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
          The <span className="text-neon-cyan italic">R4 Protocol</span>
        </h2>
        <p className="text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
          A cinematic journey through the five stages of career transformation, guided by Skylar.
        </p>
        
        <div className="pt-12">
          <div className="max-h-[700px] overflow-y-auto pr-4 no-scrollbar scroll-smooth rounded-3xl border-2 border-neon-cyan/40 p-6 bg-white/[0.02]">
            {/* Phase 1: Dive In Phase */}
            <div className="w-full mb-8">
              <div className="w-full rounded-3xl border border-white/10 bg-black/60 overflow-hidden relative p-8 md:p-12">
                <div className="absolute top-0 left-0 w-full h-full bg-neon-cyan/5 blur-[100px] rounded-full -z-10" />
                <div className="relative z-10 space-y-8">
                  <h3 className="text-3xl md:text-4xl font-display font-black text-neon-cyan tracking-tighter uppercase italic">
                    Dive-In Phase
                  </h3>
                  <div className="glass-panel p-8 md:p-12 relative border-neon-cyan/20 bg-black/40 backdrop-blur-xl rounded-3xl w-full text-left">
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
                        that align with your strengths, values, and goals.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 2: Ignite Phase */}
            <div className="w-full mb-8">
              <div className="w-full rounded-3xl border border-white/10 bg-black/60 overflow-hidden relative p-8 md:p-12">
                <div className="absolute top-0 left-0 w-full h-full bg-neon-magenta/5 blur-[100px] rounded-full -z-10" />
                <div className="relative z-10 space-y-8">
                  <h3 className="text-3xl md:text-4xl font-display font-black text-neon-magenta tracking-tighter uppercase italic">
                    Ignition Phase
                  </h3>
                  <div className="glass-panel p-8 md:p-12 relative border-neon-magenta/20 bg-black/40 backdrop-blur-xl rounded-3xl w-full text-left">
                    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-neon-magenta flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_rgba(255,0,255,0.5)]">
                      2
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-2xl md:text-3xl font-display font-bold text-white">
                        Awaken Your Spark
                      </h4>
                      <p className="text-base md:text-lg text-white/60 leading-relaxed">
                        Your path is unwritten. Let's light the fire that powers your journey. 
                        Begin with Skylar by completing an engaging strengths assessment 
                        that identifies your unique talents and career aspirations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 3: Discover Phase */}
            <div className="w-full mb-8">
              <div className="w-full rounded-3xl border border-white/10 bg-black/60 overflow-hidden relative p-8 md:p-12">
                <div className="absolute top-0 left-0 w-full h-full bg-neon-lime/5 blur-[100px] rounded-full -z-10" />
                <div className="relative z-10 space-y-8">
                  <h3 className="text-3xl md:text-4xl font-display font-black text-neon-lime tracking-tighter uppercase italic">
                    Discovery Phase
                  </h3>
                  <div className="glass-panel p-8 md:p-12 relative border-neon-lime/20 bg-black/40 backdrop-blur-xl rounded-3xl w-full text-left">
                    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-neon-lime flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_rgba(0,255,0,0.5)]">
                      3
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-2xl md:text-3xl font-display font-bold text-white">
                        Know Yourself
                      </h4>
                      <p className="text-base md:text-lg text-white/60 leading-relaxed">
                        This is your mirror moment — uncover your strengths and build your purpose. 
                        Explore curated job opportunities that match your profile using the Wavvault.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 4: Brand Phase */}
            <div className="w-full mb-8">
              <div className="w-full rounded-3xl border border-white/10 bg-black/60 overflow-hidden relative p-8 md:p-12">
                <div className="absolute top-0 left-0 w-full h-full bg-neon-cyan/5 blur-[100px] rounded-full -z-10" />
                <div className="relative z-10 space-y-8">
                  <h3 className="text-3xl md:text-4xl font-display font-black text-neon-cyan tracking-tighter uppercase italic">
                    Branding Phase
                  </h3>
                  <div className="glass-panel p-8 md:p-12 relative border-neon-cyan/20 bg-black/40 backdrop-blur-xl rounded-3xl w-full text-left">
                    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-neon-cyan flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_rgba(0,255,255,0.5)]">
                      4
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-2xl md:text-3xl font-display font-bold text-white">
                        Craft Your Portfolio
                      </h4>
                      <p className="text-base md:text-lg text-white/60 leading-relaxed">
                        Polish your voice, image, and message into a personal brand that opens doors. 
                        Skylar crafts your professional brand with AI-generated resumes and LinkedIn profiles.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 5: Outreach Phase */}
            <div className="w-full">
              <div className="w-full rounded-3xl border border-white/10 bg-black/60 overflow-hidden relative p-8 md:p-12">
                <div className="absolute top-0 left-0 w-full h-full bg-neon-lime/5 blur-[100px] rounded-full -z-10" />
                <div className="relative z-10 space-y-8">
                  <h3 className="text-3xl md:text-4xl font-display font-black text-neon-lime tracking-tighter uppercase italic">
                    Outreach Phase
                  </h3>
                  <div className="glass-panel p-8 md:p-12 relative border-neon-lime/20 bg-black/40 backdrop-blur-xl rounded-3xl w-full text-left">
                    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-neon-lime flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_rgba(0,255,0,0.5)]">
                      5
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-2xl md:text-3xl font-display font-bold text-white">
                        Share Your Story
                      </h4>
                      <p className="text-base md:text-lg text-white/60 leading-relaxed">
                        Put your tools to use. Let the world see what only you can offer. 
                        Let Skylar handle applications and initial outreach while you focus on interviews.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-display font-bold text-white">
            Success <span className="text-neon-cyan italic">Stories</span>
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Hear from professionals who transformed their careers with Skylar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ delay: index * 0.2, duration: 0.4 }}
              className="relative group overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-8 hover:border-white/20 transition-all duration-500 cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                    <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{testimonial.name}</h4>
                    <p className="text-xs text-neon-cyan uppercase tracking-widest">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-white/70 italic leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="pt-4 flex items-center gap-2 text-xs font-display uppercase tracking-widest text-white/20 group-hover:text-neon-cyan/60 transition-colors">
                  <span>Verified User</span>
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
