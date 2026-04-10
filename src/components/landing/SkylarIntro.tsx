import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { useSkylarConfig } from '../../contexts/SkylarConfigContext';

export const SkylarAvatar: React.FC = () => {
  const { global } = useSkylarConfig();
  const skylarAvatar = global?.avatar?.url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800';
  const scale = global?.avatar?.scale || 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative"
    >
      <div className="w-40 h-40 md:w-[200px] md:h-[200px] rounded-full overflow-hidden border-2 border-neon-cyan/30 shadow-[0_0_30px_rgba(0,243,255,0.1)] group">
        <img
          src={skylarAvatar}
          alt="Skylar"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          style={{ transform: `scale(${scale})` }}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      <div className="absolute -bottom-1 -right-1 p-2 bg-zinc-900 border border-neon-cyan/50 rounded-xl shadow-lg">
        <Sparkles className="w-4 h-4 text-neon-lime animate-pulse" />
      </div>
    </motion.div>
  );
};

export const SkylarScrollingText: React.FC = () => {
  const { global } = useSkylarConfig();
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(50);

  const messages = global?.homeBenefits && global.homeBenefits.length > 0 
    ? global.homeBenefits 
    : ["Loading SPARKWavv Experience..."];

  useEffect(() => {
    const handleType = () => {
      const i = loopNum % messages.length;
      const fullText = messages[i];

      setText(
        isDeleting ? fullText.substring(0, text.length - 1) : fullText.substring(0, text.length + 1)
      );

      setTypingSpeed(isDeleting ? 20 : 50);

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 3000);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed, messages]);

  const renderText = (currentText: string) => {
    const colonIndex = currentText.indexOf(':');
    if (colonIndex !== -1) {
      const hook = currentText.substring(0, colonIndex + 1);
      const rest = currentText.substring(colonIndex + 1);
      return (
        <>
          <strong className="font-bold text-white not-italic">{hook}</strong>
          {rest}
        </>
      );
    }
    return currentText;
  };

  return (
    <div className="min-h-[60px] flex items-center justify-center">
      <p className="text-xl md:text-2xl text-white/80 font-display italic leading-relaxed max-w-2xl text-center">
        {renderText(text)}
        <span className="inline-block w-0.5 h-6 bg-neon-cyan ml-1 animate-blink" />
      </p>
    </div>
  );
};

export const SkylarIntro: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  return (
    <div className="flex flex-col items-center space-y-8 py-8 relative group">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 p-2 rounded-full bg-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
          title="Dismiss Intro"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      <SkylarAvatar />
      <SkylarScrollingText />
    </div>
  );
};
