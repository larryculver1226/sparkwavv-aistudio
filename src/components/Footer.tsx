import React from 'react';
import { Sparkles, Twitter, Linkedin, Github, Mail, ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (href: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Skylar AI', href: 'product-skylar' },
      { label: 'Features', href: 'product-features' },
      { label: 'Technology', href: 'product-technology' },
      { label: 'Wavvault', href: 'product-wavvault' },
    ],
    company: [
      { label: 'Vision', href: 'company-vision' },
      { label: 'About Us', href: 'company-about' },
      { label: 'Investors', href: 'company-investors' },
      { label: 'Give a Little', href: 'company-give' },
    ],
    resources: [
      { label: 'Documentation', href: '#' },
      { label: 'Help Center', href: '#' },
      { label: 'Community', href: '#' },
      { label: 'Partners', href: '#' },
    ],
  };

  return (
    <footer className="relative mt-20 border-t border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-8">
            <div 
              className="flex items-center gap-4 group cursor-pointer w-fit"
              onClick={() => onNavigate('landing')}
            >
              <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center group-hover:bg-neon-cyan/20 transition-all duration-500">
                <Sparkles className="w-5 h-5 text-neon-cyan" />
              </div>
              <span className="text-xl font-display font-bold tracking-tighter text-white">
                SPARK<span className="text-neon-cyan italic">Wavv</span>
              </span>
            </div>
            <p className="text-white/40 max-w-sm leading-relaxed text-lg">
              The most advanced career engine ever built. Transforming personal history into market dominance through cinematic self-discovery.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" aria-label="Follow us on Twitter" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Follow us on LinkedIn" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Follow us on GitHub" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Send us an email" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h4 className="text-white font-display font-bold uppercase tracking-widest text-xs mb-8">Product</h4>
            <ul className="space-y-4">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <button 
                    onClick={() => onNavigate(link.href)}
                    className="text-white/40 hover:text-neon-cyan transition-colors flex items-center gap-2 group"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-display font-bold uppercase tracking-widest text-xs mb-8">Company</h4>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <button 
                    onClick={() => onNavigate(link.href)}
                    className="text-white/40 hover:text-neon-cyan transition-colors flex items-center gap-2 group"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-display font-bold uppercase tracking-widest text-xs mb-8">Resources</h4>
            <ul className="space-y-4">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('#') ? (
                    <a 
                      href={link.href}
                      className="text-white/40 hover:text-neon-cyan transition-colors flex items-center gap-2 group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </a>
                  ) : (
                    <button 
                      onClick={() => onNavigate(link.href)}
                      className="text-white/40 hover:text-neon-cyan transition-colors flex items-center gap-2 group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-white/20 text-sm">
            © {currentYear} SPARKWavv Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <a href="#" className="text-white/20 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-white/20 hover:text-white text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-white/20 hover:text-white text-sm transition-colors">Cookie Settings</a>
          </div>
        </div>
      </div>

      {/* Decorative Gradient */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
    </footer>
  );
};
