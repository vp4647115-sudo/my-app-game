import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile, OngoingGameSession } from '../types';

interface HomeScreenProps {
  user: UserProfile;
  onNavigate: (screen: 'bot' | 'arena' | 'friend' | 'profile' | 'settings' | 'learn') => void;
  onStartOffline: () => void;
  onResumeMatch: (session: OngoingGameSession) => void;
  onOpenPayUModal?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ user, onNavigate, onStartOffline, onResumeMatch, onOpenPayUModal }) => {
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

      {/* Player Stats Quick Banner with Distinct Premium Colors */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="w-full glass-panel rounded-2xl p-2.5 mb-4 border border-[#D4AF37]/30 shadow-2xl grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center"
      >
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#291F0C] to-[#140F05] border border-[#FFB703]/30 shadow-md flex flex-col items-center justify-center min-w-0 overflow-hidden">
          <span className="text-[9px] text-[#D4B26F] font-bold uppercase tracking-wider mb-0.5 truncate max-w-full">
            Global Rating
          </span>
          <span className="font-headline text-xs sm:text-sm font-bold text-[#FFC300] flex items-center justify-center gap-1 w-full truncate max-w-full px-0.5">
            <span className="material-symbols-outlined text-sm shrink-0 text-[#FFB703]">military_tech</span>
            <span className="truncate">{safeElo}</span>
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0D2617] to-[#06140B] border border-[#00E676]/30 shadow-md flex flex-col items-center justify-center min-w-0 overflow-hidden">
          <span className="text-[9px] text-[#A2E8BC] font-bold uppercase tracking-wider mb-0.5 truncate max-w-full">
            Win Rate
          </span>
          <span className="font-headline text-xs sm:text-sm font-bold text-[#00E676] flex items-center justify-center gap-1 w-full truncate max-w-full px-0.5">
            <span className="material-symbols-outlined text-sm shrink-0 text-[#69F0AE]">trending_up</span>
            <span className="truncate">{winRatePercentage}</span>
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0E2038] to-[#07111F] border border-[#29B6F6]/30 shadow-md flex flex-col items-center justify-center min-w-0 overflow-hidden">
          <span className="text-[9px] text-[#93D1F5] font-bold uppercase tracking-wider mb-0.5 truncate max-w-full">
            Current Rank
          </span>
          <span className="font-headline text-xs sm:text-sm font-bold text-[#29B6F6] flex items-center justify-center gap-1 w-full truncate max-w-full px-0.5">
            <span className="material-symbols-outlined text-sm shrink-0 text-[#81D4FA]">emoji_events</span>
            <span className="truncate">{currentRankLabel}</span>
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#201035] to-[#0E071A] border border-[#AB47BC]/30 shadow-md flex flex-col items-center justify-center min-w-0 overflow-hidden">
          <span className="text-[9px] text-[#DCA2E8] font-bold uppercase tracking-wider mb-0.5 truncate max-w-full">
            Matches
          </span>
          <span className="font-headline text-xs sm:text-sm font-bold text-[#E1BEE7] flex items-center justify-center gap-1 w-full truncate max-w-full px-0.5">
            <span className="material-symbols-outlined text-sm shrink-0 text-[#CE93D8]">query_stats</span>
            <span className="truncate">{safeGamesPlayed}</span>
          </span>
        </div>
      </motion.div>

      {/* PayU VIP Master Upgrade Showcase Banner */}
      {onOpenPayUModal && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mb-3.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#2C1F0D] via-[#1D1409] to-[#120B05] border border-[#FFB703]/50 shadow-[0_8px_25px_rgba(255,183,3,0.2)] flex flex-col sm:flex-row items-center justify-between gap-3 text-left relative overflow-hidden"
        >
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-radial from-[#FFB703]/20 to-transparent blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-3.5 z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#FFB703]/20 border border-[#FFB703] flex items-center justify-center text-[#FFC300] shrink-0 shadow-[0_0_15px_rgba(255,183,3,0.4)]">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                workspace_premium
              </span>
            </div>
            <div>
              <div className="font-headline text-xs sm:text-sm font-black text-[#FFFDF7] flex items-center gap-2">
                <span>CHESS MASTER VIP MEMBERSHIP</span>
                <span className="px-1.5 py-0.5 bg-[#FFB703] text-[#120B05] rounded text-[8px] font-black uppercase">PayU ₹ INR</span>
              </div>
              <div className="font-body text-[11px] text-[#E0C8A0] mt-0.5">
                {user.isPremium
                  ? `Active Plan: ${user.premiumPlan || 'VIP Master Pass'} • Unlimited AI Engine & Coach`
                  : 'Get Stockfish 16 Engine, Gemini AI Coach, 3D Themes & VIP Badge starting at ₹10/mo'}
              </div>
            </div>
          </div>

          <button
            onClick={onOpenPayUModal}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#FF8C00] text-[#120B05] font-black text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5 z-10"
          >
            <span>{user.isPremium ? 'Manage VIP Plan' : 'Upgrade via PayU (₹10)'}</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </motion.div>
      )}

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

      {/* Main Action Grid - Luxury Glassmorphic Chess Cards with Rich Background Imagery */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Play Online */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          onClick={() => onNavigate('arena')}
          className="group relative h-36 rounded-2xl overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.85)] hover:shadow-[0_0_30px_rgba(255,183,3,0.45)] hover:-translate-y-1 active:scale-[0.98] transition-all text-left cursor-pointer border border-[#FFB703]/50 flex flex-col justify-between p-4"
        >
          {/* Background Image with Ambient Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center filter brightness-[0.45] contrast-125 group-hover:scale-110 transition-transform duration-700 ease-out"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&q=80&w=800')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#140D05] via-[#1F1408]/75 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-[#FFB703]/25 to-transparent blur-xl pointer-events-none" />

          {/* Card Top Row */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#2C1F0D]/90 border border-[#FFB703]/60 flex items-center justify-center shadow-[0_0_12px_rgba(255,183,3,0.4)] backdrop-blur-md">
              <span className="material-symbols-outlined text-2xl text-[#FFC300]" style={{ fontVariationSettings: "'FILL' 1" }}>
                public
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#FFB703]/25 text-[#FFC300] border border-[#FFB703]/60 backdrop-blur-md shadow-sm">
              LIVE ARENA
            </span>
          </div>

          {/* Card Content */}
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <div className="font-headline text-base sm:text-lg font-black text-[#FFFDF7] tracking-wider drop-shadow-md">
                PLAY ONLINE
              </div>
              <div className="font-body text-[11px] text-[#E0C8A0] font-medium leading-tight drop-shadow">
                Ranked matchmaking & arena tournaments
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#FFB703]/20 border border-[#FFB703]/60 flex items-center justify-center text-[#FFC300] group-hover:bg-[#FFB703] group-hover:text-[#120B05] group-hover:scale-110 transition-all shadow-md shrink-0">
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </div>
          </div>
        </motion.button>

        {/* Play vs AI */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          onClick={() => onNavigate('bot')}
          className="group relative h-36 rounded-2xl overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.85)] hover:shadow-[0_0_30px_rgba(0,230,118,0.45)] hover:-translate-y-1 active:scale-[0.98] transition-all text-left cursor-pointer border border-[#00E676]/50 flex flex-col justify-between p-4"
        >
          {/* Background Image with Ambient Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center filter brightness-[0.45] contrast-125 group-hover:scale-110 transition-transform duration-700 ease-out"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05140B] via-[#0A2414]/75 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-[#00E676]/25 to-transparent blur-xl pointer-events-none" />

          {/* Card Top Row */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#0A2616]/90 border border-[#00E676]/60 flex items-center justify-center shadow-[0_0_12px_rgba(0,230,118,0.4)] backdrop-blur-md">
              <span className="material-symbols-outlined text-2xl text-[#69F0AE]" style={{ fontVariationSettings: "'FILL' 1" }}>
                smart_toy
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#00E676]/25 text-[#69F0AE] border border-[#00E676]/60 backdrop-blur-md shadow-sm">
              STOCKFISH 16
            </span>
          </div>

          {/* Card Content */}
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <div className="font-headline text-base sm:text-lg font-black text-[#F2FFF8] tracking-wider drop-shadow-md">
                PLAY VS AI
              </div>
              <div className="font-body text-[11px] text-[#A2E8BC] font-medium leading-tight drop-shadow">
                Adaptive grandmaster bots (800–2600 ELO)
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#00E676]/20 border border-[#00E676]/60 flex items-center justify-center text-[#69F0AE] group-hover:bg-[#00E676] group-hover:text-[#05140B] group-hover:scale-110 transition-all shadow-md shrink-0">
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </div>
          </div>
        </motion.button>

        {/* Play with Friend */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          onClick={() => onNavigate('friend')}
          className="group relative h-36 rounded-2xl overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.85)] hover:shadow-[0_0_30px_rgba(41,182,246,0.45)] hover:-translate-y-1 active:scale-[0.98] transition-all text-left cursor-pointer border border-[#29B6F6]/50 flex flex-col justify-between p-4"
        >
          {/* Background Image with Ambient Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center filter brightness-[0.45] contrast-125 group-hover:scale-110 transition-transform duration-700 ease-out"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&q=80&w=800')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#061224] via-[#0D203D]/75 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-[#29B6F6]/25 to-transparent blur-xl pointer-events-none" />

          {/* Card Top Row */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#0D223F]/90 border border-[#29B6F6]/60 flex items-center justify-center shadow-[0_0_12px_rgba(41,182,246,0.4)] backdrop-blur-md">
              <span className="material-symbols-outlined text-2xl text-[#81D4FA]" style={{ fontVariationSettings: "'FILL' 1" }}>
                groups
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#29B6F6]/25 text-[#81D4FA] border border-[#29B6F6]/60 backdrop-blur-md shadow-sm">
              PRIVATE ROOM
            </span>
          </div>

          {/* Card Content */}
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <div className="font-headline text-base sm:text-lg font-black text-[#F4FAFF] tracking-wider drop-shadow-md">
                PLAY FRIEND
              </div>
              <div className="font-body text-[11px] text-[#93D1F5] font-medium leading-tight drop-shadow">
                Create room code & challenge buddies
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#29B6F6]/20 border border-[#29B6F6]/60 flex items-center justify-center text-[#81D4FA] group-hover:bg-[#29B6F6] group-hover:text-[#061224] group-hover:scale-110 transition-all shadow-md shrink-0">
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </div>
          </div>
        </motion.button>

        {/* Master Academy */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          onClick={() => onNavigate('learn')}
          className="group relative h-36 rounded-2xl overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.85)] hover:shadow-[0_0_30px_rgba(171,71,188,0.45)] hover:-translate-y-1 active:scale-[0.98] transition-all text-left cursor-pointer border border-[#AB47BC]/50 flex flex-col justify-between p-4"
        >
          {/* Background Image with Ambient Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center filter brightness-[0.45] contrast-125 group-hover:scale-110 transition-transform duration-700 ease-out"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1580541832626-2a7131ee809f?auto=format&fit=crop&q=80&w=800')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#11071F] via-[#210D3D]/75 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-[#AB47BC]/25 to-transparent blur-xl pointer-events-none" />

          {/* Card Top Row */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#23103D]/90 border border-[#AB47BC]/60 flex items-center justify-center shadow-[0_0_12px_rgba(171,71,188,0.4)] backdrop-blur-md">
              <span className="material-symbols-outlined text-2xl text-[#E1BEE7]" style={{ fontVariationSettings: "'FILL' 1" }}>
                school
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#AB47BC]/25 text-[#E1BEE7] border border-[#AB47BC]/60 backdrop-blur-md shadow-sm">
              ACADEMY
            </span>
          </div>

          {/* Card Content */}
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <div className="font-headline text-base sm:text-lg font-black text-[#FAF5FF] tracking-wider drop-shadow-md">
                MASTER ACADEMY
              </div>
              <div className="font-body text-[11px] text-[#DCA2E8] font-medium leading-tight drop-shadow">
                Tactical puzzles & grandmaster openings
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#AB47BC]/20 border border-[#AB47BC]/60 flex items-center justify-center text-[#E1BEE7] group-hover:bg-[#AB47BC] group-hover:text-[#11071F] group-hover:scale-110 transition-all shadow-md shrink-0">
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </div>
          </div>
        </motion.button>

        {/* Pass & Play */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          onClick={onStartOffline}
          className="col-span-1 sm:col-span-2 group relative h-28 sm:h-32 rounded-2xl overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.85)] hover:shadow-[0_0_30px_rgba(255,152,0,0.45)] hover:-translate-y-1 active:scale-[0.98] transition-all text-left cursor-pointer border border-[#FF9800]/50 flex items-center justify-between p-4"
        >
          {/* Background Image with Ambient Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center filter brightness-[0.4] contrast-125 group-hover:scale-105 transition-transform duration-700 ease-out"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=1200')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#170B04] via-[#261308]/85 to-[#170B04]/90 pointer-events-none" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-radial from-[#FF9800]/25 to-transparent blur-xl pointer-events-none" />

          {/* Left Side Content */}
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#2D160A]/90 border border-[#FF9800]/60 flex items-center justify-center shadow-[0_0_15px_rgba(255,152,0,0.4)] backdrop-blur-md shrink-0">
              <span className="material-symbols-outlined text-3xl text-[#FFB74D]" style={{ fontVariationSettings: "'FILL' 1" }}>
                two_wheeler
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-headline text-base sm:text-lg font-black text-[#FFF8EE] tracking-wider drop-shadow-md">
                  PASS & PLAY
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-[#FF9800]/25 text-[#FFB74D] border border-[#FF9800]/60 backdrop-blur-md">
                  OFFLINE 2P
                </span>
              </div>
              <div className="font-body text-[11px] text-[#E0C0A8] font-medium leading-tight drop-shadow">
                Play locally face-to-face on the same screen
              </div>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="relative z-10 w-9 h-9 rounded-full bg-[#FF9800]/20 border border-[#FF9800]/60 flex items-center justify-center text-[#FFB74D] group-hover:bg-[#FF9800] group-hover:text-[#170B04] group-hover:scale-110 transition-all shadow-md shrink-0 ml-2">
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </div>
        </motion.button>
      </div>
    </div>
  );
};

