import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'neon';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  loading = false,
  type = 'button'
}) => {
  const variants = {
    primary: 'bg-white text-black hover:bg-gray-200',
    secondary: 'bg-black text-white border border-white/10 hover:bg-white/5',
    outline: 'border border-white/20 text-white hover:border-white/40',
    neon: 'bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/50 hover:bg-[#00f3ff]/20 shadow-[0_0_15px_rgba(0,243,255,0.3)]'
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-6 py-3 rounded-full font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
};
