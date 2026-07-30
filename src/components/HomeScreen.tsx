import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile, OngoingGameSession } from '../types';

interface HomeScreenProps {
  user: UserProfile;
  onNavigate: (screen: 'bot' | 'arena' | 'friend' | 'profile' | 'settings' | 'learn') => void;
  onStartOffline: () => void;
  onResumeMatch: (session: OngoingGameSession) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ user, onNavigate, onStartOffline, onResumeMatch }) => {
  const [ongoingSession, setOngoingSession] = useState<OngoingGameSession | null>(() => {
    try {
      const saved = localStorage.getItem('vpn_chess_ongoing_session');
      if (saved) {
        const parsed: OngoingGameSession = JSON.parse(saved);
        if (parsed && parsed.updatedAt && Date.now() - parsed.updatedAt < 24 * 60 * 60 * 1000) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse ongoing session:', e);
    }
    return null;
  });

  useEffect(() => {
    const checkOngoing = () => {
      try {
        const saved = localStorage.getItem('vpn_chess_ongoing_session');
        if (saved) {
          const parsed: OngoingGameSession = JSON.parse(saved);
          if (parsed && parsed.updatedAt && Date.now() - parsed.updatedAt < 24 * 60 * 60 * 1000) {
            setOngoingSession(parsed);
            return;
          }
        }
      } catch (e) {
        // ignore
      }
      setOngoingSession(null);
    };

    checkOngoing();
    window.addEventListener('focus', checkOngoing);
    return () => window.removeEventListener('focus', checkOngoing);
  }, []);

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  const safeElo = user?.elo ?? 1200;
  const safeWins = user?.wins ?? 0;
  const safeLosses = user?.losses ?? 0;
  const safeDraws = user?.draws ?? 0;
  const totalDecided = safeWins + safeLosses;
  const safeGamesPlayed = user?.gamesPlayed || (safeWins + safeLosses + safeDraws);
  const winRatePercentage = totalDecided > 0 ? `${Math.round((safeWins / totalDecided) * 100)}%` : '0%';

  const currentRankLabel = safeGamesPlayed > 0
    ? safeElo >= 2400
      ? 'Grandmaster'
      : safeElo >= 2000
      ? 'Master'
      : safeElo >= 1600
      ? 'Expert'
      : safeElo >= 1400
      ? 'Class A'
      : 'Challenger'
    : 'Unranked';

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
        className="w-full glass-panel rounded-xl p-2 mb-3.5 border border-[#D4AF37]/30 shadow-lg grid grid-cols-2 sm:grid-cols-4 gap-2 text-center"
      >
        <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center justify-center min-w-0 overflow-hidden">
          <span className="text-[9px] text-[#A8A8A8] font-bold uppercase tracking-wider mb-0.5 truncate max-w-full">
            Global Rating
          </span>
          <span className="font-headline text-xs sm:text-sm font-bold text-[#D4AF37] flex items-center justify-center gap-1 w-full truncate max-w-full px-0.5">
            <span className="material-symbols-outlined text-sm shrink-0">military_tech</span>
            <span className="truncate">{safeElo}</span>
          </span>
        </div>

        <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center justify-center min-w-0 overflow-hidden">
          <span className="text-[9px] text-[#A8A8A8] font-bold uppercase tracking-wider mb-0.5 truncate max-w-full">
            Win Rate
          </span>
          <span className="font-headline text-xs sm:text-sm font-bold text-[#3DDC84] flex items-center justify-center gap-1 w-full truncate max-w-full px-0.5">
            <span className="material-symbols-outlined text-sm shrink-0">trending_up</span>
            <span className="truncate">{winRatePercentage}</span>
          </span>
        </div>

        <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center justify-center min-w-0 overflow-hidden">
          <span className="text-[9px] text-[#A8A8A8] font-bold uppercase tracking-wider mb-0.5 truncate max-w-full">
            Current Rank
          </span>
          <span className="font-headline text-xs sm:text-sm font-bold text-[#4DA8FF] flex items-center justify-center gap-1 w-full truncate max-w-full px-0.5">
            <span className="material-symbols-outlined text-sm shrink-0">emoji_events</span>
            <span className="truncate">{currentRankLabel}</span>
          </span>
        </div>

        <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center justify-center min-w-0 overflow-hidden">
          <span className="text-[9px] text-[#A8A8A8] font-bold uppercase tracking-wider mb-0.5 truncate max-w-full">
            Matches
          </span>
          <span className="font-headline text-xs sm:text-sm font-bold text-[#FFFFFF] flex items-center justify-center gap-1 w-full truncate max-w-full px-0.5">
            <span className="material-symbols-outlined text-sm shrink-0">query_stats</span>
            <span className="truncate">{safeGamesPlayed}</span>
          </span>
        </div>
      </motion.div>

      {/* Ongoing Match Reconnection Banner */}
      {ongoingSession && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full glass-panel p-3.5 rounded-2xl mb-3.5 border-2 border-[#D4AF37] bg-gradient-to-r from-[#D4AF37]/20 via-[#17181D] to-[#0B0B0F] shadow-[0_0_25px_rgba(212,175,55,0.35)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3DDC84] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#3DDC84]"></span>
              </span>
              <span className="font-headline text-xs font-bold text-[#3DDC84] tracking-wider uppercase">
                Ongoing Match Detected
              </span>
            </div>
            <span className="text-[10px] text-[#D4AF37] font-bold uppercase bg-white/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
              {ongoingSession.config.mode === 'bot'
                ? 'Bot Battle'
                : ongoingSession.config.mode === 'friend'
                ? `Room ${ongoingSession.config.roomCode || ''}`
                : 'Pass & Play'}
            </span>
          </div>

          <div className="flex items-center justify-between my-2 px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full border border-[#D4AF37] bg-[#1e201d] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl text-[#D4AF37]">
                  {ongoingSession.config.mode === 'bot' ? 'smart_toy' : 'person'}
                </span>
              </div>
              <div>
                <div className="font-headline text-sm font-bold text-[#FFFFFF]">
                  vs {ongoingSession.config.opponentName}
                </div>
                <div className="text-[10px] text-[#D4AF37] font-bold">
                  Rating: {ongoingSession.config.opponentElo} ELO
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[9px] text-[#A8A8A8] font-bold uppercase">Clocks</div>
              <div className="font-mono text-xs font-bold text-[#FFFFFF]">
                {formatClock(ongoingSession.playerTime)} vs {formatClock(ongoingSession.opponentTime)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => onResumeMatch(ongoingSession)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#f1d77a] to-[#AA7C11] text-[#0B0B0F] font-headline text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              <span>Continue Ongoing Match</span>
            </button>

            <button
              onClick={() => {
                localStorage.removeItem('vpn_chess_ongoing_session');
                setOngoingSession(null);
              }}
              title="Discard ongoing match"
              className="p-2.5 rounded-xl glass-panel hover:bg-red-500/20 hover:border-red-500/50 text-[#A8A8A8] hover:text-red-400 active:scale-95 transition-all cursor-pointer border border-white/10"
            >
              <span className="material-symbols-outlined text-base">delete</span>
            </button>
          </div>
        </motion.div>
      )}

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

