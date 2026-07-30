import React, { useState } from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      icon: 'sports_esports',
      title: 'Welcome to VPN Chess',
      subtitle: 'Grandmaster Protocols & Online Arena',
      description:
        'VPN Chess is a high-performance, ultra-luxurious chess platform engineered for competitive players, casual enthusiasts, and grandmasters alike.',
      highlights: [
        '3D Gold & Obsidian Board with Three.js rendering engine',
        'White Marble & Black Obsidian 3D piece models',
        'Instant guest access or cloud-synced account persistence',
        'Offline pass-and-play and native APK support',
      ],
    },
    {
      icon: 'smart_toy',
      title: 'Engine & Bot Arena',
      subtitle: 'Adaptive AI Engine Training',
      description:
        'Train against Stockfish-powered AI bots configured across multiple ELO difficulty tiers from Novice (800 ELO) to Grandmaster (2600 ELO).',
      highlights: [
        'Real-time position evaluation bar (+1.5, -2.3)',
        'Move suggestion hints and instant undo capabilities',
        'Opening repertoire feedback and mistake detection',
        'Custom bot personalities with unique play styles',
      ],
    },
    {
      icon: 'public',
      title: 'Multiplayer & Online Rooms',
      subtitle: 'P2P Real-Time Matchmaking',
      description:
        'Create private game rooms or share 6-digit invite codes to challenge friends across the world in real time.',
      highlights: [
        'Instant room code generation for zero-latency matches',
        'In-game spectator mode and move logs',
        'PGN export and game review analysis',
        'Elo rating adjustments after official online games',
      ],
    },
    {
      icon: 'psychology',
      title: 'Chess Master Academy',
      subtitle: 'Interactive Lessons & Tactics',
      description:
        'Elevate your tactical vision with curated opening guides, tactical puzzles, endgame studies, and interactive quizzes.',
      highlights: [
        'Daily tactical puzzle challenges',
        'Interactive opening book explorer',
        'Endgame drills (Rook + Pawn, King + Queen vs King)',
        'Master games analysis library',
      ],
    },
    {
      icon: 'phonelink_setup',
      title: 'Offline & Mobile APK',
      subtitle: 'Play Anywhere, Anytime',
      description:
        'Install VPN Chess directly onto your mobile or tablet device for full-screen native execution without browser chrome.',
      highlights: [
        'Offline Pass & Play mode for two players on a single phone',
        'Ultra Performance Mode for low-end phone battery saving',
        'Native APK download and PWA desktop installation',
        'Haptic feedback and custom wooden movement sounds',
      ],
    },
  ];

  const current = steps[activeStep];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#121411] border border-[#D4AF37]/50 rounded-3xl p-6 md:p-8 shadow-2xl text-[#e3e3de] flex flex-col justify-between min-h-[500px]">
        {/* Header Bar */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#D4AF37] text-2xl font-bold">
              help_outline
            </span>
            <span className="font-headline text-lg font-bold text-[#FAF9F6]">
              New Member Software Guide
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-[#c4c7c7] hover:text-[#FAF9F6] transition-colors cursor-pointer"
            title="Close Guide"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Step Indicator Pills */}
        <div className="flex items-center justify-between gap-2 my-4">
          {steps.map((s, idx) => (
            <button
              key={s.title}
              onClick={() => setActiveStep(idx)}
              className={`flex-1 h-2 rounded-full transition-all cursor-pointer ${
                activeStep === idx
                  ? 'bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.6)]'
                  : idx < activeStep
                  ? 'bg-amber-500/40'
                  : 'bg-white/10'
              }`}
              title={`Step ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Content Body */}
        <div className="space-y-5 my-2 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shrink-0 shadow-lg">
              <span className="material-symbols-outlined text-3xl">{current.icon}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest block">
                STEP {activeStep + 1} OF {steps.length} • {current.subtitle}
              </span>
              <h3 className="font-headline text-xl md:text-2xl font-bold text-[#FAF9F6]">
                {current.title}
              </h3>
            </div>
          </div>

          <p className="font-body text-xs md:text-sm text-[#c4c7c7] leading-relaxed">
            {current.description}
          </p>

          <div className="bg-[#181a17] p-4 rounded-2xl border border-white/10 space-y-2">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block mb-1">
              Key Features & Usage:
            </span>
            <ul className="space-y-1.5">
              {current.highlights.map((h) => (
                <li key={h} className="text-xs text-[#FAF9F6] flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-sm">
                    check_circle
                  </span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
          <button
            onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold text-[#FAF9F6] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Previous</span>
          </button>

          <span className="text-[11px] text-[#c4c7c7] font-semibold">
            {activeStep + 1} / {steps.length}
          </span>

          {activeStep < steps.length - 1 ? (
            <button
              onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
              className="px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#b8972e] text-[#121411] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <span>Next</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">check</span>
              <span>ENTER VPN CHESS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
