import React from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';

interface HomeScreenProps {
  user: UserProfile;
  onNavigate: (screen: 'bot' | 'arena' | 'friend' | 'profile' | 'settings' | 'learn') => void;
  onStartOffline: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ user, onNavigate, onStartOffline }) => {
  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-start pt-16 pb-20 px-3 max-w-md mx-auto">
      {/* Luxury Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 text-center"
      >
        <div className="relative inline-flex items-center justify-center mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37]/30 via-[#17181D] to-[#0B0B0F] border border-[#D4AF37]/50 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.25)]">
            <span
              className="material-symbols-outlined text-[32px] text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              chess
            </span>
          </div>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3DDC84] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#3DDC84] border-2 border-[#0B0B0F]"></span>
          </span>
        </div>

        <h1 className="font-brand text-2xl md:text-3xl text-[#FFFFFF] tracking-[0.15em] font-bold gold-shimmer drop-shadow">
          VPN CHESS
        </h1>
        <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto my-1.5" />
        <p className="font-body text-[10px] text-[#A8A8A8] tracking-[0.2em] uppercase font-bold">
          AI Engine & Grandmaster Arena
        </p>
      </motion.div>

      {/* Player Stats Quick Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="w-full glass-panel rounded-xl p-2.5 mb-3.5 border border-[#D4AF37]/30 shadow-lg grid grid-cols-2 sm:grid-cols-4 gap-2 text-center"
      >
        <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center">
          <span className="text-[9px] text-[#A8A8A8] font-bold uppercase tracking-wider mb-0.5">
            Global Rating
          </span>
          <span className="font-headline text-base font-bold text-[#D4AF37] flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">military_tech</span>
            {user.elo || 1650}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center">
          <span className="text-[9px] text-[#A8A8A8] font-bold uppercase tracking-wider mb-0.5">
            Win Rate
          </span>
          <span className="font-headline text-base font-bold text-[#3DDC84] flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            {user.wins + user.losses > 0
              ? `${Math.round((user.wins / (user.wins + user.losses)) * 100)}%`
              : '68%'}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center">
          <span className="text-[9px] text-[#A8A8A8] font-bold uppercase tracking-wider mb-0.5">
            Current Rank
          </span>
          <span className="font-headline text-base font-bold text-[#4DA8FF] flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">emoji_events</span>
            Top 3.5%
          </span>
        </div>

        <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center">
          <span className="text-[9px] text-[#A8A8A8] font-bold uppercase tracking-wider mb-0.5">
            Matches
          </span>
          <span className="font-headline text-base font-bold text-[#FFFFFF] flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">query_stats</span>
            {user.wins + user.losses + user.draws || 142}
          </span>
        </div>
      </motion.div>

      {/* Main Action Grid */}
      <div className="w-full space-y-2.5">
        {/* Play AI Engine */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          onClick={() => onNavigate('bot')}
          className="w-full group relative p-3.5 rounded-xl bg-[#141622]/95 backdrop-blur-md border border-[#D4AF37]/60 shadow-[0_8px_25px_rgba(0,0,0,0.7)] hover:border-[#D4AF37] hover:bg-[#1a1d2e] hover:shadow-[0_0_20px_rgba(212,175,55,0.25)] active:scale-[0.98] transition-all text-left cursor-pointer flex items-center justify-between overflow-hidden"
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/25 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shrink-0 shadow-[0_0_12px_rgba(212,175,55,0.3)]">
              <span className="material-symbols-outlined text-xl">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-headline text-sm font-bold text-[#FFFFFF] tracking-wide">
                  Play vs AI Engine
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase bg-[#D4AF37] text-[#0B0B0F] shadow-sm">
                  Stockfish
                </span>
              </div>
              <span className="block font-body text-[11px] text-[#C0C0C0] font-medium">
                Custom ELO Bots (800 - 2600) & Real-Time Eval
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#D4AF37] text-xl shrink-0 group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </motion.button>

        {/* Online Arena Multiplayer */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          onClick={() => onNavigate('arena')}
          className="w-full group relative p-3.5 rounded-xl bg-[#141622]/95 backdrop-blur-md border border-[#4DA8FF]/60 shadow-[0_8px_25px_rgba(0,0,0,0.7)] hover:border-[#4DA8FF] hover:bg-[#1a1d2e] hover:shadow-[0_0_20px_rgba(77,168,255,0.25)] active:scale-[0.98] transition-all text-left cursor-pointer flex items-center justify-between overflow-hidden"
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-[#4DA8FF]/25 border border-[#4DA8FF] flex items-center justify-center text-[#4DA8FF] shrink-0 shadow-[0_0_12px_rgba(77,168,255,0.3)]">
              <span className="material-symbols-outlined text-xl">public</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-headline text-sm font-bold text-[#FFFFFF] tracking-wide">
                  Online Arena
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase bg-[#4DA8FF] text-[#0B0B0F] shadow-sm">
                  Multiplayer
                </span>
              </div>
              <span className="block font-body text-[11px] text-[#C0C0C0] font-medium">
                Instant Matchmaking & Rated Tournaments
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#4DA8FF] text-xl shrink-0 group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </motion.button>

        {/* Play with Friend */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          onClick={() => onNavigate('friend')}
          className="w-full group relative p-3.5 rounded-xl bg-[#141622]/95 backdrop-blur-md border border-purple-500/60 shadow-[0_8px_25px_rgba(0,0,0,0.7)] hover:border-purple-400 hover:bg-[#1a1d2e] hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] active:scale-[0.98] transition-all text-left cursor-pointer flex items-center justify-between overflow-hidden"
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-purple-500/25 border border-purple-400 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              <span className="material-symbols-outlined text-xl">group</span>
            </div>
            <div>
              <span className="block font-headline text-sm font-bold text-[#FFFFFF] tracking-wide">
                Play with Friend
              </span>
              <span className="block font-body text-[11px] text-[#C0C0C0] font-medium">
                Generate Room Code & Challenge
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-purple-400 text-xl shrink-0 group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </motion.button>

        {/* Master Academy & Tactics */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          onClick={() => onNavigate('learn')}
          className="w-full group relative p-3.5 rounded-xl bg-[#141622]/95 backdrop-blur-md border border-[#3DDC84]/60 shadow-[0_8px_25px_rgba(0,0,0,0.7)] hover:border-[#3DDC84] hover:bg-[#1a1d2e] hover:shadow-[0_0_20px_rgba(61,220,132,0.25)] active:scale-[0.98] transition-all text-left cursor-pointer flex items-center justify-between overflow-hidden"
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-[#3DDC84]/25 border border-[#3DDC84] flex items-center justify-center text-[#3DDC84] shrink-0 shadow-[0_0_12px_rgba(61,220,132,0.3)]">
              <span className="material-symbols-outlined text-xl">psychology</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-headline text-sm font-bold text-[#FFFFFF] tracking-wide">
                  Master Academy
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase bg-[#3DDC84] text-[#0B0B0F] shadow-sm">
                  Puzzles & AI
                </span>
              </div>
              <span className="block font-body text-[11px] text-[#C0C0C0] font-medium">
                Daily Tactical Puzzles & Opening Books
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#3DDC84] text-xl shrink-0 group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </motion.button>

        {/* Offline Pass & Play */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          onClick={onStartOffline}
          className="w-full group relative p-3.5 rounded-xl bg-[#141622]/95 backdrop-blur-md border border-amber-500/60 shadow-[0_8px_25px_rgba(0,0,0,0.7)] hover:border-amber-400 hover:bg-[#1a1d2e] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] active:scale-[0.98] transition-all text-left cursor-pointer flex items-center justify-between overflow-hidden"
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-amber-500/25 border border-amber-400 flex items-center justify-center text-amber-300 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <span className="material-symbols-outlined text-xl">phonelink_setup</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-headline text-sm font-bold text-[#FFFFFF] tracking-wide">
                  Offline Pass & Play
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase bg-amber-500 text-[#0B0B0F] shadow-sm">
                  Local 2P
                </span>
              </div>
              <span className="block font-body text-[11px] text-[#C0C0C0] font-medium">
                Play locally on a single device offline
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-amber-400 text-xl shrink-0 group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </motion.button>
      </div>
    </div>
  );
};

