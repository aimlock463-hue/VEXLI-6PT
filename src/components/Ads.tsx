import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Info, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdProps {
  type: 'banner' | 'interstitial';
  onClose?: () => void;
}

export function Ad({ type, onClose }: AdProps) {
  const { upgrade } = useAuth();

  if (type === 'interstitial') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
      >
        <div className="glass-card p-8 max-w-sm w-full text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/30 hover:text-white text-xs"
          >
            Skip in 5s
          </button>
          <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Crown className="w-8 h-8 text-brand-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Daily Limit Reached</h3>
          <p className="text-white/50 text-sm mb-6">
            You've hit your daily limit. Upgrade to Premium for unlimited access and exclusive features.
          </p>
          
          <div className="space-y-3 mb-6">
            <button 
              onClick={() => { upgrade(); onClose?.(); }}
              className="w-full py-4 rounded-xl bg-brand-primary text-black font-bold flex flex-col items-center justify-center"
            >
              <span className="text-sm">Premium Monthly</span>
              <span className="text-[10px] opacity-70">$9.99 / month</span>
            </button>
            <button 
              onClick={() => { upgrade(); onClose?.(); }}
              className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold flex flex-col items-center justify-center"
            >
              <span className="text-sm">Premium Yearly</span>
              <span className="text-[10px] opacity-50">$79.99 / year (Save 33%)</span>
            </button>
          </div>
          
          <div className="text-[10px] text-white/20 uppercase tracking-widest">Secure Checkout via Stripe</div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="glass-card p-4 flex items-center justify-between bg-gradient-to-r from-brand-primary/10 to-transparent border-brand-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
            <ExternalLink className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <div className="text-xs font-bold">Velix Pro</div>
            <div className="text-[10px] text-white/50">Unlock the full power of AI</div>
          </div>
        </div>
        <button className="px-4 py-1.5 rounded-lg bg-white/10 text-[10px] font-bold hover:bg-white/20 transition-colors">
          LEARN MORE
        </button>
      </div>
      <div className="text-[8px] text-white/20 mt-1 text-center uppercase tracking-tighter">Advertisement</div>
    </div>
  );
}
