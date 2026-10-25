import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TextScramble } from '@/components/core/text-scramble';
import { Cake, Sparkles, ArrowRight, X } from 'lucide-react';

interface IntroScrambleOverlayProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export const IntroScrambleOverlay: React.FC<IntroScrambleOverlayProps> = ({
  onComplete,
  forceShow = false,
}) => {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (forceShow) return true;
    const seen = sessionStorage.getItem('browinegirl_intro_seen');
    return !seen;
  });

  const [phase, setPhase] = useState<'scramble' | 'welcome'>('scramble');

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      setPhase('scramble');
    }
  }, [forceShow]);

  const handleDismiss = () => {
    sessionStorage.setItem('browinegirl_intro_seen', 'true');
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const handleScrambleComplete = () => {
    // Transition to welcome letter after scramble completes
    setTimeout(() => {
      setPhase('welcome');
    }, 400);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-50 bg-[#0B0504] text-[#F8F0E5] flex flex-col items-center justify-center p-6 select-none overflow-hidden"
        >
          {/* Subtle Ambient Background Glows */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#C47B55]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#E5A962]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Quick Skip Intro Button in Top Corner */}
          <button
            onClick={handleDismiss}
            type="button"
            className="absolute top-6 right-6 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-[#E8D6C3] hover:text-white text-xs font-mono uppercase tracking-wider backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5"
            aria-label="Skip introduction animation"
          >
            <span>Skip Intro</span>
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Center Stage Animation */}
          <div className="relative max-w-2xl w-full mx-auto text-center flex flex-col items-center justify-center space-y-6">
            {/* Bakery Brand Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="w-16 h-16 rounded-2xl bg-[#C47B55] flex items-center justify-center shadow-xl shadow-[#C47B55]/20 text-white mb-2"
            >
              <Cake className="w-9 h-9 text-[#F8F0E5]" />
            </motion.div>

            {/* BIG BOLD SCRAMBLE TEXT: "BROWNIEGIRLCAKES" */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#E5A962] block">
                Artisan Brownie Studio
              </span>

              <h1 className="font-hero text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#F8F0E5] uppercase drop-shadow-md">
                <TextScramble
                  duration={1.6}
                  speed={0.035}
                  onScrambleComplete={handleScrambleComplete}
                  className="font-mono tracking-tight font-black"
                >
                  BROWNIEGIRLCAKES
                </TextScramble>
              </h1>
            </div>

            {/* WELCOME LETTER CARD (Fades in after scramble) */}
            <AnimatePresence>
              {phase === 'welcome' && (
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-6 w-full max-w-lg bg-[#1F0F0C]/90 border border-[#C47B55]/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-4"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C47B55]/20 text-[#E5A962] text-[11px] font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    A Warm Welcome from Elena
                  </div>

                  <h2 className="font-gallery text-xl sm:text-2xl font-bold text-[#F8F0E5]">
                    Welcome to Our Sweet Sanctuary.
                  </h2>

                  <p className="text-xs sm:text-sm text-[#E8D6C3]/85 leading-relaxed">
                    Every batch of our artisan brownies is slow-baked with European cultured butter, single-origin Valrhona cocoa, and infinite love. We invite you to discover our handcrafted recipes, bespoke celebration catering, and interactive baking masterclasses.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={handleDismiss}
                      type="button"
                      className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#C47B55] hover:bg-[#D98B5F] text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg hover:shadow-[#C47B55]/30 cursor-pointer flex items-center justify-center gap-2 group"
                    >
                      <span>Enter BrownieGirlCakes</span>
                      <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Audio/Visual Hint */}
          <div className="absolute bottom-6 text-[11px] font-mono text-[#E8D6C3]/40 tracking-wider">
            Baked with Passion &bull; Perfected with Love
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroScrambleOverlay;
