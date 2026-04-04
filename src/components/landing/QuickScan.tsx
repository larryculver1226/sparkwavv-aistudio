import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileUp,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  X,
  Zap,
  Target,
  Sparkles,
  Fingerprint,
} from 'lucide-react';
import { Button } from '../Button';
import { parseResume } from '../../services/geminiService';

interface DNAPreview {
  name?: string;
  role?: string;
  industry?: string;
  attributes?: string[];
  skills?: string[];
}

export const QuickScan: React.FC<{ onDiveIn: () => void }> = ({ onDiveIn }) => {
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<DNAPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setErrorMessage(null);
    try {
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer });
        const textContent = result.value;

        if (textContent) {
          const parseResult = await parseResume(textContent, 'text/plain');
          if (parseResult) {
            setPreview(parseResult);
          } else {
            setErrorMessage("I couldn't analyze your Career DNA. Please try a different file.");
          }
        } else {
          setErrorMessage('The DOCX file appears to be empty.');
        }
      } else if (file.type === 'text/plain') {
        const textContent = await file.text();
        const parseResult = await parseResume(textContent, 'text/plain');
        if (parseResult) {
          setPreview(parseResult);
        } else {
          setErrorMessage("I couldn't analyze your Career DNA.");
        }
      } else if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          const result = await parseResume(base64, file.type);
          if (result) {
            setPreview(result);
          } else {
            setErrorMessage("I couldn't parse that resume. Please try another one.");
          }
          setParsing(false);
        };
        reader.readAsDataURL(file);
        return;
      } else {
        setErrorMessage('Unsupported file type. Please use PDF, DOCX, or TXT.');
      }
      setParsing(false);
    } catch (err) {
      console.error('Error parsing resume:', err);
      setErrorMessage('Something went wrong during the scan.');
      setParsing(false);
    }
  };

  const features = [
    {
      icon: <Zap className="w-5 h-5 text-neon-cyan" />,
      title: 'Instant Extraction',
      description: "Skylar's engine identifies your core professional identity in seconds.",
    },
    {
      icon: <Target className="w-5 h-5 text-neon-magenta" />,
      title: 'Strategic Role Mapping',
      description: 'See how your experience translates into high-impact career paths.',
    },
    {
      icon: <Fingerprint className="w-5 h-5 text-neon-lime" />,
      title: 'Attribute Visualization',
      description: 'Uncover the hidden strengths that make you indispensable.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-neon-cyan" />,
      title: 'Zero Friction',
      description: 'No account, no forms, just your data speaking for itself.',
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto mt-4 px-6 pb-12">
      {/* Section Header */}
      <div className="text-center mb-8 space-y-2">
        <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight">
          Preliminary <span className="text-neon-cyan italic">DNA Analysis</span>
        </h2>
        <p className="text-lg text-white/60 max-w-3xl mx-auto leading-relaxed">
          Experience the power of Skylar's engine. Drop your resume for an immediate glimpse into
          your professional blueprint and market potential.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left Panel: Features & Benefits */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass-panel p-8 md:p-12 rounded-[40px] border-white/10 bg-black/40 backdrop-blur-xl flex flex-col justify-center space-y-10"
        >
          <div className="space-y-3">
            <h3 className="text-3xl font-bold text-white">Why Scan Your DNA?</h3>
            <p className="text-lg text-white/40 leading-relaxed">
              Our preliminary analysis provides immediate clarity on your market position and hidden
              strengths.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="flex gap-6 group">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-neon-cyan/50 transition-all duration-300 shadow-lg">
                  {feature.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white group-hover:text-neon-cyan transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-white/60 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Panel: Functionality */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {parsing ? (
              <motion.div
                key="parsing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="glass-panel p-12 rounded-[40px] border-neon-cyan/20 bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-6 h-full"
              >
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-neon-cyan animate-spin" />
                  <div className="absolute inset-0 blur-xl bg-neon-cyan/20 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Extracting DNA...</h3>
                  <p className="text-white/60">Skylar is analyzing your career trajectory.</p>
                </div>
              </motion.div>
            ) : preview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 md:p-10 rounded-[40px] border-neon-lime/30 bg-black/60 backdrop-blur-xl relative overflow-hidden text-left h-full flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 p-6">
                  <button
                    onClick={() => setPreview(null)}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-neon-lime/10 rounded-2xl">
                      <CheckCircle2 className="w-8 h-8 text-neon-lime" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">DNA Preview Ready</h3>
                      <p className="text-neon-lime text-sm font-bold uppercase tracking-widest">
                        Initial Analysis Complete
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                      <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                        Detected Role
                      </p>
                      <p className="text-xl font-bold text-white">
                        {preview.role || 'Strategic Professional'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-white/40 uppercase tracking-widest">
                        Top DNA Attributes
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(preview.attributes || ['Strategic', 'Analytical', 'Visionary'])
                          .slice(0, 3)
                          .map((attr, i) => (
                            <span
                              key={i}
                              className="px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full text-sm text-neon-cyan font-medium"
                            >
                              {attr}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl space-y-2">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="w-4 h-4 text-neon-cyan mt-0.5" />
                      <p className="text-xs text-white/60 leading-relaxed">
                        <span className="text-neon-cyan font-bold">Disclaimer:</span> This is a
                        temporary preview. To save your DNA and start your 12-week journey, you'll
                        re-upload this during the{' '}
                        <span className="text-white font-bold italic">'Ignition'</span> phase.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={onDiveIn}
                  className="w-full py-5 mt-8 bg-neon-lime text-black hover:bg-white transition-all duration-300 font-bold text-lg rounded-2xl"
                >
                  Lock In This DNA
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative group cursor-pointer h-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/20 to-neon-lime/20 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="glass-panel p-12 rounded-[40px] border-white/10 bg-black/40 backdrop-blur-xl border-2 border-dashed border-white/20 group-hover:border-neon-cyan/50 transition-all duration-500 flex flex-col items-center justify-center text-center space-y-6 h-full">
                  <div className="w-24 h-24 rounded-[32px] bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                    <FileUp className="w-12 h-12 text-white/40 group-hover:text-neon-cyan" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl font-bold text-white group-hover:text-neon-cyan transition-colors tracking-tight">
                      Drop Your Resume
                    </h3>
                    <p className="text-white/60 max-w-xs mx-auto text-lg leading-relaxed">
                      See your Career DNA in 15 seconds. No account required for preview.
                    </p>
                  </div>
                  <div className="pt-6">
                    <span className="text-xs font-display uppercase tracking-[0.4em] text-white/20 group-hover:text-neon-cyan/60 transition-colors">
                      Supported: PDF, DOCX, TXT
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.docx,.txt"
          />

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-12 left-0 right-0 text-center text-neon-magenta text-sm font-medium"
            >
              {errorMessage}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
